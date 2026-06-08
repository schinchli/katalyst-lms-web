/**
 * Minimal MCP stdio client for the AWS Documentation MCP server.
 * ────────────────────────────────────────────────────────────────────────────
 * Drives `uvx awslabs.aws-documentation-mcp-server` (configured in .mcp.json)
 * over JSON-RPC/stdio. Used at ingest/enrichment time to fetch official AWS
 * documentation as a trusted source. The deployed app does not run this — it
 * reads the cached RAG content + content_sources the ingest produced.
 *
 * Exposed tools: read_documentation, read_sections, search_documentation, recommend.
 */
import { spawn } from 'node:child_process';

export class AwsDocsMcpClient {
  constructor() {
    this.proc = null;
    this.nextId = 1;
    this.pending = new Map();
    this.buf = '';
  }

  async start() {
    this.proc = spawn('uvx', ['awslabs.aws-documentation-mcp-server'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, FASTMCP_LOG_LEVEL: 'ERROR' },
    });
    this.proc.stdout.on('data', (d) => this._onData(d.toString()));
    this.proc.stderr.on('data', () => {}); // suppress server logs

    await this._request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'lms-ingest', version: '1.0' },
    });
    this._notify('notifications/initialized');
    return this;
  }

  _onData(chunk) {
    this.buf += chunk;
    let nl;
    while ((nl = this.buf.indexOf('\n')) >= 0) {
      const line = this.buf.slice(0, nl).trim();
      this.buf = this.buf.slice(nl + 1);
      if (!line) continue;
      let msg;
      try { msg = JSON.parse(line); } catch { continue; }
      if (msg.id != null && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      }
    }
  }

  _request(method, params) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
      setTimeout(() => {
        if (this.pending.has(id)) { this.pending.delete(id); reject(new Error(`MCP timeout: ${method}`)); }
      }, 60_000);
    });
  }

  _notify(method, params) {
    this.proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
  }

  async callTool(name, args) {
    const res = await this._request('tools/call', { name, arguments: args });
    // MCP returns content as an array of {type, text}. Concatenate text parts.
    const parts = (res?.content ?? []).filter((c) => c.type === 'text').map((c) => c.text);
    return parts.join('\n');
  }

  /** Search official AWS documentation. Returns the raw result text. */
  searchDocs(query, limit = 5) {
    return this.callTool('search_documentation', { search_phrase: query, limit });
  }

  /** Fetch an AWS documentation page as markdown. */
  readDoc(url, maxLength = 8000) {
    return this.callTool('read_documentation', { url, max_length: maxLength });
  }

  stop() {
    try { this.proc?.kill(); } catch { /* ignore */ }
  }
}

#!/usr/bin/env node
/**
 * Headroom performance dashboard — localhost server.
 *
 * Serves a self-contained dashboard and proxies the Headroom proxy's stats
 * endpoints (avoids CORS + gives a clean "offline" state when Headroom isn't
 * running). No dependencies — Node stdlib only.
 *
 *   1. Start Headroom:   headroom proxy --port 8787     (pip install "headroom-ai[all]")
 *   2. Start dashboard:  node scripts/headroom-dashboard/serve.mjs
 *   3. Open:             http://localhost:8799
 *
 * Env: HEADROOM_URL (default http://localhost:8787), PORT (default 8799).
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const HEADROOM_URL = (process.env.HEADROOM_URL || 'http://localhost:8787').replace(/\/$/, '');
const PORT = Number(process.env.PORT || 8799);

const UPSTREAM = { stats: '/stats', metrics: '/metrics', history: '/stats-history', health: '/health' };

async function proxy(endpoint) {
  const url = `${HEADROOM_URL}${UPSTREAM[endpoint]}`;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    clearTimeout(t);
    const text = await res.text();
    return { ok: res.ok, status: res.status, body: text };
  } catch (err) {
    return { ok: false, offline: true, error: String(err?.message || err) };
  }
}

const server = http.createServer(async (req, res) => {
  const send = (code, body, type = 'application/json') => {
    res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(body);
  };

  if (req.url === '/' || req.url === '/index.html') {
    try {
      send(200, fs.readFileSync(path.join(DIR, 'index.html')), 'text/html; charset=utf-8');
    } catch {
      send(500, 'dashboard html missing');
    }
    return;
  }

  const m = req.url?.match(/^\/api\/(stats|metrics|history|health)$/);
  if (m) {
    const r = await proxy(m[1]);
    if (r.offline) return send(200, JSON.stringify({ offline: true, headroomUrl: HEADROOM_URL, error: r.error }));
    return send(200, JSON.stringify({ offline: false, status: r.status, endpoint: m[1], raw: r.body }));
  }

  // POST /api/compress — forward a sample payload to the proxy's /v1/compress
  // so the dashboard can demonstrate real compression without proxy passthrough.
  if (req.method === 'POST' && req.url === '/api/compress') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 5_000_000) req.destroy(); });
    req.on('end', async () => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 60_000);
        const res = await fetch(`${HEADROOM_URL}/v1/compress`, {
          method: 'POST', signal: ctrl.signal,
          headers: { 'Content-Type': 'application/json' }, body,
        });
        clearTimeout(t);
        send(200, JSON.stringify({ offline: false, status: res.status, raw: await res.text() }));
      } catch (err) {
        send(200, JSON.stringify({ offline: true, error: String(err?.message || err) }));
      }
    });
    return;
  }

  send(404, JSON.stringify({ error: 'not found' }));
});

server.listen(PORT, () => {
  console.log(`\n  Headroom dashboard → http://localhost:${PORT}`);
  console.log(`  Proxying stats from → ${HEADROOM_URL}`);
  console.log(`  (start Headroom with:  headroom proxy --port 8787 )\n`);
});

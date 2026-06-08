#!/usr/bin/env node
/**
 * Ingest official AWS documentation into RAG via the AWS Documentation MCP server.
 * ────────────────────────────────────────────────────────────────────────────
 * For each curated source URL, calls the MCP `read_documentation` tool to fetch
 * the page as markdown (trusted, official content), chunks it, embeds via OpenAI,
 * and upserts into knowledge_chunks (corpus='aws-docs') with the source URL,
 * title, and retrieved_at timestamp in metadata.
 *
 * This is the Phase 2 integration: AWS MCP is the trusted source; results are
 * cached in RAG so the deployed app never needs to call MCP at runtime and
 * falls back to ingested content.
 *
 * Usage: node scripts/ingest-aws-docs.mjs [--limit N]
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { AwsDocsMcpClient } from './mcp-client.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function env(name, fallbackNames = []) {
  if (process.env[name]) return process.env[name];
  try {
    const txt = readFileSync(join(ROOT, 'apps/web/.env.local'), 'utf8');
    for (const n of [name, ...fallbackNames]) {
      const m = txt.match(new RegExp(`^${n}="?([^"\\n]+)`, 'm'));
      if (m) return m[1].replace(/\\n$/, '').trim();
    }
  } catch { /* ignore */ }
  return undefined;
}

const SUPABASE_URL = env('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_KEY = env('SUPABASE_SERVICE_ROLE_KEY');
const OPENAI_KEY = env('OPENAI_API_KEY');
if (!SUPABASE_URL || !SERVICE_KEY || !OPENAI_KEY) {
  console.error('Missing Supabase or OpenAI env'); process.exit(1);
}

// Curated set: one primary official doc per Architecting module topic.
const TARGETS = [
  { key: 'doc-iam', module: 'arch-m02', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html', title: 'IAM Security Best Practices' },
  { key: 'doc-vpc', module: 'arch-m03', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html', title: 'What is Amazon VPC?' },
  { key: 'doc-ec2', module: 'arch-m04', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-types.html', title: 'Amazon EC2 instance types' },
  { key: 'doc-s3', module: 'arch-m05', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html', title: 'Amazon S3 storage classes' },
  { key: 'doc-rds', module: 'arch-m06', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html', title: 'Amazon RDS Multi-AZ' },
  { key: 'doc-cloudwatch', module: 'arch-m07', url: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/working_with_metrics.html', title: 'Using CloudWatch metrics' },
  { key: 'doc-cloudformation', module: 'arch-m08', url: 'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-whatis-concepts.html', title: 'CloudFormation concepts' },
  { key: 'doc-ecs', module: 'arch-m09', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html', title: 'What is Amazon ECS?' },
  { key: 'doc-transitgateway', module: 'arch-m10', url: 'https://docs.aws.amazon.com/vpc/latest/tgw/what-is-transit-gateway.html', title: 'What is a Transit Gateway?' },
  { key: 'doc-lambda', module: 'arch-m11', url: 'https://docs.aws.amazon.com/lambda/latest/dg/welcome.html', title: 'What is AWS Lambda?' },
  { key: 'doc-cloudfront', module: 'arch-m12', url: 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html', title: 'What is Amazon CloudFront?' },
  { key: 'doc-backup', module: 'arch-m13', url: 'https://docs.aws.amazon.com/aws-backup/latest/devguide/whatisbackup.html', title: 'What is AWS Backup?' },
];

const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

function chunk(text, size = 1800, overlap = 200) {
  const out = [];
  for (let i = 0; i < text.length; i += size - overlap) out.push(text.slice(i, i + size));
  return out.filter((c) => c.trim().length > 100);
}

async function embed(texts) {
  const r = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: texts.map((t) => t.slice(0, 8000)) }),
  });
  if (!r.ok) throw new Error(`OpenAI ${r.status}: ${await r.text()}`);
  return (await r.json()).data.map((d) => d.embedding);
}

async function upsert(rows) {
  const r = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/knowledge_chunks?on_conflict=corpus,content_hash`, {
    method: 'POST',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(rows),
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
}

const limit = (() => { const i = process.argv.indexOf('--limit'); return i >= 0 ? Number(process.argv[i + 1]) : TARGETS.length; })();

const mcp = new AwsDocsMcpClient();
console.log('Starting AWS Documentation MCP server…');
await mcp.start();

let totalChunks = 0;
const retrievedAt = new Date().toISOString();
for (const target of TARGETS.slice(0, limit)) {
  process.stdout.write(`  ${target.key} (${target.module}) … `);
  let md;
  try {
    md = await mcp.readDoc(target.url, 8000);
  } catch (e) {
    console.log(`MCP read failed: ${e.message}`); continue;
  }
  if (!md || md.length < 200) { console.log('empty'); continue; }

  const chunks = chunk(md);
  const embeddings = await embed(chunks);
  const rows = chunks.map((c, j) => {
    const content = `AWS Documentation: ${target.title}\nSource: ${target.url}\n\n${c}`.slice(0, 4000);
    return {
      corpus: 'aws-docs',
      source_type: 'aws_documentation',
      content_hash: sha(content),
      title: `${target.title} (part ${j + 1})`,
      content,
      embedding: embeddings[j],
      metadata: {
        source_key: target.key, module: target.module, source_url: target.url,
        doc_title: target.title, retrieved_at: retrievedAt, trust_level: 100,
        provider: 'aws-documentation-mcp',
      },
    };
  });
  await upsert(rows);
  totalChunks += rows.length;
  console.log(`${rows.length} chunks`);
}

mcp.stop();
console.log(`\n✅ Ingested ${totalChunks} official AWS-doc chunks (corpus 'aws-docs') via the AWS Documentation MCP server.`);

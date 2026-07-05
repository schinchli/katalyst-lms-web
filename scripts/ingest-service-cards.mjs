#!/usr/bin/env node
/**
 * Ingest the AWS service W5 cards (data/awsServiceCards.ts) into RAG.
 * ────────────────────────────────────────────────────────────────────────────
 * One knowledge chunk per service — the composed What/Why/When/Where/How text
 * plus exam tips — embedded via OpenAI and upserted into knowledge_chunks
 * (corpus='aws-services', idempotent on content_hash). Ask AI and the
 * recommendation engine can then retrieve service explainers and deep-link
 * to /learn/aws-services/<id>.
 *
 * Requires Node ≥ 23.6 (native TS type-stripping) — the data file is pure
 * typed data with no imports, so it loads directly.
 *
 * Usage: node scripts/ingest-service-cards.mjs [--dry-run]
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function env(name) {
  if (process.env[name]) return process.env[name];
  try {
    const txt = readFileSync(join(ROOT, 'apps/web/.env.local'), 'utf8');
    const m = txt.match(new RegExp(`^${name}="?([^"\\n]+)`, 'm'));
    if (m) return m[1].trim();
  } catch { /* ignore */ }
  return undefined;
}

const SUPABASE_URL = env('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_KEY = env('SUPABASE_SERVICE_ROLE_KEY');
const OPENAI_KEY = env('OPENAI_API_KEY');
const DRY = process.argv.includes('--dry-run');
if (!DRY && (!SUPABASE_URL || !SERVICE_KEY || !OPENAI_KEY)) {
  console.error('Missing Supabase or OpenAI env'); process.exit(1);
}

const { AWS_SERVICE_CARDS } = await import('../apps/web/src/data/awsServiceCards.ts');

const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

function cardText(c) {
  return [
    `AWS Service Explainer: ${c.name} (${c.category})`,
    c.tagline,
    `What is it? ${c.what}`,
    `Why does it exist? ${c.why}`,
    `When should you use it? ${c.when}`,
    `Where does it fit in an architecture? ${c.where}`,
    `How do you integrate it? ${c.how}`,
    `Commonly integrated with: ${c.integrations.join(', ')}.`,
    `Exam tips: ${c.examTips.join(' ')}`,
  ].join('\n').slice(0, 4000);
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

const retrievedAt = new Date().toISOString();
const texts = AWS_SERVICE_CARDS.map(cardText);
console.log(`Ingesting ${texts.length} service cards (corpus=aws-services)…`);
if (DRY) {
  console.log(texts[0].slice(0, 300));
  console.log('--dry-run: no embed/upsert'); process.exit(0);
}

const embeddings = await embed(texts);
const rows = AWS_SERVICE_CARDS.map((c, i) => ({
  corpus: 'aws-services',
  source_type: 'service_card',
  content_hash: sha(texts[i]),
  title: `${c.name} — What/Why/When/Where/How`,
  content: texts[i],
  embedding: embeddings[i],
  metadata: {
    service_id: c.id,
    category: c.category,
    paths: c.paths,
    source_url: `/learn/aws-services/${c.id}`,
    docs_url: c.docsUrl,
    retrieved_at: retrievedAt,
    trust_level: 90,
    provider: 'learnkloud-service-cards',
  },
}));
await upsert(rows);
console.log(`✅ Upserted ${rows.length} chunks into knowledge_chunks (corpus=aws-services)`);

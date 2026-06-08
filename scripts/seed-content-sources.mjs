#!/usr/bin/env node
/**
 * Seeds the public.content_sources table from the curated registry in
 * apps/web/src/lib/sources.ts. Idempotent (upsert on source_key).
 *
 * Prereq: migration 017_content_sources_and_graph.sql applied.
 * Usage:  SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/seed-content-sources.mjs
 *         (or it reads apps/web/.env.local automatically)
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function fromEnvFile(name) {
  try {
    const txt = readFileSync(join(ROOT, 'apps/web/.env.local'), 'utf8');
    const m = txt.match(new RegExp(`^${name}="?([^"\\n]+)`, 'm'));
    return m ? m[1].replace(/\\n$/, '').trim() : undefined;
  } catch { return undefined; }
}

const SUPABASE_URL = process.env.SUPABASE_URL || fromEnvFile('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || fromEnvFile('SUPABASE_SERVICE_ROLE_KEY');
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Parse the curated sources out of the TS registry without bundling TS.
const src = readFileSync(join(ROOT, 'apps/web/src/lib/sources.ts'), 'utf8');
const rows = [];
const re = /t\(\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'(?:,\s*'([^']+)')?(?:,\s*(\d+))?/g;
let m;
while ((m = re.exec(src)) !== null) {
  const [, key, title, url, sourceType = 'aws_docs', trust = '100'] = m;
  rows.push({
    source_key: key,
    title,
    source_url: url,
    source_type: sourceType,
    trust_level: Number(trust),
    verified_at: new Date().toISOString(),
    metadata: {},
  });
}

console.log(`Upserting ${rows.length} content_sources…`);
const res = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/content_sources?on_conflict=source_key`, {
  method: 'POST',
  headers: {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates',
  },
  body: JSON.stringify(rows),
});
if (!res.ok) {
  console.error('Seed failed:', res.status, await res.text());
  process.exit(1);
}
console.log(`✅ Seeded ${rows.length} sources into content_sources.`);

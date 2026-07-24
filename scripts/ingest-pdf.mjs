#!/usr/bin/env node
/**
 * Ingest PDF documents into RAG (knowledge_chunks).
 * ────────────────────────────────────────────────────────────────────────────
 * Extracts text per page via poppler `pdftotext` (no npm deps), chunks it with
 * paragraph-aware splitting, embeds via OpenAI text-embedding-3-small (1536-d),
 * and upserts into knowledge_chunks with idempotency on (corpus, content_hash).
 *
 * Ingested chunks are immediately visible to /api/rag/search, /api/rag/ask and
 * /api/recommendations — the recommendation engine searches all corpora.
 *
 * Requires: poppler (`brew install poppler`) + OPENAI_API_KEY,
 * NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (read from env or
 * apps/web/.env.local).
 *
 * Usage:
 *   node scripts/ingest-pdf.mjs --pdf <file.pdf | dir/> --corpus <name> [options]
 *
 * Options:
 *   --pdf <path>          PDF file or directory of PDFs (required)
 *   --corpus <name>       Corpus tag, e.g. 'scs-c03-guide' (required)
 *   --title "<text>"      Document title (default: filename)
 *   --module <id>         Module id stored in metadata, e.g. 'sec-eng-m03'
 *   --source-type <type>  source_type column (default: 'pdf')
 *   --replace             Delete this file's previous chunks in the corpus first
 *   --dry-run             Extract + chunk only; print stats, no API calls
 *
 * Examples:
 *   node scripts/ingest-pdf.mjs --pdf ~/Downloads/exam-guide.pdf --corpus sap-c02 --dry-run
 *   node scripts/ingest-pdf.mjs --pdf ~/Docs/guides/ --corpus cert-guides --replace
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── CLI args ────────────────────────────────────────────────────────────────
function arg(name, fallback = undefined) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}
const flag = (name) => process.argv.includes(`--${name}`);

const PDF_PATH = arg('pdf');
const CORPUS = arg('corpus');
const TITLE = arg('title');
const MODULE = arg('module');
const SOURCE_TYPE = arg('source-type', 'pdf');
const DRY_RUN = flag('dry-run');
const REPLACE = flag('replace');

if (!PDF_PATH || !CORPUS) {
  console.error('Usage: node scripts/ingest-pdf.mjs --pdf <file|dir> --corpus <name> [--title "…"] [--module <id>] [--source-type pdf] [--replace] [--dry-run]');
  process.exit(1);
}

// ── env (same pattern as ingest-aws-docs.mjs) ───────────────────────────────
function env(name) {
  if (process.env[name]) return process.env[name];
  try {
    const txt = readFileSync(join(ROOT, 'apps/web/.env.local'), 'utf8');
    const m = txt.match(new RegExp(`^${name}="?([^"\\n]+)`, 'm'));
    if (m) return m[1].replace(/\\n$/, '').trim();
  } catch { /* ignore */ }
  return undefined;
}

const SUPABASE_URL = env('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_KEY = env('SUPABASE_SERVICE_ROLE_KEY');
const OPENAI_KEY = env('OPENAI_API_KEY');
if (!DRY_RUN && (!SUPABASE_URL || !SERVICE_KEY || !OPENAI_KEY)) {
  console.error('Missing Supabase or OpenAI env (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY)');
  process.exit(1);
}

// ── PDF text extraction (poppler, per-page via form-feed markers) ───────────
function extractPages(pdfFile) {
  let raw;
  try {
    raw = execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', pdfFile, '-'], {
      encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    });
  } catch (e) {
    throw new Error(`pdftotext failed for ${pdfFile}: ${e.message} (brew install poppler?)`);
  }
  return raw.split('\f').map((page) =>
    page
      .replace(/[ \t]+\n/g, '\n')     // trailing spaces from -layout
      .replace(/[ \t]{3,}/g, '  ')    // collapse column gaps
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
  );
}

// ── paragraph-aware chunking with page tracking ─────────────────────────────
const CHUNK_SIZE = 1800;
const CHUNK_OVERLAP = 200;
const MIN_CHUNK = 100;

function chunkPages(pages) {
  // Flatten to paragraphs, each tagged with its 1-based page number.
  const paras = [];
  pages.forEach((page, i) => {
    for (const p of page.split(/\n\n+/)) {
      const t = p.trim();
      if (t) paras.push({ text: t, page: i + 1 });
    }
  });

  const chunks = [];
  let buf = [];
  let len = 0;
  const flush = () => {
    if (!len) return;
    const text = buf.map((b) => b.text).join('\n\n');
    if (text.trim().length >= MIN_CHUNK) {
      chunks.push({ text, pageStart: buf[0].page, pageEnd: buf[buf.length - 1].page });
    }
    // keep tail paragraphs as overlap for the next chunk
    let keep = [];
    let keepLen = 0;
    for (let i = buf.length - 1; i >= 0 && keepLen < CHUNK_OVERLAP; i--) {
      keep.unshift(buf[i]);
      keepLen += buf[i].text.length;
    }
    buf = keep;
    len = keepLen;
  };

  for (const p of paras) {
    // A single paragraph longer than CHUNK_SIZE gets hard-split.
    if (p.text.length > CHUNK_SIZE) {
      flush();
      for (let i = 0; i < p.text.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
        const slice = p.text.slice(i, i + CHUNK_SIZE);
        if (slice.trim().length >= MIN_CHUNK) {
          chunks.push({ text: slice, pageStart: p.page, pageEnd: p.page });
        }
      }
      buf = []; len = 0;
      continue;
    }
    if (len + p.text.length > CHUNK_SIZE) flush();
    buf.push(p);
    len += p.text.length;
  }
  flush();
  return chunks;
}

// ── OpenAI + Supabase (same endpoints as ingest-aws-docs.mjs) ───────────────
const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

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

async function deleteFileChunks(corpus, sourceFile) {
  const params = new URLSearchParams({ corpus: `eq.${corpus}`, 'metadata->>source_file': `eq.${sourceFile}` });
  const r = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/knowledge_chunks?${params}`, {
    method: 'DELETE',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, Prefer: 'count=exact' },
  });
  if (!r.ok) throw new Error(`Supabase delete ${r.status}: ${await r.text()}`);
  return Number(r.headers.get('content-range')?.split('/')[1] ?? 0);
}

// ── main ────────────────────────────────────────────────────────────────────
const target = resolve(PDF_PATH);
const files = statSync(target).isDirectory()
  ? readdirSync(target).filter((f) => f.toLowerCase().endsWith('.pdf')).sort().map((f) => join(target, f))
  : [target];

if (!files.length) { console.error(`No PDFs found at ${target}`); process.exit(1); }

const retrievedAt = new Date().toISOString();
let totalChunks = 0;

for (const file of files) {
  const fileName = basename(file);
  const docTitle = (TITLE && files.length === 1) ? TITLE : fileName.replace(/\.pdf$/i, '');
  process.stdout.write(`${fileName} … `);

  const pages = extractPages(file);
  const chunks = chunkPages(pages);
  if (!chunks.length) { console.log('no extractable text (scanned/image PDF? needs OCR)'); continue; }

  if (DRY_RUN) {
    const chars = chunks.reduce((n, c) => n + c.text.length, 0);
    console.log(`${pages.length} pages → ${chunks.length} chunks (${chars} chars) [dry-run]`);
    console.log(`  first chunk (p${chunks[0].pageStart}): ${chunks[0].text.slice(0, 160).replace(/\n/g, ' ')}…`);
    totalChunks += chunks.length;
    continue;
  }

  if (REPLACE) {
    const deleted = await deleteFileChunks(CORPUS, fileName);
    process.stdout.write(`replaced ${deleted} old rows … `);
  }

  // Embed + upsert in batches to stay under request-size limits.
  const BATCH = 64;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH);
    const embeddings = await embed(batch.map((c) => c.text));
    const rows = batch.map((c, j) => {
      const content = `${docTitle} (p.${c.pageStart}${c.pageEnd !== c.pageStart ? `–${c.pageEnd}` : ''})\n\n${c.text}`.slice(0, 4000);
      return {
        corpus: CORPUS,
        source_type: SOURCE_TYPE,
        content_hash: sha(content),
        title: `${docTitle} (part ${i + j + 1})`,
        content,
        embedding: embeddings[j],
        metadata: {
          source_file: fileName,
          doc_title: docTitle,
          page_start: c.pageStart,
          page_end: c.pageEnd,
          ...(MODULE ? { module: MODULE } : {}),
          retrieved_at: retrievedAt,
          provider: 'pdf-ingest',
        },
      };
    });
    await upsert(rows);
    process.stdout.write(`${Math.min(i + BATCH, chunks.length)}/${chunks.length} `);
  }
  console.log(`✓ (${pages.length} pages → ${chunks.length} chunks)`);
  totalChunks += chunks.length;
}

console.log(`\nDone: ${files.length} file(s), ${totalChunks} chunks${DRY_RUN ? ' (dry-run, nothing written)' : ` → knowledge_chunks corpus='${CORPUS}'`}`);

/**
 * POST /api/admin/rag-ingest
 * ─────────────────────────
 * One-shot ingestion of LMS content (questions + flashcards) into
 * knowledge_chunks. Embeds via OpenAI text-embedding-3-small, upserts
 * with idempotency on (corpus, content_hash). Auth via x-setup-token.
 *
 * Run once (from a new terminal while `npm run dev` is running):
 *   curl -X POST http://localhost:8080/api/admin/rag-ingest \
 *     -H "x-setup-token: <SETUP_TOKEN>" \
 *     -H "Content-Type: application/json" \
 *     -d '{"dryRun": false}'
 *
 * Restrict corpora:
 *   -d '{"corpus": ["clf-c02", "aip-c01"]}'
 */
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimiter';
import { logger } from '@/lib/logger';
import type { Question } from '@/types';
import type { FlashcardDeck, Flashcard } from '@/data/flashcards';
import { flashcardDecks } from '@/data/flashcards';
import { eksCoreksFlashcardDecks } from '@/data/eks-coreks-flashcards';
import { LEARNING_PATHS, type LearningPath, type LearningStep } from '@/data/learningPaths';
import { clfC02ModuleQuestions } from '@/data/clf-c02-module-questions';
import { MODULE_NOTES, type ModuleNotes, type NoteSection } from '@/data/moduleNotes';
import {
  clf02CloudConceptsQuestions,
  clf02SecurityQuestions,
  clf02BillingQuestions,
  clf02TechnologyQuestions,
} from '@/data/clf-c02-questions';
import {
  aipC01RagFoundationsQuestions,
  aipC01SecurityOpsQuestions,
  aipC01AdvancedPatternsQuestions,
} from '@/data/aip-c01-questions';
import {
  eksCoreksM01Questions,
  eksCoreksM02Questions,
  eksCoreksM03Questions,
  eksCoreksM04Questions,
  eksCoreksM05Questions,
  eksCoreksM06Questions,
  eksCoreksM07Questions,
  eksCoreksM08Questions,
  eksCoreksM09Questions,
} from '@/data/eks-coreks-questions';

export const runtime = 'nodejs';
export const maxDuration = 300;

const SETUP_TOKEN = process.env.SETUP_TOKEN;
const EMBED_MODEL = 'text-embedding-3-small';
const EMBED_BATCH = 50;

interface ChunkRow {
  corpus:       string;
  source_type:  string;
  content_hash: string;
  title:        string | null;
  content:      string;
  metadata:     Record<string, unknown>;
}

function sha256Hex(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

function questionContent(q: Question): string {
  const correctText = q.options.find((o) => o.id === q.correctOptionId)?.text ?? '';
  return `Q: ${q.text}\n\nCorrect: ${correctText}\n\nExplanation: ${q.explanation ?? ''}`.trim();
}

function questionTitle(q: Question): string {
  const t = q.text.replace(/\s+/g, ' ').trim();
  return t.length > 200 ? t.slice(0, 197) + '…' : t;
}

function questionChunk(corpus: string, q: Question): ChunkRow {
  const content = questionContent(q).slice(0, 4000);
  return {
    corpus,
    source_type: 'quiz_question',
    content_hash: sha256Hex(content),
    title: questionTitle(q),
    content,
    metadata: {
      question_id: q.id,
      quiz_id:     q.quizId ?? null,
      category:    q.category ?? null,
      difficulty:  q.difficulty ?? null,
      doc_url:     q.docUrl ?? null,
    },
  };
}

function flashcardChunk(corpus: string, deck: FlashcardDeck, card: Flashcard): ChunkRow {
  const content = `Q: ${card.front}\n\nA: ${card.back}`.slice(0, 4000);
  return {
    corpus,
    source_type: 'flashcard',
    content_hash: sha256Hex(content),
    title: card.front.length > 200 ? card.front.slice(0, 197) + '…' : card.front,
    content,
    metadata: {
      card_id:  card.id,
      deck_id:  deck.id,
      deck_title: deck.title,
      category: deck.category,
    },
  };
}

function learningPathChunk(path: LearningPath, step: LearningStep): ChunkRow {
  const content = [
    `Learning Path: ${path.certName}`,
    `Certification: ${path.certCode} | Difficulty: ${path.difficulty} | Total: ${path.totalHours}h`,
    `Tagline: ${path.tagline}`,
    ``,
    `Step: ${step.title}`,
    `Type: ${step.type} | Duration: ${step.estimatedMinutes} min`,
    `Description: ${step.subtitle}`,
    `Why: ${step.why}`,
  ].join('\n').slice(0, 4000);

  const title = `${path.certCode}: ${step.title}`;
  return {
    corpus: 'learning-paths',
    source_type: 'learning_step',
    content_hash: sha256Hex(content),
    title: title.length > 200 ? title.slice(0, 197) + '…' : title,
    content,
    metadata: {
      path_id:    path.id,
      cert_code:  path.certCode,
      step_id:    step.id,
      step_type:  step.type,
      resource_id: step.resourceId,
      difficulty: path.difficulty,
    },
  };
}

function noteSectionChunk(notes: ModuleNotes, section: NoteSection, idx: number): ChunkRow {
  const content = [
    `Module: ${notes.title}`,
    `Section: ${section.heading}`,
    ``,
    section.body,
    section.keyPoints?.length ? `\nKey points:\n- ${section.keyPoints.join('\n- ')}` : '',
  ].filter(Boolean).join('\n').slice(0, 4000);

  return {
    corpus: 'module-notes',
    source_type: 'notes',
    content_hash: sha256Hex(content),
    title: `${notes.title}: ${section.heading}`.slice(0, 200),
    content,
    metadata: {
      module_id: notes.moduleId,
      module_title: notes.title,
      section_index: idx,
      has_diagram: Boolean(section.diagram),
    },
  };
}

function buildCorpusChunks(): Record<string, ChunkRow[]> {
  // Question banks
  const clfQs: Question[] = [
    ...clf02CloudConceptsQuestions,
    ...clf02SecurityQuestions,
    ...clf02TechnologyQuestions,
    ...clf02BillingQuestions,
  ];
  const aipQs: Question[] = [
    ...aipC01RagFoundationsQuestions,
    ...aipC01SecurityOpsQuestions,
    ...aipC01AdvancedPatternsQuestions,
  ];
  const eksQs: Question[] = [
    ...eksCoreksM01Questions, ...eksCoreksM02Questions, ...eksCoreksM03Questions,
    ...eksCoreksM04Questions, ...eksCoreksM05Questions, ...eksCoreksM06Questions,
    ...eksCoreksM07Questions, ...eksCoreksM08Questions, ...eksCoreksM09Questions,
  ];

  // Generic flashcards: skip EKS decks — they're covered by the learnk8s
  // ingestion pipeline (source_type='flashcard', corpus='eks-coreks').
  const eksDeckIds = new Set(eksCoreksFlashcardDecks.map((d) => d.id));
  const genericDecks = flashcardDecks.filter((d) => !eksDeckIds.has(d.id));

  // Group PPT module questions by module corpus
  const pptByModule: Record<string, Question[]> = {};
  for (const q of clfC02ModuleQuestions) {
    const mid = q.id.split('-q')[0].replace('ppt-', '');
    if (!pptByModule[mid]) pptByModule[mid] = [];
    pptByModule[mid].push(q);
  }

  const out: Record<string, ChunkRow[]> = {
    'clf-c02':   clfQs.map((q) => questionChunk('clf-c02',   q)),
    'aip-c01':   aipQs.map((q) => questionChunk('aip-c01',   q)),
    'eks-coreks-questions': eksQs.map((q) => questionChunk('eks-coreks-questions', q)),
    'flashcards': genericDecks.flatMap((deck) =>
      deck.cards.map((card) => flashcardChunk('flashcards', deck, card)),
    ),
    'learning-paths': LEARNING_PATHS.flatMap((path) =>
      path.steps.map((step) => learningPathChunk(path, step)),
    ),
    // Module reading notes — detailed study material per CLF-C02 module
    'module-notes': Object.values(MODULE_NOTES).flatMap((notes) =>
      notes.sections.map((section, i) => noteSectionChunk(notes, section, i)),
    ),
    // CLF-C02 module question banks (from the AWS Cloud Practitioner Essentials curriculum)
    ...Object.fromEntries(
      Object.entries(pptByModule).map(([mid, qs]) => [
        mid,
        qs.map((q) => questionChunk(mid, q)),
      ])
    ),
  };
  return out;
}

const ingestSchema = z.object({
  corpus:  z.array(z.string()).optional(),
  dryRun:  z.boolean().optional().default(false),
  batchSize: z.number().int().min(1).max(100).optional().default(EMBED_BATCH),
});

export async function POST(req: NextRequest) {
  if (Number(req.headers.get('content-length') ?? '0') > 4_000) {
    return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
  }
  const ROUTE = '/api/admin/rag-ingest';
  const ip    = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!(await checkRateLimit(`rag-ingest:${ip}`, 3, 60_000))) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  if (!SETUP_TOKEN || req.headers.get('x-setup-token') !== SETUP_TOKEN.trim()) {
    logger.authFail(ROUTE, 'invalid_setup_token', { ip });
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let raw: unknown = {};
  if (Number(req.headers.get('content-length') ?? '0') > 0) {
    try { raw = await req.json(); }
    catch { return NextResponse.json({ ok: false, error: 'invalid JSON body' }, { status: 400 }); }
  }
  const parsed = ingestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }
  const { corpus: corpusFilter, dryRun, batchSize } = parsed.data;

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const OPENAI_KEY   = process.env.OPENAI_API_KEY?.trim();
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ ok: false, error: 'Supabase env not configured' }, { status: 500 });
  }
  if (!dryRun && !OPENAI_KEY) {
    return NextResponse.json({ ok: false, error: 'OPENAI_API_KEY not set' }, { status: 500 });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  const oai = dryRun ? null : new OpenAI({ apiKey: OPENAI_KEY });

  const allChunks = buildCorpusChunks();
  const corpora = corpusFilter && corpusFilter.length
    ? corpusFilter.filter((c) => c in allChunks)
    : Object.keys(allChunks);

  const startedAt = Date.now();
  const result: Record<string, { total: number; inserted: number; skipped: number; errors: number }> = {};

  for (const corpus of corpora) {
    const chunks = allChunks[corpus];
    let inserted = 0, errors = 0;

    if (dryRun) {
      result[corpus] = { total: chunks.length, inserted: 0, skipped: chunks.length, errors: 0 };
      continue;
    }

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      try {
        const emb = await oai!.embeddings.create({
          model: EMBED_MODEL,
          input: batch.map((c) => c.content.slice(0, 8000)),
        });
        const rows = batch.map((c, j) => ({ ...c, embedding: emb.data[j].embedding }));
        const { error } = await sb
          .from('knowledge_chunks')
          .upsert(rows, { onConflict: 'corpus,content_hash', ignoreDuplicates: true });
        if (error) {
          errors += batch.length;
          logger.error(ROUTE, 'batch_upsert_failed', { corpus, reason: error.message });
        } else {
          inserted += batch.length;
        }
      } catch (err) {
        errors += batch.length;
        const msg = err instanceof Error ? err.message : 'unknown';
        logger.error(ROUTE, 'batch_embed_failed', { corpus, reason: msg });
      }
    }

    result[corpus] = {
      total:    chunks.length,
      inserted,
      skipped:  0,
      errors,
    };
  }

  // Final count from DB
  const { count: liveCount } = await sb
    .from('knowledge_chunks')
    .select('id', { count: 'exact', head: true });

  logger.info(ROUTE, 'ingestion_complete', { ip, durationMs: Date.now() - startedAt, result });
  return NextResponse.json({
    ok: true,
    dryRun,
    durationMs: Date.now() - startedAt,
    per_corpus: result,
    live_total_rows: liveCount,
  });
}

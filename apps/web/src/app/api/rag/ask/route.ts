import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { embedQuery, semanticSearch, generateAnswer, RAG_DECLINE_MESSAGE, type KbHit } from '@/lib/rag';
import { buildRagResources } from '@/lib/ragResources';
import { checkRateLimit } from '@/lib/rateLimiter';
import { nextPages, prerequisiteModules } from '@/data/eks-coreks-graph';

export const runtime = 'nodejs';
export const maxDuration = 30;

/** Per-user daily Ask AI search cap. Configurable via env (default 5). */
const DAILY_LIMIT = (() => {
  const n = Number(process.env.RAG_DAILY_LIMIT);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 5;
})();
const DAY_MS = 86_400_000;
const DAILY_LIMIT_MESSAGE =
  process.env.RAG_DAILY_LIMIT_MESSAGE?.trim() ||
  `You've reached today's limit of ${DAILY_LIMIT} Ask AI questions. Please come back tomorrow.`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
} as const;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

const corpusArray = z
  .union([z.string(), z.array(z.string())])
  .transform((v) => (Array.isArray(v) ? v : v.split(',').map((s) => s.trim()).filter(Boolean)))
  .pipe(z.array(z.string().min(1).max(60)).max(10));

const learnerContextSchema = z.object({
  activePathId: z.string().min(1).max(64),
  activePathName: z.string().min(1).max(120),
  examCode: z.string().min(1).max(24),
  weakTopic: z.string().min(1).max(160).optional(),
  averageScore: z.number().min(0).max(100).optional(),
  recentAttempts: z.number().int().min(0).max(10_000),
  nextRecommendation: z.object({
    type: z.enum(['video', 'quiz', 'flashcard']),
    title: z.string().min(1).max(180),
    reason: z.string().min(1).max(300),
  }).optional(),
});

const askSchema = z.object({
  question: z.string().min(1).max(2000),
  corpus:   corpusArray.optional().nullable(),
  source:   z.string().min(1).max(40).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  concept:  z.string().max(100).optional().nullable(),  // EKS graph-boost (only meaningful for corpus=eks-coreks)
  learnerContext: learnerContextSchema.optional(),
});

function formatLearnerContext(context: z.infer<typeof learnerContextSchema>): string {
  return [
    `Active path: ${context.activePathName} (${context.examCode}; id ${context.activePathId})`,
    context.weakTopic ? `Current weak topic: ${context.weakTopic}` : null,
    context.averageScore !== undefined ? `Current path average: ${context.averageScore}%` : null,
    `Recent attempts in this path: ${context.recentAttempts}`,
    context.nextRecommendation
      ? `Recommended next: ${context.nextRecommendation.type} — ${context.nextRecommendation.title}. Reason: ${context.nextRecommendation.reason}`
      : null,
  ].filter(Boolean).join('\n');
}

function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

export async function POST(req: NextRequest) {
  if (Number(req.headers.get('content-length') ?? '0') > 8_000) {
    return json({ ok: false, error: 'Payload too large' }, 413);
  }
  const ip = clientIp(req);

  if (!(await checkRateLimit(`rag-ask:${ip}`, 20, 60_000))) {
    return json({ ok: false, error: 'Too many requests' }, 429);
  }

  let raw: unknown;
  try { raw = await req.json(); }
  catch { return json({ ok: false, error: 'invalid JSON body' }, 400); }

  const parsed = askSchema.safeParse(raw);
  if (!parsed.success) {
    return json({ ok: false, error: parsed.error.flatten() }, 400);
  }
  const { question, corpus, source, metadata, concept, learnerContext } = parsed.data;
  const corporaFilter = corpus && corpus.length ? corpus : null;

  // Per-user daily cap (configurable). Only valid questions consume a slot.
  if (!(await checkRateLimit(`rag-ask-daily:${ip}`, DAILY_LIMIT, DAY_MS))) {
    return json({
      ok: false,
      code: 'daily_limit',
      dailyLimit: DAILY_LIMIT,
      error: DAILY_LIMIT_MESSAGE,
    }, 429);
  }

  try {
    const retrievalQuery = learnerContext
      ? [
          question,
          learnerContext.activePathName,
          learnerContext.examCode,
          learnerContext.weakTopic,
          learnerContext.nextRecommendation?.title,
        ].filter(Boolean).join('. ')
      : question;
    const embedding = await embedQuery(retrievalQuery);

    const primary = await semanticSearch(embedding, {
      matchCount:     12,
      filterCorpus:   corporaFilter,
      filterSource:   source ?? null,
      filterMetadata: metadata && Object.keys(metadata).length ? metadata : null,
    });

    // Graph-boost: when querying the EKS course with a specific concept,
    // pull in chunks from the prerequisite-concept modules.
    let pool: KbHit[] = [...primary];
    const isEksOnly = corporaFilter && corporaFilter.length === 1 && corporaFilter[0] === 'eks-coreks';
    if (concept && isEksOnly) {
      const prereq = prerequisiteModules(`concept:${concept}`);
      if (prereq.length) {
        const moduleFilter = prereq[0].replace(/^m/, '').padStart(2, '0');
        const boost = await semanticSearch(embedding, {
          matchCount:     4,
          filterCorpus:   ['eks-coreks'],
          filterMetadata: { module: moduleFilter },
        });
        pool = [...pool, ...boost];
      }
    }

    // De-dup keep-highest-similarity, then take top 6
    const dedup = new Map<string, KbHit>();
    for (const hit of pool) {
      const meta = hit.metadata as { module?: string };
      const key = `${hit.corpus}:${meta?.module ?? ''}:${(hit.title ?? '').slice(0, 60)}`;
      const prev = dedup.get(key);
      if (!prev || prev.similarity < hit.similarity) dedup.set(key, hit);
    }
    const chunks = [...dedup.values()]
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 6);

    if (!chunks.length) {
      return json({
        ok: true,
        question,
        answer: RAG_DECLINE_MESSAGE,
        sources: [],
        next_pages: [],
        dailyLimit: DAILY_LIMIT,
      });
    }

    const gen = await generateAnswer({
      question,
      chunks,
      learnerContext: learnerContext ? formatLearnerContext(learnerContext) : undefined,
    });
    const next = concept && isEksOnly ? nextPages(`concept:${concept}`) : [];
    const resources = buildRagResources(chunks, question);

    return json({
      ok: true,
      question,
      answer: gen.answer,
      model:  gen.model,
      personalized: Boolean(learnerContext),
      // Clickable next-step study resources derived from the retrieved content.
      resources,
      sources: chunks.map((c) => ({
        corpus:      c.corpus,
        source_type: c.source_type,
        title:       c.title,
        metadata:    c.metadata,
        similarity:  Math.round(c.similarity * 1000) / 1000,
      })),
      next_pages: next,
      dailyLimit: DAILY_LIMIT,
      usage: { input_tokens: gen.inputTokens, output_tokens: gen.outputTokens },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    const stack = err instanceof Error ? err.stack : undefined;
    // Capture with context so failures are debuggable in Vercel logs.
    console.error('[api/rag/ask] generation_failed', { ip, corpus: corporaFilter, error: msg, stack });
    return json({ ok: false, code: 'server_error', error: 'Ask AI had trouble answering that. Please try again.' }, 500);
  }
}

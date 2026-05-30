import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { embedQuery, semanticSearch, generateAnswer, type KbHit } from '@/lib/rag';
import { checkRateLimit } from '@/lib/rateLimiter';
import { nextPages, prerequisiteModules } from '@/data/eks-coreks-graph';

export const runtime = 'nodejs';
export const maxDuration = 30;

const corpusArray = z
  .union([z.string(), z.array(z.string())])
  .transform((v) => (Array.isArray(v) ? v : v.split(',').map((s) => s.trim()).filter(Boolean)))
  .pipe(z.array(z.string().min(1).max(60)).max(10));

const askSchema = z.object({
  question: z.string().min(1).max(2000),
  corpus:   corpusArray.optional().nullable(),
  source:   z.string().min(1).max(40).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  concept:  z.string().max(100).optional().nullable(),  // EKS graph-boost (only meaningful for corpus=eks-coreks)
});

function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

export async function POST(req: NextRequest) {
  if (Number(req.headers.get('content-length') ?? '0') > 8_000) {
    return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
  }
  const ip = clientIp(req);

  if (!(await checkRateLimit(`rag-ask:${ip}`, 20, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  let raw: unknown;
  try { raw = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: 'invalid JSON body' }, { status: 400 }); }

  const parsed = askSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }
  const { question, corpus, source, metadata, concept } = parsed.data;
  const corporaFilter = corpus && corpus.length ? corpus : null;

  try {
    const embedding = await embedQuery(question);

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
      return NextResponse.json({
        ok: true,
        question,
        answer: "I couldn't find relevant content in the course material for that question.",
        sources: [],
        next_pages: [],
      });
    }

    const gen = await generateAnswer({ question, chunks });
    const next = concept && isEksOnly ? nextPages(`concept:${concept}`) : [];

    return NextResponse.json({
      ok: true,
      question,
      answer: gen.answer,
      model:  gen.model,
      sources: chunks.map((c) => ({
        corpus:      c.corpus,
        source_type: c.source_type,
        title:       c.title,
        metadata:    c.metadata,
        similarity:  Math.round(c.similarity * 1000) / 1000,
      })),
      next_pages: next,
      usage: { input_tokens: gen.inputTokens, output_tokens: gen.outputTokens },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[api/rag/ask]', { ip, error: msg });
    return NextResponse.json({ ok: false, error: 'RAG generation failed' }, { status: 500 });
  }
}

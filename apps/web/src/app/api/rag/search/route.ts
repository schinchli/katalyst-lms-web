import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { embedQuery, semanticSearch } from '@/lib/rag';
import { checkRateLimit } from '@/lib/rateLimiter';

export const runtime = 'nodejs';

const corpusArray = z
  .union([z.string(), z.array(z.string())])
  .transform((v) => (Array.isArray(v) ? v : v.split(',').map((s) => s.trim()).filter(Boolean)))
  .pipe(z.array(z.string().min(1).max(60)).max(10));

const searchSchema = z.object({
  q:        z.string().min(1).max(2000),
  corpus:   corpusArray.optional().nullable(),
  source:   z.string().min(1).max(40).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  limit:    z.coerce.number().int().min(1).max(20).default(8),
});

function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

async function handle(input: unknown, ip: string) {
  if (!(await checkRateLimit(`rag-search:${ip}`, 60, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const parsed = searchSchema.safeParse(input);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }
  const { q, corpus, source, metadata, limit } = parsed.data;

  try {
    const embedding = await embedQuery(q);
    const hits = await semanticSearch(embedding, {
      matchCount:     limit,
      filterCorpus:   corpus && corpus.length ? corpus : null,
      filterSource:   source ?? null,
      filterMetadata: metadata && Object.keys(metadata).length ? metadata : null,
    });
    return NextResponse.json({
      ok: true,
      query: q,
      count: hits.length,
      results: hits.map((h) => ({
        id:          h.id,
        corpus:      h.corpus,
        source_type: h.source_type,
        title:       h.title,
        content:     h.content,
        metadata:    h.metadata,
        similarity:  Math.round(h.similarity * 1000) / 1000,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[api/rag/search]', { ip, error: msg });
    return NextResponse.json({ ok: false, error: 'Search failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const metadataRaw = sp.get('metadata');
  let metadata: unknown = undefined;
  if (metadataRaw) {
    try { metadata = JSON.parse(metadataRaw); }
    catch { return NextResponse.json({ ok: false, error: 'metadata must be JSON' }, { status: 400 }); }
  }
  return handle({
    q:        sp.get('q')      ?? '',
    corpus:   sp.get('corpus') ?? undefined,
    source:   sp.get('source') ?? undefined,
    metadata,
    limit:    sp.get('limit')  ?? undefined,
  }, clientIp(req));
}

export async function POST(req: NextRequest) {
  if (Number(req.headers.get('content-length') ?? '0') > 8_000) {
    return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
  }
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: 'invalid JSON body' }, { status: 400 }); }
  return handle(body, clientIp(req));
}

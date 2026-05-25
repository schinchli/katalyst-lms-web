/**
 * POST /api/admin/save-flashcards
 * ───────────────────────────────
 * Persists admin-curated/edited flashcards into knowledge_chunks with
 * corpus='generated-flashcards'. Unlike generate-flashcards (which writes
 * the LLM's raw output), this endpoint accepts client-edited content
 * verbatim — useful for the inline-edit workflow in the admin UI.
 *
 * Body:
 *   {
 *     topic: string,                       // for metadata
 *     cards: [{ front, back, source_chunk_ids? }, ...],
 *     model?: string,                      // for metadata only (provenance)
 *   }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import OpenAI from 'openai';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimiter';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ROUTE = '/api/admin/save-flashcards';
const GENERATED_CORPUS = 'generated-flashcards';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

async function verifyAdmin(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: { user } } = await sb.auth.getUser(token);
  if (!user || !ADMIN_EMAILS.includes((user.email ?? '').toLowerCase())) return null;
  return user;
}

const cardSchema = z.object({
  front:            z.string().min(1).max(500),
  back:             z.string().min(1).max(2000),
  source_chunk_ids: z.array(z.string().uuid()).max(20).optional(),
});

const saveSchema = z.object({
  topic: z.string().min(1).max(500),
  cards: z.array(cardSchema).min(1).max(20),
  model: z.string().max(80).optional(),
});

export async function POST(req: NextRequest) {
  if (Number(req.headers.get('content-length') ?? '0') > 32_000) {
    return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
  }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!(await checkRateLimit(`save-flashcards:${ip}`, 20, 60_000))) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const user = await verifyAdmin(req);
  if (!user) {
    logger.authFail(ROUTE, 'not_admin', { ip });
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  let raw: unknown;
  try { raw = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: 'invalid JSON body' }, { status: 400 }); }

  const parsed = saveSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }
  const { topic, cards, model } = parsed.data;

  const OPENAI_KEY  = process.env.OPENAI_API_KEY?.trim();
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!OPENAI_KEY)  return NextResponse.json({ ok: false, error: 'OPENAI_API_KEY not configured' }, { status: 500 });
  if (!SERVICE_KEY) return NextResponse.json({ ok: false, error: 'service role not configured' }, { status: 500 });

  try {
    const openai = new OpenAI({ apiKey: OPENAI_KEY });
    const sb     = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, SERVICE_KEY);

    const cardTexts = cards.map((c) => `Q: ${c.front}\n\nA: ${c.back}`);
    const embRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: cardTexts,
    });

    const rows = cards.map((c, i) => {
      const content = cardTexts[i];
      return {
        corpus:       GENERATED_CORPUS,
        source_type:  'flashcard',
        content_hash: createHash('sha256').update(content, 'utf8').digest('hex'),
        title:        c.front,
        content,
        embedding:    embRes.data[i].embedding,
        metadata: {
          topic,
          generated_by:        model ?? 'admin-edited',
          generated_for_user:  user.id,
          source_chunk_ids:    c.source_chunk_ids ?? [],
          edited:              true,
        },
      };
    });

    const { error } = await sb
      .from('knowledge_chunks')
      .upsert(rows, { onConflict: 'corpus,content_hash', ignoreDuplicates: true });
    if (error) {
      logger.error(ROUTE, 'upsert_failed', { reason: error.message });
      return NextResponse.json({ ok: false, error: 'Save failed' }, { status: 500 });
    }

    logger.info(ROUTE, 'saved', { ip, userId: user.id, topic, count: rows.length });
    return NextResponse.json({ ok: true, saved_count: rows.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    logger.error(ROUTE, 'failed', { ip, error: msg });
    return NextResponse.json({ ok: false, error: 'Save failed' }, { status: 500 });
  }
}

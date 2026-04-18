/**
 * GET  /api/flashcard-progress?deckId=xxx  — return known card IDs for a deck
 * POST /api/flashcard-progress             — upsert known card IDs for a deck
 *
 * Requires: Authorization: Bearer <supabase_jwt>
 * Rate limit: 60 req / 60 s per IP
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }             from '@supabase/supabase-js';
import { z }                        from 'zod';
import { checkRateLimit }           from '@/lib/rateLimiter';
import { logger }                   from '@/lib/logger';

export const dynamic = 'force-dynamic';

const ROUTE = '/api/flashcard-progress';

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

async function verifyUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? '';
  if (!token) return null;
  const { data } = await anonClient().auth.getUser(token);
  return data.user ?? null;
}

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`flashcard-get:${ip}`, 60, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const deckId = req.nextUrl.searchParams.get('deckId');
  if (!deckId) {
    return NextResponse.json({ ok: false, error: 'deckId required' }, { status: 400 });
  }

  const { data, error } = await anonClient()
    .from('flashcard_progress')
    .select('known_ids')
    .eq('user_id', user.id)
    .eq('deck_id', deckId)
    .maybeSingle();

  if (error) {
    logger.error(ROUTE, 'Failed to fetch flashcard progress', { error: error.message, userId: user.id });
    return NextResponse.json({ ok: false, error: 'Failed to load progress' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, knownIds: (data?.known_ids as string[]) ?? [] });
}

// ── POST (upsert) ────────────────────────────────────────────────────────────

const SaveSchema = z.object({
  deckId:   z.string().min(1).max(200),
  knownIds: z.array(z.string()).max(1000),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`flashcard-post:${ip}`, 60, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  if ((req.headers.get('content-length') ?? '0') > '8192') {
    return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
  }

  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = SaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { error } = await anonClient()
    .from('flashcard_progress')
    .upsert(
      {
        user_id:    user.id,
        deck_id:    parsed.data.deckId,
        known_ids:  parsed.data.knownIds,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,deck_id' },
    );

  if (error) {
    logger.error(ROUTE, 'Failed to save flashcard progress', { error: error.message, userId: user.id });
    return NextResponse.json({ ok: false, error: 'Failed to save progress' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

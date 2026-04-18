/**
 * GET  /api/bookmarks          — return authenticated user's bookmarked question IDs
 * POST /api/bookmarks          — add a bookmark
 * DELETE /api/bookmarks        — remove a bookmark
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

const ROUTE = '/api/bookmarks';

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
  if (!(await checkRateLimit(`bookmarks-get:${ip}`, 60, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const client = anonClient();
  const { data, error } = await client
    .from('bookmarks')
    .select('question_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    logger.error(ROUTE, 'Failed to fetch bookmarks', { error: error.message, userId: user.id });
    return NextResponse.json({ ok: false, error: 'Failed to load bookmarks' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, bookmarks: (data ?? []).map((r) => r.question_id) });
}

// ── POST (add) ───────────────────────────────────────────────────────────────

const AddSchema = z.object({ questionId: z.string().min(1).max(200) });

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`bookmarks-post:${ip}`, 60, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  if ((req.headers.get('content-length') ?? '0') > '4096') {
    return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
  }

  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = AddSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { error } = await anonClient()
    .from('bookmarks')
    .upsert(
      { user_id: user.id, question_id: parsed.data.questionId },
      { onConflict: 'user_id,question_id' },
    );

  if (error) {
    logger.error(ROUTE, 'Failed to add bookmark', { error: error.message, userId: user.id });
    return NextResponse.json({ ok: false, error: 'Failed to save bookmark' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// ── DELETE (remove) ──────────────────────────────────────────────────────────

const RemoveSchema = z.object({ questionId: z.string().min(1).max(200) });

export async function DELETE(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`bookmarks-del:${ip}`, 60, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  if ((req.headers.get('content-length') ?? '0') > '4096') {
    return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
  }

  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = RemoveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { error } = await anonClient()
    .from('bookmarks')
    .delete()
    .eq('user_id', user.id)
    .eq('question_id', parsed.data.questionId);

  if (error) {
    logger.error(ROUTE, 'Failed to remove bookmark', { error: error.message, userId: user.id });
    return NextResponse.json({ ok: false, error: 'Failed to remove bookmark' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

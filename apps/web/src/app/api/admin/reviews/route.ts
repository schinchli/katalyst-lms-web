/**
 * GET  /api/admin/reviews — Read quiz_review_stats from app_settings.
 * POST /api/admin/reviews — Upsert quiz review stats for a specific quiz.
 *
 * Admin-only. Uses service role key for DB access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }             from '@supabase/supabase-js';
import { z }                        from 'zod';
import { checkRateLimit }           from '@/lib/rateLimiter';
import { logger }                   from '@/lib/logger';

const ROUTE = '/api/admin/reviews';
const SETTINGS_KEY = 'quiz_review_stats';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const ReviewPostSchema = z.object({
  quizId: z.string().min(1).max(200),
  rating: z.number().min(0).max(5),
  count: z.number().int().min(0),
  distribution: z.object({
    '5': z.number().int().min(0),
    '4': z.number().int().min(0),
    '3': z.number().int().min(0),
    '2': z.number().int().min(0),
    '1': z.number().int().min(0),
  }),
});

async function verifyAdmin(req: NextRequest): Promise<{ ok: true; userId: string } | { ok: false; response: NextResponse }> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!(await checkRateLimit(`admin-reviews:${ip}`, 30, 60_000))) {
    logger.rateLimited(ROUTE, ip);
    return { ok: false, response: NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } }) };
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return { ok: false, response: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }) };
  }

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !user) {
    logger.authFail(ROUTE, 'invalid_token', { ip });
    return { ok: false, response: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }) };
  }

  if (!ADMIN_EMAILS.includes((user.email ?? '').toLowerCase())) {
    logger.authFail(ROUTE, 'not_admin', { ip, userId: user.id });
    return { ok: false, response: NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 }) };
  }

  return { ok: true, userId: user.id };
}

export async function GET(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  const db = serviceClient();

  try {
    const { data, error } = await db
      .from('app_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    if (error) {
      logger.error(ROUTE, 'fetch_failed', { userId: auth.userId, reason: error.message });
      return NextResponse.json({ ok: false, error: 'Failed to fetch review stats' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, stats: (data?.value ?? {}) as Record<string, unknown> });
  } catch (err: unknown) {
    logger.error(ROUTE, 'unhandled_error', {
      userId: auth.userId, reason: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return auth.response;

  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > 8192) {
    return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = ReviewPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { quizId, rating, count, distribution } = parsed.data;
  const db = serviceClient();

  try {
    // Read existing stats
    const { data: existing } = await db
      .from('app_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    const currentStats = (existing?.value ?? {}) as Record<string, unknown>;

    // Merge the new quiz stats
    const updated = {
      ...currentStats,
      [quizId]: { rating, count, distribution },
    };

    // Upsert
    const { error } = await db
      .from('app_settings')
      .upsert({ key: SETTINGS_KEY, value: updated }, { onConflict: 'key' });

    if (error) {
      logger.error(ROUTE, 'upsert_failed', { userId: auth.userId, reason: error.message });
      return NextResponse.json({ ok: false, error: 'Failed to save review stats' }, { status: 500 });
    }

    logger.info(ROUTE, 'review_stats_updated', { userId: auth.userId, quizId });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    logger.error(ROUTE, 'unhandled_error', {
      userId: auth.userId, reason: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

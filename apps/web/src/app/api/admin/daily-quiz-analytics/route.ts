/**
 * GET /api/admin/daily-quiz-analytics
 *
 * Returns attempt/completion counters for the currently configured daily quiz.
 * Counts are persisted in `app_settings` under the `daily_quiz_stats` key and
 * are incremented by `/api/quiz-submit` on every successful submission where
 * the submitted quiz matches the active daily quiz.
 *
 * Security:
 *  - Admin-only (Bearer JWT + ADMIN_EMAILS server-side check)
 *  - Rate limited: 30 req / 60 s per IP
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimiter';
import { logger } from '@/lib/logger';
import { SYSTEM_FEATURES_KEY, normalizeSystemFeatures } from '@/lib/systemFeatures';

const ROUTE = '/api/admin/daily-quiz-analytics';
const DAILY_QUIZ_STATS_KEY = 'daily_quiz_stats';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function verifyAdmin(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return { ok: false as const, status: 401, error: 'Unauthorized' };

  const { data: { user }, error } = await anonClient().auth.getUser(token);
  if (error || !user) return { ok: false as const, status: 401, error: 'Unauthorized' };
  if (!ADMIN_EMAILS.includes((user.email ?? '').toLowerCase())) {
    return { ok: false as const, status: 403, error: 'Forbidden' };
  }

  return { ok: true as const, user };
}

interface DailyQuizStats {
  attempts: number;
  completions: number;
  lastUpdated: string;
}

function normalizeStats(value: unknown): DailyQuizStats {
  const raw = (value ?? {}) as Partial<DailyQuizStats>;
  return {
    attempts:    typeof raw.attempts    === 'number' ? raw.attempts    : 0,
    completions: typeof raw.completions === 'number' ? raw.completions : 0,
    lastUpdated: typeof raw.lastUpdated === 'string' ? raw.lastUpdated : '',
  };
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  // ── Rate limiting ──────────────────────────────────────────────────────────
  if (!(await checkRateLimit(`admin-daily-analytics:${ip}`, 30, 60_000))) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json(
      { ok: false, error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  // ── Admin auth ─────────────────────────────────────────────────────────────
  const auth = await verifyAdmin(req);
  if (!auth.ok) {
    logger.authFail(ROUTE, auth.error === 'Forbidden' ? 'not_admin' : 'invalid_token', { ip });
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const db = adminClient();

  // ── Fetch system features to get the active daily quiz ID ─────────────────
  const sfRow = await db
    .from('app_settings')
    .select('value')
    .eq('key', SYSTEM_FEATURES_KEY)
    .maybeSingle();
  const sf = normalizeSystemFeatures(sfRow.data?.value);

  // ── Fetch analytics counters ───────────────────────────────────────────────
  const statsRow = await db
    .from('app_settings')
    .select('value')
    .eq('key', DAILY_QUIZ_STATS_KEY)
    .maybeSingle();
  const stats = normalizeStats(statsRow.data?.value);

  const completionRate =
    stats.attempts > 0
      ? Math.round((stats.completions / stats.attempts) * 100) / 100
      : 0;

  logger.info(ROUTE, 'analytics_fetched', { ip, userId: auth.user.id });

  return NextResponse.json({
    ok:             true,
    quizId:         sf.dailyQuizQuizId,
    dailyEnabled:   sf.dailyQuizEnabled,
    attempts:       stats.attempts,
    completions:    stats.completions,
    completionRate,
    lastUpdated:    stats.lastUpdated,
  });
}

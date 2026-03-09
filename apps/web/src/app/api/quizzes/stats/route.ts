/**
 * GET /api/quizzes/stats?quiz_id=<id>
 *
 * Returns the number of distinct students who have attempted a quiz.
 * Public endpoint — no auth required.
 * Cached 5 minutes on CDN edge.
 *
 * Response: { ok: true, studentCount: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }             from '@supabase/supabase-js';
import { checkRateLimit }           from '@/lib/rateLimiter';
import { logger }                   from '@/lib/logger';

const ROUTE = '/api/quizzes/stats';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!checkRateLimit(`quiz-stats:${ip}`, 60, 60_000)) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json({ ok: false, error: 'Too many requests' }, {
      status: 429, headers: { 'Retry-After': '60' },
    });
  }

  const quizId = req.nextUrl.searchParams.get('quiz_id');
  if (!quizId) {
    return NextResponse.json({ ok: false, error: 'quiz_id is required' }, { status: 400 });
  }

  try {
    const db = adminClient();

    // Fetch distinct user_id values for this quiz
    const { data, error } = await db
      .from('quiz_results')
      .select('user_id')
      .eq('quiz_id', quizId)
      .limit(10_000);

    if (error) {
      logger.error(ROUTE, 'fetch_failed', { ip, reason: error.message });
      return NextResponse.json({ ok: false, error: 'Failed to fetch stats' }, { status: 500 });
    }

    // Count distinct students
    const uniqueUsers = new Set((data ?? []).map((r) => r.user_id as string));
    const studentCount = uniqueUsers.size;

    return NextResponse.json({ ok: true, studentCount }, {
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
    });

  } catch (err: unknown) {
    logger.error(ROUTE, 'unhandled_error', {
      ip, reason: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

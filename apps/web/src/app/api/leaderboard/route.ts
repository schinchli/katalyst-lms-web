/**
 * GET /api/leaderboard?period=daily|monthly|alltime
 *
 * Public endpoint — no auth required.
 * Aggregates quiz_results by user, joins user_profiles for display names.
 * Returns top 50 ranked entries.
 * Cached 60 s on CDN edge.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }             from '@supabase/supabase-js';
import { checkRateLimit }           from '@/lib/rateLimiter';
import { logger }                   from '@/lib/logger';
import type { LeaderboardEntry }    from '@/types';

const ROUTE = '/api/leaderboard';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function periodStart(period: string): string | null {
  const now = new Date();
  if (period === 'daily') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  }
  if (period === 'monthly') {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }
  return null; // alltime — no filter
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!checkRateLimit(`leaderboard:${ip}`, 60, 60_000)) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json({ ok: false, error: 'Too many requests' }, {
      status: 429, headers: { 'Retry-After': '60' },
    });
  }

  const period = req.nextUrl.searchParams.get('period') ?? 'alltime';
  if (!['daily', 'monthly', 'alltime'].includes(period)) {
    return NextResponse.json({ ok: false, error: 'Invalid period' }, { status: 400 });
  }

  try {
    const db    = adminClient();
    const start = periodStart(period);

    // Fetch quiz results within the requested period
    let q = db
      .from('quiz_results')
      .select('user_id, quiz_id, score')
      .limit(10_000);

    if (start) q = q.gte('completed_at', start);

    const { data: results, error: resultsErr } = await q;
    if (resultsErr) {
      logger.error(ROUTE, 'quiz_results_fetch_failed', { ip, reason: resultsErr.message });
      return NextResponse.json({ ok: false, error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    if (!results || results.length === 0) {
      return NextResponse.json({ ok: true, entries: [] }, {
        headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' },
      });
    }

    // Aggregate score + distinct quizzes per user
    const userMap = new Map<string, { score: number; quizzes: Set<string> }>();
    for (const row of results) {
      const uid      = row.user_id as string;
      const existing = userMap.get(uid) ?? { score: 0, quizzes: new Set<string>() };
      existing.score += (row.score as number) ?? 0;
      existing.quizzes.add(row.quiz_id as string);
      userMap.set(uid, existing);
    }

    // Fetch display names for all users
    const userIds = [...userMap.keys()];
    const { data: profiles } = await db
      .from('user_profiles')
      .select('id, name')
      .in('id', userIds)
      .limit(500);

    const nameMap = new Map<string, string>();
    for (const p of profiles ?? []) {
      if (p.id && p.name) nameMap.set(p.id as string, p.name as string);
    }

    // Rank by total score (descending), cap at top 50
    const entries: LeaderboardEntry[] = [...userMap.entries()]
      .map(([userId, d]) => {
        const name = nameMap.get(userId) || 'Learner';
        return {
          rank:             0,
          userId,
          name,
          avatarInitial:    name[0]?.toUpperCase() ?? 'L',
          score:            d.score,
          coins:            Math.floor(d.score * 0.4),
          streak:           0,
          quizzesCompleted: d.quizzes.size,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
      .map((e, i) => ({ ...e, rank: i + 1 }));

    return NextResponse.json({ ok: true, entries }, {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' },
    });

  } catch (err: unknown) {
    logger.error(ROUTE, 'unhandled_error', {
      ip, reason: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

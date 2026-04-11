/**
 * GET /api/articles
 *
 * Returns article metadata list from Sanity (no body).
 * Public endpoint — no auth required.
 * Access tier field is included so the client can show a Premium badge.
 *
 * Rate limit: 60 req / 60 s per IP
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit }            from '@/lib/rateLimiter';
import { logger }                    from '@/lib/logger';
import { fetchArticleList }          from '@/lib/sanityClient';

export const dynamic = 'force-dynamic';

const ROUTE = '/api/articles';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!(await checkRateLimit(`articles-list:${ip}`, 60, 60_000))) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json({ ok: false, error: 'Too many requests' }, {
      status: 429, headers: { 'Retry-After': '60' },
    });
  }

  try {
    const articles = await fetchArticleList();
    return NextResponse.json({ ok: true, articles }, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    });
  } catch (err) {
    logger.error(ROUTE, 'Failed to fetch article list', { error: String(err), ip });
    return NextResponse.json({ ok: false, error: 'Failed to load articles' }, { status: 500 });
  }
}

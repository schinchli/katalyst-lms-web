/**
 * GET /api/articles
 *
 * Returns article metadata list from Sanity CMS.
 * Falls back to static FEATURED_ARTICLES when Sanity is not configured or returns nothing.
 *
 * Public endpoint — no auth required.
 * Rate limit: 60 req / 60 s per IP.
 * Cache: 60 s CDN + 5 min stale-while-revalidate.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit }            from '@/lib/rateLimiter';
import { logger }                    from '@/lib/logger';
import { fetchArticleList }          from '@/lib/sanityClient';
import type { ArticleListItem, ArticleProvider, ArticleCategory } from '@/lib/sanityClient';
import { FEATURED_ARTICLES }         from '@/lib/experienceFixtures';

export const dynamic = 'force-dynamic';

const ROUTE = '/api/articles';

const VALID_PROVIDERS = new Set<ArticleProvider>(['AWS','GCP','Azure','Oracle','Databricks','Snowflake','General']);
const VALID_CATEGORIES = new Set<ArticleCategory>(['Cloud','Data','AI','Security','DevOps','General']);
const VALID_SORTS = new Set(['date','organisation']);

/** Static fallback when Sanity is not configured or returns nothing. */
function staticArticles(): ArticleListItem[] {
  return FEATURED_ARTICLES.map((a, i) => ({
    _id:           a.slug,
    title:         a.title,
    slug:          a.slug,
    tag:           a.tag,
    excerpt:       a.description,
    author:        a.author,
    publishedAt:   a.date,
    readTime:      a.readTime ?? null,
    accessTier:    'free' as const,
    featured:      i === 0,
    provider:      (a.provider ?? 'General') as ArticleProvider,
    category:      (a.category ?? 'General') as ArticleCategory,
    organisation:  a.organisation ?? 'LearnKloud Team',
    relatedQuizId: a.relatedQuizId ?? null,
    coverImage:    null,
  }));
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!(await checkRateLimit(`articles-list:${ip}`, 60, 60_000))) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json({ ok: false, error: 'Too many requests' }, {
      status: 429, headers: { 'Retry-After': '60' },
    });
  }

  const { searchParams } = new URL(req.url);
  const providersParam  = searchParams.get('provider');
  const categoriesParam = searchParams.get('category');
  const sortParam       = searchParams.get('sort') ?? 'date';
  const limitParam      = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 200);

  const providers  = providersParam
    ? (providersParam.split(',').filter(p => VALID_PROVIDERS.has(p as ArticleProvider)) as ArticleProvider[])
    : undefined;
  const categories = categoriesParam
    ? (categoriesParam.split(',').filter(c => VALID_CATEGORIES.has(c as ArticleCategory)) as ArticleCategory[])
    : undefined;
  const sort = (VALID_SORTS.has(sortParam) ? sortParam : 'date') as 'date' | 'organisation';

  try {
    const sanityArticles = await fetchArticleList({ providers, categories, sort, limit: limitParam });
    const articles = sanityArticles.length > 0 ? sanityArticles : staticArticles();
    return NextResponse.json({ ok: true, articles }, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    });
  } catch (err) {
    logger.error(ROUTE, 'Failed to fetch article list', { error: String(err), ip });
    return NextResponse.json({ ok: true, articles: staticArticles() }, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    });
  }
}

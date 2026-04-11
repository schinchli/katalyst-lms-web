/**
 * GET /api/articles/[slug]
 * Headers: Authorization: Bearer <supabase_access_token>
 *
 * Access control:
 *   - No token        → 401  (all articles require a registered account)
 *   - free article    → 200  (any authenticated user)
 *   - premium article → 200  if user has active subscription, else 403
 *
 * Rate limit: 30 req / 60 s per IP
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }              from '@supabase/supabase-js';
import { checkRateLimit }            from '@/lib/rateLimiter';
import { logger }                    from '@/lib/logger';
import { fetchArticleFull }          from '@/lib/sanityClient';

export const dynamic = 'force-dynamic';

const ROUTE = '/api/articles/[slug]';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function resolveUser(token: string) {
  const { data, error } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ).auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

async function isPremiumSubscriber(userId: string): Promise<boolean> {
  const { data } = await adminClient()
    .from('subscriptions')
    .select('tier, expires_at')
    .eq('user_id', userId)
    .single();

  if (!data) return false;
  if (data.tier !== 'premium') return false;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return false;
  return true;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const ip   = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { slug } = await params;

  if (!(await checkRateLimit(`articles-slug:${ip}`, 30, 60_000))) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json({ ok: false, error: 'Too many requests' }, {
      status: 429, headers: { 'Retry-After': '60' },
    });
  }

  // Auth check — all articles require login
  const authHeader = req.headers.get('authorization') ?? '';
  const token      = authHeader.replace(/^bearer\s+/i, '').trim();

  if (!token) {
    return NextResponse.json({ ok: false, error: 'Authentication required', code: 'UNAUTHENTICATED' }, { status: 401 });
  }

  const user = await resolveUser(token);
  if (!user) {
    logger.warn(ROUTE, 'Invalid token', { ip });
    return NextResponse.json({ ok: false, error: 'Invalid or expired token', code: 'UNAUTHENTICATED' }, { status: 401 });
  }

  // Fetch article from Sanity
  let article;
  try {
    article = await fetchArticleFull(slug);
  } catch (err) {
    logger.error(ROUTE, 'Sanity fetch failed', { slug, error: String(err), ip });
    return NextResponse.json({ ok: false, error: 'Failed to load article' }, { status: 500 });
  }

  if (!article) {
    return NextResponse.json({ ok: false, error: 'Article not found' }, { status: 404 });
  }

  // Premium gate
  if (article.accessTier === 'premium') {
    const paid = await isPremiumSubscriber(user.id);
    if (!paid) {
      logger.info(ROUTE, 'Premium article blocked — user not subscribed', { userId: user.id, slug });
      return NextResponse.json(
        {
          ok: false,
          error: 'Premium content',
          code: 'PREMIUM_REQUIRED',
          // Return metadata so the client can render a paywall with article info
          article: {
            _id:         article._id,
            title:       article.title,
            slug:        article.slug,
            tag:         article.tag,
            excerpt:     article.excerpt,
            author:      article.author,
            publishedAt: article.publishedAt,
            readTime:    article.readTime,
            accessTier:  article.accessTier,
            featured:    article.featured,
          },
        },
        { status: 403 },
      );
    }
  }

  return NextResponse.json({ ok: true, article });
}

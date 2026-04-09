import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimiter';
import { checkContent } from '@/lib/profanityFilter';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export interface QuizReviewStats {
  rating: number;
  count: number;
  distribution: { '5': number; '4': number; '3': number; '2': number; '1': number };
}

export interface UserReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// Default aggregate stats per quiz (admin can override via app_settings)
const DEFAULT_REVIEW_STATS: Record<string, QuizReviewStats> = {
  'aws-quick-start': {
    rating: 4.89, count: 187,
    distribution: { '5': 152, '4': 23, '3': 8, '2': 3, '1': 1 },
  },
  'clf-c02-full-exam': {
    rating: 4.8, count: 312,
    distribution: { '5': 241, '4': 47, '3': 16, '2': 6, '1': 2 },
  },
  'clf-c02-cloud-concepts': {
    rating: 4.7, count: 94,
    distribution: { '5': 68, '4': 16, '3': 7, '2': 2, '1': 1 },
  },
  'clf-c02-security': {
    rating: 4.75, count: 128,
    distribution: { '5': 96, '4': 21, '3': 7, '2': 3, '1': 1 },
  },
  'clf-c02-technology': {
    rating: 4.82, count: 203,
    distribution: { '5': 162, '4': 28, '3': 9, '2': 3, '1': 1 },
  },
  'clf-c02-billing': {
    rating: 4.68, count: 76,
    distribution: { '5': 52, '4': 14, '3': 6, '2': 3, '1': 1 },
  },
};

const ROUTE = '/api/quiz-reviews/[id]';

const SubmitSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000),
});

// ── GET: aggregate stats + published user reviews ──────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!(await checkRateLimit(`quiz-reviews:${id}`, 60, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Load admin-configured aggregate stats
  const { data: settingsRow } = await client
    .from('app_settings')
    .select('value')
    .eq('key', 'quiz_review_stats')
    .maybeSingle();

  const stored = (settingsRow?.value ?? {}) as Record<string, QuizReviewStats>;
  const stats: QuizReviewStats | null = stored[id] ?? DEFAULT_REVIEW_STATS[id] ?? null;

  // Load published user reviews (max 20 most recent)
  const { data: reviewRows } = await client
    .from('quiz_reviews')
    .select('id, user_id, rating, comment, created_at, user_profiles(name)')
    .eq('quiz_id', id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(20);

  const reviews: UserReview[] = (reviewRows ?? []).map((r) => {
    const profile = Array.isArray(r.user_profiles) ? r.user_profiles[0] : r.user_profiles;
    return {
      id: r.id as string,
      userId: r.user_id as string,
      userName: (profile as { name?: string } | null)?.name ?? 'Learner',
      rating: r.rating as number,
      comment: r.comment as string,
      createdAt: r.created_at as string,
    };
  });

  return NextResponse.json({ ok: true, stats, reviews });
}

// ── POST: submit a user review ─────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: quizId } = await params;

  // Payload size guard
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > 4096) {
    return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
  }

  // Auth check
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Sign in to leave a review' }, { status: 401 });
  }

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: { user } } = await anonClient.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 401 });
  }

  // Rate limit per user (3 review submits per hour across all quizzes)
  if (!(await checkRateLimit(`review-submit:${user.id}`, 3, 3_600_000))) {
    logger.rateLimited(ROUTE, user.id);
    return NextResponse.json({ ok: false, error: 'Too many requests. Try again later.' }, { status: 429 });
  }

  // Parse + validate body
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }
  const { rating, comment } = parsed.data;

  // Content moderation
  const filter = checkContent(comment);
  const status = filter.flagged ? 'pending' : 'published';

  // Service role for insert (bypasses RLS insert policy to allow upsert)
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await serviceClient
    .from('quiz_reviews')
    .upsert(
      {
        user_id: user.id,
        quiz_id: quizId,
        rating,
        comment,
        status,
        flagged: filter.flagged,
        flag_reason: filter.reason ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,quiz_id' },
    );

  if (error) {
    logger.error(ROUTE, 'insert_failed', { userId: user.id, reason: error.message });
    return NextResponse.json({ ok: false, error: 'Failed to save review' }, { status: 500 });
  }

  logger.info(ROUTE, 'review_submitted', { userId: user.id, quizId, status });

  return NextResponse.json({
    ok: true,
    status,
    message: status === 'pending'
      ? 'Your review has been submitted for moderation and will appear after approval.'
      : 'Review published! Thank you for your feedback.',
  });
}

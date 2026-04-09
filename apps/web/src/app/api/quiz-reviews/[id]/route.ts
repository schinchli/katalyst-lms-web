import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimiter';

export const dynamic = 'force-dynamic';

export interface QuizReviewStats {
  rating: number;       // e.g. 4.89
  count: number;        // total reviews
  distribution: {       // count per star level
    '5': number;
    '4': number;
    '3': number;
    '2': number;
    '1': number;
  };
}

// Default stats used when no admin override is stored in app_settings.
// Admin can override these per quiz via Supabase app_settings key: quiz_review_stats
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

export async function GET(
  _req: Request,
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

  // Try to load admin-configured overrides from app_settings
  const { data } = await client
    .from('app_settings')
    .select('value')
    .eq('key', 'quiz_review_stats')
    .maybeSingle();

  const stored = (data?.value ?? {}) as Record<string, QuizReviewStats>;
  const stats: QuizReviewStats | null = stored[id] ?? DEFAULT_REVIEW_STATS[id] ?? null;

  return NextResponse.json({ ok: true, stats });
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimiter';
import { buildManagedQuizDataset, MANAGED_QUIZ_CONTENT_KEY } from '@/lib/managedQuizContent';

export async function GET() {
  const ip = 'public-quiz-content';
  if (!(await checkRateLimit(`quiz-content:${ip}`, 60, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await client
    .from('app_settings')
    .select('value')
    .eq('key', MANAGED_QUIZ_CONTENT_KEY)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: true, content: { quizzes: [], questions: {} } });
  }

  const dataset = buildManagedQuizDataset(data?.value);

  // Never expose test/internal quizzes (ids starting with "playwright-") to end users.
  // They remain visible in the admin quiz-builder API for testing purposes.
  const publicContent = {
    ...dataset,
    quizzes: dataset.quizzes.filter((q) => !q.id.startsWith('playwright-')),
  };

  return NextResponse.json({ ok: true, content: publicContent });
}

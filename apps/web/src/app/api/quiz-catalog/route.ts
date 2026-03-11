import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimiter';
import { normalizeQuizCatalogOverrides, QUIZ_CATALOG_OVERRIDES_KEY } from '@/lib/quizCatalog';

export async function GET() {
  const ip = 'public-quiz-catalog';
  if (!(await checkRateLimit(`quiz-catalog:${ip}`, 60, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await client
    .from('app_settings')
    .select('value')
    .eq('key', QUIZ_CATALOG_OVERRIDES_KEY)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: true, overrides: {} });
  }

  return NextResponse.json({ ok: true, overrides: normalizeQuizCatalogOverrides(data?.value) });
}

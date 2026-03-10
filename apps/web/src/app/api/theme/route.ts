import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimiter';
import {
  DEFAULT_PLATFORM_THEME,
  PLATFORM_THEME_KEY,
  normalizePlatformTheme,
} from '@/lib/platformTheme';

export async function GET() {
  const ip = 'public-theme';
  if (!(await checkRateLimit(`theme-get:${ip}`, 60, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await client
    .from('app_settings')
    .select('value')
    .eq('key', PLATFORM_THEME_KEY)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: true, theme: DEFAULT_PLATFORM_THEME });
  }

  const theme = normalizePlatformTheme(data?.value);
  return NextResponse.json({ ok: true, theme });
}

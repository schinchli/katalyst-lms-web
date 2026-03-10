import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimiter';
import {
  DEFAULT_PLATFORM_EXPERIENCE,
  normalizePlatformExperience,
  PLATFORM_EXPERIENCE_KEY,
} from '@/lib/platformExperience';

export async function GET() {
  const ip = 'public-platform-config';
  if (!(await checkRateLimit(`platform-config:${ip}`, 60, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await client
    .from('app_settings')
    .select('value')
    .eq('key', PLATFORM_EXPERIENCE_KEY)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: true, config: DEFAULT_PLATFORM_EXPERIENCE });
  }

  return NextResponse.json({ ok: true, config: normalizePlatformExperience(data?.value) });
}

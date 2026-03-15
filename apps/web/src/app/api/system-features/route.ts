import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimiter';
import { DEFAULT_SYSTEM_FEATURES, normalizeSystemFeatures, SYSTEM_FEATURES_KEY } from '@/lib/systemFeatures';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`system-features:${ip}`, 60, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ ok: true, config: DEFAULT_SYSTEM_FEATURES });
  }

  const client = createClient(url, anonKey);
  const { data, error } = await client
    .from('app_settings')
    .select('value')
    .eq('key', SYSTEM_FEATURES_KEY)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: true, config: DEFAULT_SYSTEM_FEATURES });
  return NextResponse.json({ ok: true, config: normalizeSystemFeatures(data?.value) });
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimiter';
import { APP_CONTENT_KEY, DEFAULT_APP_CONTENT, normalizeAppContent } from '@/lib/appContent';

function anonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey);
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`app-content:${ip}`, 60, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const client = anonClient();
  if (!client) {
    return NextResponse.json({ ok: true, content: DEFAULT_APP_CONTENT });
  }

  const { data, error } = await client
    .from('app_settings')
    .select('value')
    .eq('key', APP_CONTENT_KEY)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: true, content: DEFAULT_APP_CONTENT });
  }

  return NextResponse.json({ ok: true, content: normalizeAppContent(data?.value) });
}

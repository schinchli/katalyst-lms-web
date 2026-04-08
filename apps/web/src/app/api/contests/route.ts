import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimiter';
import { MANAGED_CONTESTS_KEY, normalizeContest } from '@/app/api/admin/contests/route';
import type { Contest } from '@/types';

// Public read — use anon key (not service role) for least-privilege
function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`contests-public:${ip}`, 60, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const { data, error } = await anonClient()
    .from('app_settings')
    .select('value')
    .eq('key', MANAGED_CONTESTS_KEY)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: true, contests: [] });

  const raw = data?.value;
  const contests: Contest[] = Array.isArray(raw)
    ? raw.map(normalizeContest).filter((c): c is Contest => c !== null)
    : [];

  return NextResponse.json({ ok: true, contests });
}

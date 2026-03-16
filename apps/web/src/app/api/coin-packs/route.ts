/**
 * GET /api/coin-packs
 *
 * Public endpoint — returns enabled coin packs only.
 * No auth required. Rate limited at 60 req/min.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }             from '@supabase/supabase-js';
import { checkRateLimit }           from '@/lib/rateLimiter';
import type { CoinPack }            from '@/types';
import { MANAGED_COIN_PACKS_KEY }   from '@/app/api/admin/coin-packs/route';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!(await checkRateLimit(`coin-packs:${ip}`, 60, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, {
      status: 429, headers: { 'Retry-After': '60' },
    });
  }

  const { data } = await adminClient()
    .from('app_settings')
    .select('value')
    .eq('key', MANAGED_COIN_PACKS_KEY)
    .maybeSingle();

  const all = Array.isArray(data?.value) ? (data!.value as CoinPack[]) : [];
  const packs = all.filter((p) => p.enabled);

  return NextResponse.json({ ok: true, packs });
}

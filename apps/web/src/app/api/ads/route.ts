/**
 * GET /api/ads
 *
 * Returns whether the authenticated user has the remove-ads entitlement.
 *
 * DB migration required:
 *   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS ads_removed boolean DEFAULT false;
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }             from '@supabase/supabase-js';
import { checkRateLimit }           from '@/lib/rateLimiter';
import { logger }                   from '@/lib/logger';

const ROUTE = '/api/ads';

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!(await checkRateLimit(`ads:${ip}`, 30, 60_000))) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json({ ok: false, error: 'Too many requests' }, {
      status: 429, headers: { 'Retry-After': '60' },
    });
  }

  // Auth required
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data: { user }, error: authError } = await anonClient().auth.getUser(token);
  if (authError || !user) {
    logger.warn(ROUTE, 'invalid_token', { ip });
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Read ads_removed from user_profiles via service role
  const { data: profile, error: profileError } = await adminClient()
    .from('user_profiles')
    .select('ads_removed')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    // Column may not exist yet — default to false (ads shown)
    return NextResponse.json({ ok: true, adsRemoved: false });
  }

  const adsRemoved = (profile as { ads_removed?: boolean } | null)?.ads_removed ?? false;
  return NextResponse.json({ ok: true, adsRemoved });
}

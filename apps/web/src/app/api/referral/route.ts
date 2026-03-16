/**
 * GET  /api/referral — return the user's referral code + stats
 * POST /api/referral — redeem a referral code
 *
 * DB migration required:
 * ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referred_by text;
 * ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
 * CREATE INDEX IF NOT EXISTS idx_user_profiles_referred_by ON user_profiles(referred_by);
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }             from '@supabase/supabase-js';
import { z }                        from 'zod';
import { checkRateLimit }           from '@/lib/rateLimiter';
import { logger }                   from '@/lib/logger';

const ROUTE = '/api/referral';

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

/** Derive a deterministic referral code from a userId (no crypto required — userId is already opaque). */
function deriveReferralCode(userId: string): string {
  return userId.replace(/-/g, '').slice(0, 8).toUpperCase();
}

async function verifyToken(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const { data: { user }, error } = await anonClient().auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!(await checkRateLimit(`referral-get:${ip}`, 30, 60_000))) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json({ ok: false, error: 'Too many requests' }, {
      status: 429, headers: { 'Retry-After': '60' },
    });
  }

  const user = await verifyToken(req);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const code = deriveReferralCode(user.id);
  const db   = adminClient();

  // Try counting referred users — gracefully handle missing column
  const { data: referred, error: referralError } = await db
    .from('user_profiles')
    .select('id')
    .eq('referred_by', code);

  if (referralError) {
    // Column not yet migrated
    return NextResponse.json({
      ok: true,
      code,
      referredCount: 0,
      coinsEarned: 0,
      note: 'referral tracking pending DB migration',
    });
  }

  const referredCount = referred?.length ?? 0;
  // 50 coins per successful referral signup (matches CoinReasonCode: 'referral_reward')
  const coinsEarned   = referredCount * 50;

  return NextResponse.json({ ok: true, code, referredCount, coinsEarned });
}

const RedeemSchema = z.object({
  referralCode: z.string().min(1).max(16).regex(/^[A-Z0-9]+$/),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!(await checkRateLimit(`referral-post:${ip}`, 10, 60_000))) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json({ ok: false, error: 'Too many requests' }, {
      status: 429, headers: { 'Retry-After': '60' },
    });
  }

  const contentLength = parseInt(req.headers.get('content-length') ?? '0', 10);
  if (contentLength > 4_096) {
    return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
  }

  const user = await verifyToken(req);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = RedeemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { referralCode } = parsed.data;
  const ownCode = deriveReferralCode(user.id);

  if (referralCode === ownCode) {
    return NextResponse.json({ ok: false, error: 'You cannot use your own referral code.' }, { status: 400 });
  }

  logger.info(ROUTE, 'referral_redeem_attempt', { userId: user.id, referralCode, ip });

  return NextResponse.json({
    ok: true,
    coinsAwarded: 0,
    note: 'referral coin crediting pending ledger migration',
  });
}

/**
 * GET /api/payment/stripe/verify?session_id=xxx
 * Called by the success page after Stripe redirects back.
 * Retrieves the Checkout Session, confirms payment_status = 'paid',
 * grants access (idempotent — same as webhook but initiated client-side).
 *
 * Rate limit: 10 req / 60 s per IP
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe';
import { checkRateLimit } from '@/lib/rateLimiter';
import { logger } from '@/lib/logger';

const ROUTE = '/api/payment/stripe/verify';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase admin env vars are required.');
  }

  return createClient(url, serviceRoleKey);
}

export async function GET(req: NextRequest) {
  let supabaseAdmin;
  let stripe;
  try {
    supabaseAdmin = getSupabaseAdmin();
    stripe = getStripe();
  } catch (error) {
    logger.error(ROUTE, 'payment_env_missing', { reason: String(error) });
    return NextResponse.json({ error: 'Server configuration incomplete' }, { status: 500 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!(await checkRateLimit(`stripe-verify:${ip}`, 10, 60_000))) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    logger.authFail(ROUTE, 'missing_token', { ip });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    logger.authFail(ROUTE, 'invalid_token', { ip });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionId = req.nextUrl.searchParams.get('session_id') ?? '';
  if (!sessionId) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });

  // ── Retrieve session from Stripe ──────────────────────────────────────────
  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>>;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    logger.error(ROUTE, 'stripe_retrieve_failed', { userId: user.id, ip, reason: String(err) });
    return NextResponse.json({ error: 'Could not retrieve payment session' }, { status: 502 });
  }

  if (session.payment_status !== 'paid') {
    return NextResponse.json({ verified: false, reason: 'not_paid' });
  }

  const meta     = session.metadata ?? {};
  const ownerId  = meta.user_id;
  const pType    = meta.purchase_type as 'subscription' | 'course' | undefined;
  const plan     = meta.plan;
  const courseId = meta.course_id;

  // Ownership check — session must belong to the requesting user
  if (ownerId !== user.id) {
    logger.error(ROUTE, 'session_ownership_mismatch', { userId: user.id, ip, reason: sessionId });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ── Idempotent purchase record ─────────────────────────────────────────────
  const { data: existing } = await supabaseAdmin
    .from('purchases')
    .select('id')
    .eq('stripe_session_id', sessionId)
    .limit(1)
    .maybeSingle();

  if (!existing) {
    await supabaseAdmin.from('purchases').insert({
      user_id:               user.id,
      purchase_type:         pType ?? 'subscription',
      course_id:             courseId ?? null,
      plan:                  plan ?? null,
      amount:                session.amount_total ?? 0,
      stripe_session_id:     sessionId,
      stripe_payment_intent: typeof session.payment_intent === 'string'
        ? session.payment_intent : null,
      status:                'completed',
      purchased_at:          new Date().toISOString(),
    });
  }

  // ── Grant access ─────────────────────────────────────────────────────────
  let unlockedCourses: string[] | undefined;

  if (pType === 'subscription') {
    await supabaseAdmin.from('subscriptions').upsert(
      {
        user_id:    user.id,
        tier:       'premium',
        plan:       plan ?? 'annual',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    logger.info(ROUTE, 'subscription_activated', { userId: user.id, ip, reason: plan ?? 'annual' });
  } else if (pType === 'course' && courseId) {
    await supabaseAdmin.from('unlocked_courses').upsert(
      { user_id: user.id, course_id: courseId, unlocked_at: new Date().toISOString() },
      { onConflict: 'user_id,course_id' },
    );
    const { data: rows } = await supabaseAdmin
      .from('unlocked_courses').select('course_id').eq('user_id', user.id);
    unlockedCourses = (rows ?? []).map((r) => r.course_id as string);
    logger.info(ROUTE, 'course_unlocked', { userId: user.id, ip, reason: courseId });
  }

  return NextResponse.json({
    verified:       true,
    purchaseType:   pType,
    plan,
    courseId,
    unlockedCourses,
    subscription:   pType === 'subscription' ? 'premium' : undefined,
  });
}

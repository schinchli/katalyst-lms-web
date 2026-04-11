/**
 * POST /api/payment/stripe/webhook
 * Stripe sends events here after payment success/failure.
 * Verifies HMAC signature, then grants access server-side.
 *
 * Required Vercel env: STRIPE_WEBHOOK_SECRET
 * Set up in Stripe Dashboard → Webhooks → checkout.session.completed
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe';
import { checkRateLimit } from '@/lib/rateLimiter';
import { logger } from '@/lib/logger';

const ROUTE = '/api/payment/stripe/webhook';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase admin env vars are required.');
  }

  return createClient(url, serviceRoleKey);
}

export async function POST(req: NextRequest) {
  let supabaseAdmin;
  let stripe;
  try {
    supabaseAdmin = getSupabaseAdmin();
    stripe = getStripe();
  } catch (error) {
    logger.error(ROUTE, 'payment_env_missing', { reason: String(error) });
    return NextResponse.json({ error: 'Server configuration incomplete' }, { status: 500 });
  }

  // Rate limit by IP (Stripe retries from a known set of IPs — this guards against abuse)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`stripe-webhook:${ip}`, 60, 60_000))) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const contentLength = parseInt(req.headers.get('content-length') ?? '0', 10);
  if (contentLength > 524_288) { // 512 KB — Stripe events can be moderately large
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  const body = await req.text(); // raw body required for Stripe signature
  const sig  = req.headers.get('stripe-signature') ?? '';

  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? '');
  } catch (err) {
    logger.error(ROUTE, 'webhook_sig_failed', { reason: String(err) });
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session  = event.data.object;
    const meta     = session.metadata ?? {};
    const userId   = meta.user_id;
    const pType    = meta.purchase_type as 'subscription' | 'course' | undefined;
    const plan     = meta.plan;
    const courseId = meta.course_id;

    if (!userId || !pType) {
      logger.error(ROUTE, 'webhook_missing_meta', { reason: session.id });
      return NextResponse.json({ ok: true }); // ack to Stripe, log only
    }

    // Idempotency — check if already processed
    const sessionId = session.id;
    const { data: existing } = await supabaseAdmin
      .from('purchases')
      .select('id')
      .eq('stripe_session_id', sessionId)
      .limit(1)
      .maybeSingle();

    if (!existing) {
      await supabaseAdmin.from('purchases').insert({
        user_id:           userId,
        purchase_type:     pType,
        course_id:         courseId ?? null,
        plan:              plan ?? null,
        amount:            session.amount_total ?? 0,
        stripe_session_id: sessionId,
        stripe_payment_intent: typeof session.payment_intent === 'string'
          ? session.payment_intent : null,
        status:            'completed',
        purchased_at:      new Date().toISOString(),
      });
    }

    if (pType === 'subscription') {
      await supabaseAdmin.from('subscriptions').upsert(
        {
          user_id:    userId,
          tier:       'premium',
          plan:       plan ?? 'annual',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
      logger.info(ROUTE, 'subscription_activated', { userId, reason: plan ?? 'annual' });
    } else if (pType === 'course' && courseId) {
      await supabaseAdmin.from('unlocked_courses').upsert(
        { user_id: userId, course_id: courseId, unlocked_at: new Date().toISOString() },
        { onConflict: 'user_id,course_id' },
      );
      logger.info(ROUTE, 'course_unlocked', { userId, reason: courseId });
    }
  }

  return NextResponse.json({ ok: true });
}

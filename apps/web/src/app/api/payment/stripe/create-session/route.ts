/**
 * POST /api/payment/stripe/create-session
 * Headers: Authorization: Bearer <access_token>
 * Body:    { purchaseType, plan?, courseId? }
 *
 * Creates a Stripe Checkout Session and returns { sessionUrl } for client redirect.
 * All pricing is derived server-side.
 *
 * Rate limit: 10 req / 60 s per IP
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import Stripe from 'stripe';
import { getStripe, STRIPE_SUBSCRIPTION_PRICES, getStripeCoursePrice } from '@/lib/stripe';
import { checkRateLimit } from '@/lib/rateLimiter';
import { logger } from '@/lib/logger';

const ROUTE = '/api/payment/stripe/create-session';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase admin env vars are required.');
  }

  return createClient(url, serviceRoleKey);
}

const BodySchema = z.object({
  purchaseType: z.enum(['subscription', 'course']),
  plan:         z.enum(['annual', 'monthly']).optional(),
  courseId:     z.string().min(1).max(100).optional(),
  quizId:       z.string().min(1).max(100).optional(), // for success redirect
});

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

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!(await checkRateLimit(`stripe-session:${ip}`, 10, 60_000))) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
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

  const contentLength = parseInt(req.headers.get('content-length') ?? '0', 10);
  if (contentLength > 4_096) {
    return NextResponse.json({ error: 'Request payload too large' }, { status: 413 });
  }

  let rawBody: unknown;
  try { rawBody = await req.json(); } catch { rawBody = null; }

  const parsed = BodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { purchaseType, plan, courseId, quizId } = parsed.data;

  // ── Build Stripe line item ────────────────────────────────────────────────
  const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://learnkloud.today';
  const successBase = `${origin}/dashboard/payment-success`;
  const cancelBase  = quizId ? `${origin}/dashboard/quiz/${quizId}` : `${origin}/dashboard/quizzes`;

  let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
  let sessionMode: 'payment' | 'subscription' = 'payment';
  let metadata: Record<string, string> = {
    user_id:       user.id,
    purchase_type: purchaseType,
    quiz_id:       quizId ?? '',
  };

  if (purchaseType === 'subscription') {
    if (!plan) return NextResponse.json({ error: 'plan required' }, { status: 400 });

    sessionMode = 'payment'; // one-time payment (not recurring Stripe subscription)
    const amountCents = STRIPE_SUBSCRIPTION_PRICES[plan];
    lineItems = [{
      price_data: {
        currency:     'usd',
        product_data: {
          name:        `LearnKloud Pro — ${plan === 'annual' ? 'Annual' : 'Monthly'}`,
          description: plan === 'annual'
            ? 'All-access pass: every quiz, domain, and certification track.'
            : 'Monthly all-access — cancel anytime.',
          images: [],
        },
        unit_amount: amountCents,
      },
      quantity: 1,
    }];
    metadata = { ...metadata, plan };
  } else {
    if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 });
    const amountCents = await getStripeCoursePrice(courseId, supabaseAdmin);
    if (!amountCents) {
      logger.error(ROUTE, 'course_price_missing', { userId: user.id, ip, reason: courseId });
      return NextResponse.json({ error: 'Course price not configured' }, { status: 400 });
    }
    lineItems = [{
      price_data: {
        currency:     'usd',
        product_data: {
          name:        `LearnKloud — Course Unlock`,
          description: `Permanent access to quiz: ${courseId}`,
          images: [],
        },
        unit_amount: amountCents,
      },
      quantity: 1,
    }];
    metadata = { ...metadata, course_id: courseId };
  }

  // ── Create Stripe Checkout Session ────────────────────────────────────────
  try {
    const session = await stripe.checkout.sessions.create({
      mode:                sessionMode,
      payment_method_types: ['card'],
      line_items:          lineItems,
      success_url:         `${successBase}?session_id={CHECKOUT_SESSION_ID}&quiz_id=${quizId ?? ''}`,
      cancel_url:          cancelBase,
      customer_email:      user.email ?? undefined,
      metadata,
      payment_intent_data: sessionMode === 'payment' ? { metadata } : undefined,
    });

    logger.info(ROUTE, 'stripe_session_created', {
      userId: user.id, ip,
      reason: `${purchaseType}:${plan ?? courseId ?? ''}`,
    });

    return NextResponse.json({ sessionUrl: session.url });
  } catch (err) {
    logger.error(ROUTE, 'stripe_session_failed', { userId: user.id, ip, reason: String(err) });
    return NextResponse.json({ error: 'Payment provider error' }, { status: 502 });
  }
}

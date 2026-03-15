/**
 * POST /api/payment/create-order
 * Headers: Authorization: Bearer <access_token>
 * Body:    { purchaseType, plan?, courseId?, currency? }
 *
 * Price is derived server-side from app_settings / hardcoded constants.
 * Clients cannot tamper with the amount.
 *
 * Rate limit: 10 req / 60 s per IP
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimiter';
import { logger } from '@/lib/logger';

const ROUTE = '/api/payment/create-order';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/** Prices in paise (₹ × 100) — hardcoded server-side, cannot be spoofed. */
const SUBSCRIPTION_PRICES: Record<'annual' | 'monthly', number> = {
  annual:  99900,  // ₹999
  monthly: 14900,  // ₹149
};

const BodySchema = z.object({
  purchaseType: z.enum(['subscription', 'course']),
  plan:         z.enum(['annual', 'monthly']).optional(),
  courseId:     z.string().min(1).max(100).optional(),
  currency:     z.string().max(3).default('INR'),
});

/** Looks up course price in paise from app_settings.quiz_catalog_overrides. */
async function getCoursePricePaise(courseId: string): Promise<number | null> {
  const { data } = await supabaseAdmin
    .from('app_settings')
    .select('value')
    .eq('key', 'quiz_catalog_overrides')
    .maybeSingle();
  if (!data?.value) return null;
  try {
    const overrides = data.value as Record<string, { price?: number }>;
    const price = overrides[courseId]?.price;
    if (typeof price === 'number' && price > 0) return Math.round(price * 100);
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!(await checkRateLimit(`payment-create:${ip}`, 10, 60_000))) {
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

  const { purchaseType, plan, courseId, currency } = parsed.data;

  // ── Derive server-side price ──────────────────────────────────────────────
  let amountPaise: number;
  if (purchaseType === 'subscription') {
    if (!plan) return NextResponse.json({ error: 'plan required' }, { status: 400 });
    amountPaise = SUBSCRIPTION_PRICES[plan];
  } else {
    if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 });
    const price = await getCoursePricePaise(courseId);
    if (!price) {
      logger.error(ROUTE, 'course_price_missing', { userId: user.id, ip, reason: courseId });
      return NextResponse.json({ error: 'Course price not configured' }, { status: 400 });
    }
    amountPaise = price;
  }

  // ── Create Razorpay order ─────────────────────────────────────────────────
  const receiptSuffix = purchaseType === 'course' && courseId
    ? `course-${courseId.slice(0, 20)}`
    : `sub-${plan ?? 'annual'}`;
  const receipt = `katalyst-${receiptSuffix}-${user.id.slice(0, 8)}-${Date.now()}`;

  const keyId     = process.env.RAZORPAY_KEY_ID     ?? '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? '';
  const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Basic ${authHeader}`,
    },
    body: JSON.stringify({
      amount:   amountPaise,
      currency,
      receipt,
      notes: {
        user_id:       user.id,
        purchase_type: purchaseType,
        ...(purchaseType === 'subscription' ? { plan: plan ?? 'annual' } : {}),
        ...(purchaseType === 'course'       ? { course_id: courseId ?? '' } : {}),
      },
    }),
  });

  if (!rzpRes.ok) {
    const errText = await rzpRes.text();
    logger.error(ROUTE, 'razorpay_order_failed', { userId: user.id, ip, reason: errText });
    return NextResponse.json({ error: 'Payment provider error' }, { status: 502 });
  }

  const order = await rzpRes.json() as { id: string; amount: number; currency: string };
  logger.info(ROUTE, 'order_created', {
    userId: user.id, ip,
    reason: `${purchaseType}:${plan ?? courseId ?? ''}`,
  });

  return NextResponse.json({
    orderId:      order.id,
    amount:       order.amount,
    currency:     order.currency,
    keyId,
    purchaseType,
    plan,
    courseId,
  });
}

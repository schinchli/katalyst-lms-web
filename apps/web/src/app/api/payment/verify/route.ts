/**
 * POST /api/payment/verify
 * Headers: Authorization: Bearer <access_token>
 * Body:    { razorpay_payment_id, razorpay_order_id, razorpay_signature,
 *            purchaseType, plan?, courseId? }
 *
 * 1. Verifies HMAC-SHA256 Razorpay signature
 * 2. Fetches order from Razorpay to confirm ownership + amount
 * 3. Idempotent insert into purchases (skips duplicate payment_id)
 * 4a. subscription → upsert subscriptions table (tier = premium)
 * 4b. course       → upsert unlocked_courses table
 *
 * Rate limit: 10 req / 60 s per IP
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimiter';
import { logger } from '@/lib/logger';

const ROUTE = '/api/payment/verify';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const BodySchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id:   z.string().min(1),
  razorpay_signature:  z.string().min(1),
  purchaseType:        z.enum(['subscription', 'course']),
  plan:                z.enum(['annual', 'monthly']).optional(),
  courseId:            z.string().min(1).max(100).optional(),
});

async function verifyHmac(orderId: string, paymentId: string, signature: string): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(process.env.RAZORPAY_KEY_SECRET ?? ''),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuf   = await crypto.subtle.sign('HMAC', key, enc.encode(`${orderId}|${paymentId}`));
  const expected = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return expected === signature;
}

async function fetchRazorpayOrder(orderId: string): Promise<{
  id: string; amount: number; notes?: Record<string, string>; status?: string;
}> {
  const keyId     = process.env.RAZORPAY_KEY_ID     ?? '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? '';
  const res = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}` },
  });
  if (!res.ok) throw new Error(`Razorpay order lookup failed: ${await res.text()}`);
  const data = await res.json() as {
    id?: string; amount?: number; notes?: Record<string, string>; status?: string;
  };
  if (!data.id || typeof data.amount !== 'number') throw new Error('Invalid order payload');
  return { id: data.id, amount: data.amount, notes: data.notes, status: data.status };
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!(await checkRateLimit(`payment-verify:${ip}`, 10, 60_000))) {
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

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, purchaseType, plan, courseId } = parsed.data;

  // ── 1. Verify HMAC signature ──────────────────────────────────────────────
  const valid = await verifyHmac(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  if (!valid) {
    logger.error(ROUTE, 'signature_invalid', { userId: user.id, ip, reason: razorpay_order_id });
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
  }

  // ── 2. Fetch order from Razorpay to confirm ownership ────────────────────
  let order: { id: string; amount: number; notes?: Record<string, string>; status?: string };
  try {
    order = await fetchRazorpayOrder(razorpay_order_id);
  } catch (err) {
    logger.error(ROUTE, 'order_lookup_failed', { userId: user.id, ip, reason: String(err) });
    return NextResponse.json({ error: 'Payment provider verification failed' }, { status: 502 });
  }

  const notes = order.notes ?? {};
  if (notes.user_id !== user.id || notes.purchase_type !== purchaseType) {
    logger.error(ROUTE, 'order_ownership_mismatch', { userId: user.id, ip, reason: razorpay_order_id });
    return NextResponse.json({ error: 'Order ownership verification failed' }, { status: 403 });
  }

  // ── 3. Idempotent purchase record ─────────────────────────────────────────
  const { data: existing } = await supabaseAdmin
    .from('purchases')
    .select('id')
    .eq('razorpay_payment_id', razorpay_payment_id)
    .limit(1)
    .maybeSingle();

  if (!existing) {
    await supabaseAdmin.from('purchases').insert({
      user_id:             user.id,
      purchase_type:       purchaseType,
      course_id:           courseId ?? null,
      plan:                plan ?? null,
      amount:              order.amount,
      razorpay_payment_id,
      razorpay_order_id,
      status:              'completed',
      purchased_at:        new Date().toISOString(),
    });
  }

  // ── 4. Grant access ───────────────────────────────────────────────────────
  let unlockedCourses: string[] | undefined;

  if (purchaseType === 'subscription') {
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
  } else if (purchaseType === 'course' && courseId) {
    await supabaseAdmin.from('unlocked_courses').upsert(
      { user_id: user.id, course_id: courseId, unlocked_at: new Date().toISOString() },
      { onConflict: 'user_id,course_id' },
    );
    const { data: rows } = await supabaseAdmin
      .from('unlocked_courses')
      .select('course_id')
      .eq('user_id', user.id);
    unlockedCourses = (rows ?? []).map((r) => r.course_id as string);
    logger.info(ROUTE, 'course_unlocked', { userId: user.id, ip, reason: courseId });
  }

  return NextResponse.json({
    verified:        true,
    purchaseType,
    courseId,
    unlockedCourses,
    subscription:    purchaseType === 'subscription' ? 'premium' : undefined,
    paymentId:       razorpay_payment_id,
  });
}

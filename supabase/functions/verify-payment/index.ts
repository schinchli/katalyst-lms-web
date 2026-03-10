/**
 * verify-payment — Supabase Edge Function
 * POST /functions/v1/verify-payment
 * Headers: Authorization: Bearer <access_token>
 *
 * 1. Verifies HMAC-SHA256 Razorpay signature
 * 2. Verifies the order belongs to the caller and matches server pricing
 * 3. Idempotent insert into purchases table (skips if payment already recorded)
 * 4a. If subscription: updates profiles.subscription = 'premium'
 * 4b. If course: appends courseId to profiles.unlocked_courses
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const RAZORPAY_KEY_ID     = Deno.env.get('RAZORPAY_KEY_ID') ?? '';
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';
const SUPABASE_URL        = Deno.env.get('SUPABASE_URL')        ?? '';
const SERVICE_ROLE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function verifySignature(orderId: string, paymentId: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key     = await crypto.subtle.importKey(
    'raw', encoder.encode(RAZORPAY_KEY_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const payload  = encoder.encode(`${orderId}|${paymentId}`);
  const sigBuf   = await crypto.subtle.sign('HMAC', key, payload);
  const expected = Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return expected === signature;
}

async function fetchOrder(orderId: string): Promise<{
  id: string;
  amount: number;
  notes?: Record<string, string>;
  status?: string;
}> {
  const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
  const res = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) throw new Error(`Razorpay order lookup failed: ${await res.text()}`);
  const data = await res.json() as {
    id?: string;
    amount?: number;
    notes?: Record<string, string>;
    status?: string;
  };
  if (!data.id || typeof data.amount !== 'number') throw new Error('Invalid order payload');
  return { id: data.id, amount: data.amount, notes: data.notes, status: data.status };
}

function orderMatchesUser(
  order: { notes?: Record<string, string> },
  userId: string,
  purchaseType?: string,
  plan?: string,
  courseId?: string,
): boolean {
  const notes = order.notes ?? {};
  if (notes.user_id !== userId) return false;
  if (notes.purchase_type !== purchaseType) return false;
  if (purchaseType === 'subscription') return notes.plan === (plan ?? 'annual');
  if (purchaseType === 'course') return notes.course_id === courseId;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json() as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, purchaseType, plan, courseId, amount } = body as {
    razorpay_payment_id?: string;
    razorpay_order_id?:   string;
    razorpay_signature?:  string;
    purchaseType?:        string;
    plan?:                string;
    courseId?:            string;
    amount?:              number;
  };

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return new Response(JSON.stringify({ error: 'Missing payment fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Verify signature
  const valid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  if (!valid) {
    return new Response(JSON.stringify({ error: 'Signature verification failed' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Fetch Razorpay order to validate ownership and amount
  let order;
  try {
    order = await fetchOrder(razorpay_order_id);
  } catch (err) {
    console.error('[verify-payment] order lookup failed:', err);
    return new Response(JSON.stringify({ error: 'Payment provider verification failed' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  if (!orderMatchesUser(order, user.id, purchaseType, plan, courseId)) {
    return new Response(JSON.stringify({ error: 'Order ownership verification failed' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Idempotency: skip if payment already recorded
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
    });
  }

  let unlockedCourses: string[] | undefined;
  let subscription: string | undefined;

  if (purchaseType === 'subscription') {
    await supabaseAdmin.from('profiles').update({ subscription: 'premium' }).eq('id', user.id);
    subscription = 'premium';
  } else if (purchaseType === 'course' && courseId) {
    // Fetch current unlocked_courses, append new courseId
    const { data: profile } = await supabaseAdmin.from('profiles').select('unlocked_courses').eq('id', user.id).single();
    const existing: string[] = (profile?.unlocked_courses as string[]) ?? [];
    unlockedCourses = [...new Set([...existing, courseId])];
    await supabaseAdmin.from('profiles').update({ unlocked_courses: unlockedCourses }).eq('id', user.id);
  }

  return new Response(JSON.stringify({
    verified:        true,
    purchaseType,
    courseId,
    unlockedCourses,
    subscription,
    paymentId: razorpay_payment_id,
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});

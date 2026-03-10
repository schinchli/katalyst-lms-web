/**
 * create-order — Supabase Edge Function
 * POST /functions/v1/create-order
 * Headers: Authorization: Bearer <access_token>
 *
 * Body: { purchaseType, plan?, courseId?, currency? }
 * Price is derived server-side to prevent client tampering.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const RAZORPAY_KEY_ID     = Deno.env.get('RAZORPAY_KEY_ID')     ?? '';
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';
const SUPABASE_URL        = Deno.env.get('SUPABASE_URL')        ?? '';
const SERVICE_ROLE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const COURSE_PRICES_JSON  = Deno.env.get('COURSE_PRICES_JSON') ?? '{}';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const SUBSCRIPTION_PRICES: Record<'annual' | 'monthly', number> = {
  annual: 99900,
  monthly: 14900,
};

function parseCoursePriceMap(raw: string): Record<string, number> {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const [key, val] of Object.entries(parsed)) {
      if (typeof val === 'number' && Number.isInteger(val) && val > 0) out[key] = val;
    }
    return out;
  } catch {
    return {};
  }
}

const COURSE_PRICE_MAP = parseCoursePriceMap(COURSE_PRICES_JSON);

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

  const { purchaseType, plan, courseId, currency = 'INR' } = body as {
    purchaseType?: string;
    plan?: string;
    courseId?: string;
    currency?: string;
  };

  if (!purchaseType || !['subscription', 'course'].includes(purchaseType)) {
    return new Response(JSON.stringify({ error: 'Invalid purchaseType' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  let amount: number | undefined;
  if (purchaseType === 'subscription') {
    if (!plan || (plan !== 'annual' && plan !== 'monthly')) {
      return new Response(JSON.stringify({ error: 'plan required for subscription' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    amount = SUBSCRIPTION_PRICES[plan];
  } else {
    if (!courseId) {
      return new Response(JSON.stringify({ error: 'courseId required for course purchase' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    amount = COURSE_PRICE_MAP[courseId];
    if (!amount) {
      return new Response(JSON.stringify({ error: 'Unsupported courseId or missing COURSE_PRICES_JSON' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  }

  const receiptSuffix = purchaseType === 'course' && courseId
    ? `course-${String(courseId).slice(0, 20)}`
    : `sub-${plan ?? 'annual'}`;
  const receipt = `katalyst-${receiptSuffix}-${user.id.slice(0, 8)}-${Date.now()}`;

  // Call Razorpay
  const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
  const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify({
      amount,
      currency,
      receipt,
      notes: {
        user_id: user.id,
        purchase_type: purchaseType,
        plan: purchaseType === 'subscription' ? plan ?? 'annual' : undefined,
        course_id: purchaseType === 'course' ? courseId ?? '' : undefined,
      },
    }),
  });

  if (!rzpRes.ok) {
    const errText = await rzpRes.text();
    console.error('[create-order] Razorpay error:', errText);
    return new Response(JSON.stringify({ error: 'Payment provider error' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const order = await rzpRes.json() as { id: string; amount: number; currency: string };

  return new Response(JSON.stringify({
    orderId:      order.id,
    amount:       order.amount,
    currency:     order.currency,
    keyId:        RAZORPAY_KEY_ID,
    purchaseType,
    plan,
    courseId,
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
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

  const { purchaseType, plan, courseId, amount, currency = 'INR' } = body as {
    purchaseType?: string;
    plan?: string;
    courseId?: string;
    amount?: number;
    currency?: string;
  };

  if (!purchaseType || !['subscription', 'course'].includes(purchaseType)) {
    return new Response(JSON.stringify({ error: 'Invalid purchaseType' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid amount' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const receiptSuffix = purchaseType === 'course' && courseId
    ? `course-${String(courseId).slice(0, 20)}`
    : `sub-${plan ?? 'annual'}`;
  const receipt = `katalyst-${receiptSuffix}-${user.id.slice(0, 8)}-${Date.now()}`;

  // Call Razorpay
  const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
  const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify({ amount, currency, receipt }),
  });

  if (!rzpRes.ok) {
    const errText = await rzpRes.text();
    console.error('[create-order] Razorpay error:', errText);
    return new Response(JSON.stringify({ error: 'Payment provider error' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const order = await rzpRes.json() as { id: string; amount: number; currency: string };

  return new Response(JSON.stringify({
    orderId:      order.id,
    amount:       order.amount,
    currency:     order.currency,
    keyId:        RAZORPAY_KEY_ID,
    purchaseType,
    plan,
    courseId,
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});

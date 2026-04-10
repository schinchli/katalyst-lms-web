/**
 * GET /api/admin/orders
 *
 * Paginated list of orders from the orders table (post-Phase 5 payments).
 * Falls back to purchases table for legacy records.
 * Admin-only. Query params: page, limit, status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }             from '@supabase/supabase-js';
import { checkRateLimit }           from '@/lib/rateLimiter';
import { logger }                   from '@/lib/logger';

const ROUTE = '/api/admin/orders';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!(await checkRateLimit(`admin-orders:${ip}`, 30, 60_000))) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json({ ok: false, error: 'Too many requests' }, {
      status: 429, headers: { 'Retry-After': '60' },
    });
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !user) {
    logger.authFail(ROUTE, 'invalid_token', { ip });
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!ADMIN_EMAILS.includes((user.email ?? '').toLowerCase())) {
    logger.authFail(ROUTE, 'not_admin', { ip, userId: user.id });
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const page   = Math.max(1, parseInt(req.nextUrl.searchParams.get('page')  ?? '1',  10));
  const limit  = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') ?? '20', 10)));
  const status = req.nextUrl.searchParams.get('status') ?? '';
  const from   = (page - 1) * limit;
  const to     = from + limit - 1;

  const db = serviceClient();

  try {
    // ── Primary: orders table (new records) ───────────────────────────────────
    let query = db
      .from('orders')
      .select('id, user_id, quiz_id, quiz_title, amount, currency, status, gateway, purchase_type, plan, user_name, user_email, razorpay_payment_id, stripe_session_id, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status && ['completed', 'pending', 'failed'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data: orders, error: ordersError, count } = await query;

    if (ordersError) {
      // Table may not exist yet — fall back to purchases
      logger.error(ROUTE, 'orders_table_missing_fallback', { ip, userId: user.id, reason: ordersError.message });
      return fetchFromPurchases(req, db, user.id, ip, page, limit, status, from, to);
    }

    // Enrich with user profiles for records missing user_name/user_email
    const missingProfileIds = (orders ?? [])
      .filter((o) => !o.user_name && o.user_id)
      .map((o) => o.user_id as string);

    const profileMap = new Map<string, { name: string; email: string }>();
    if (missingProfileIds.length > 0) {
      const { data: profiles } = await db
        .from('user_profiles')
        .select('id, name, email')
        .in('id', [...new Set(missingProfileIds)])
        .limit(100);
      for (const p of profiles ?? []) {
        profileMap.set(p.id as string, { name: (p.name as string) ?? 'Unknown', email: (p.email as string) ?? '' });
      }
    }

    const enriched = (orders ?? []).map((o) => {
      const profile = profileMap.get(o.user_id as string);
      return {
        id:           o.id as string,
        user_id:      o.user_id as string,
        user_name:    (o.user_name as string) ?? profile?.name ?? 'Unknown',
        user_email:   (o.user_email as string) ?? profile?.email ?? '',
        quiz_id:      (o.quiz_id as string) ?? '',
        quiz_title:   (o.quiz_title as string) ?? '',
        amount:       o.amount as number,
        currency:     (o.currency as string) ?? 'INR',
        status:       (o.status as string) ?? 'completed',
        gateway:      (o.gateway as string) ?? '',
        purchase_type:(o.purchase_type as string) ?? 'course',
        plan:         (o.plan as string) ?? null,
        payment_ref:  (o.razorpay_payment_id as string) ?? (o.stripe_session_id as string) ?? '',
        created_at:   o.created_at as string,
        _source:      'orders',
      };
    });

    return NextResponse.json({ ok: true, orders: enriched, total: count ?? 0 });

  } catch (err: unknown) {
    logger.error(ROUTE, 'unhandled_error', {
      ip, userId: user.id, reason: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ── Legacy fallback: purchases table ─────────────────────────────────────────
async function fetchFromPurchases(
  _req: NextRequest, db: ReturnType<typeof serviceClient>,
  userId: string, ip: string,
  _page: number, _limit: number, status: string, from: number, to: number,
) {
  let query = db
    .from('purchases')
    .select('id, user_id, quiz_id, amount, currency, status, gateway, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status && ['completed', 'pending', 'failed'].includes(status)) {
    query = query.eq('status', status);
  }

  const { data: orders, error, count } = await query;
  if (error) {
    logger.error(ROUTE, 'fetch_purchases_failed', { ip, userId, reason: error.message });
    return NextResponse.json({ ok: false, error: 'Failed to fetch orders' }, { status: 500 });
  }

  const userIds = [...new Set((orders ?? []).map((o) => o.user_id as string).filter(Boolean))];
  const profileMap = new Map<string, { name: string; email: string }>();
  if (userIds.length > 0) {
    const { data: profiles } = await db
      .from('user_profiles').select('id, name, email').in('id', userIds).limit(100);
    for (const p of profiles ?? []) {
      profileMap.set(p.id as string, { name: (p.name as string) ?? 'Unknown', email: (p.email as string) ?? '' });
    }
  }

  const enriched = (orders ?? []).map((o) => {
    const profile = profileMap.get(o.user_id as string);
    return {
      id:           o.id as string,
      user_id:      o.user_id as string,
      user_name:    profile?.name ?? 'Unknown',
      user_email:   profile?.email ?? '',
      quiz_id:      (o.quiz_id as string) ?? '',
      quiz_title:   '',
      amount:       o.amount as number,
      currency:     (o.currency as string) ?? 'INR',
      status:       (o.status as string) ?? 'completed',
      gateway:      (o.gateway as string) ?? '',
      purchase_type:'course',
      plan:         null,
      payment_ref:  '',
      created_at:   o.created_at as string,
      _source:      'purchases',
    };
  });

  return NextResponse.json({ ok: true, orders: enriched, total: count ?? 0 });
}

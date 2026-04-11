/**
 * GET /api/admin/ecommerce-stats
 *
 * Aggregated e-commerce stats for the admin dashboard. Admin-only.
 * Returns: totalRevenue, totalOrders, totalCustomers, proSubscribers, recentOrders (last 5).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }             from '@supabase/supabase-js';
import { checkRateLimit }           from '@/lib/rateLimiter';
import { logger }                   from '@/lib/logger';

const ROUTE = '/api/admin/ecommerce-stats';

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

  if (!(await checkRateLimit(`admin-ecom-stats:${ip}`, 30, 60_000))) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json({ ok: false, error: 'Too many requests' }, {
      status: 429, headers: { 'Retry-After': '60' },
    });
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

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

  const db = serviceClient();

  try {
    // Run queries in parallel
    const [purchasesRes, customersRes, proRes, recentRes] = await Promise.all([
      // Total orders + revenue (completed only for revenue)
      db.from('purchases')
        .select('id, amount, status', { count: 'exact' })
        .limit(10000),
      // Total customers
      db.from('user_profiles')
        .select('id', { count: 'exact' })
        .limit(1),
      // Pro subscribers
      db.from('user_profiles')
        .select('id', { count: 'exact' })
        .eq('is_pro', true)
        .limit(1),
      // Recent 5 orders with user join
      db.from('purchases')
        .select('id, user_id, quiz_id, amount, currency, status, gateway, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    // Calculate revenue from completed purchases
    const allPurchases = purchasesRes.data ?? [];
    const totalRevenue = allPurchases
      .filter((p) => (p.status as string) === 'completed')
      .reduce((sum, p) => sum + ((p.amount as number) ?? 0), 0);
    const totalOrders    = purchasesRes.count ?? 0;
    const totalCustomers = customersRes.count ?? 0;
    const proSubscribers = proRes.count ?? 0;

    // Enrich recent orders with user names
    const recentOrders = recentRes.data ?? [];
    const userIds = [...new Set(recentOrders.map((o) => o.user_id as string).filter(Boolean))];
    let userMap = new Map<string, string>();

    if (userIds.length > 0) {
      const { data: profiles } = await db
        .from('user_profiles')
        .select('id, name')
        .in('id', userIds)
        .limit(10);
      for (const p of profiles ?? []) {
        userMap.set(p.id as string, (p.name as string) ?? 'Unknown');
      }
    }

    const enrichedRecent = recentOrders.map((o) => ({
      id: o.id as string,
      user_id: o.user_id as string,
      user_name: userMap.get(o.user_id as string) ?? 'Unknown',
      quiz_id: (o.quiz_id as string) ?? '',
      amount: o.amount as number,
      currency: (o.currency as string) ?? 'INR',
      status: (o.status as string) ?? 'pending',
      gateway: (o.gateway as string) ?? '',
      created_at: o.created_at as string,
    }));

    return NextResponse.json({
      ok: true,
      stats: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        proSubscribers,
        recentOrders: enrichedRecent,
      },
    });
  } catch (err: unknown) {
    logger.error(ROUTE, 'unhandled_error', {
      ip, userId: user.id, reason: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

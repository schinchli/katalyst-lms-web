/**
 * GET /api/admin/purchases
 *
 * Returns ALL platform purchases (not just the requesting user's).
 * Admin-only — JWT verified + email checked against ADMIN_EMAILS env var.
 *
 * Response: { ok: true, purchases: PurchaseRecord[], totalRevenue: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }             from '@supabase/supabase-js';
import { checkRateLimit }           from '@/lib/rateLimiter';
import { logger }                   from '@/lib/logger';

const ROUTE = '/api/admin/purchases';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  // Rate limit — admin endpoint: 30 req/min
  if (!checkRateLimit(`admin-purchases:${ip}`, 30, 60_000)) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json({ ok: false, error: 'Too many requests' }, {
      status: 429, headers: { 'Retry-After': '60' },
    });
  }

  // Verify JWT
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
    logger.warn(ROUTE, 'invalid_token', { ip });
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin email
  if (!ADMIN_EMAILS.includes((user.email ?? '').toLowerCase())) {
    logger.warn(ROUTE, 'non_admin_access', { ip, userId: user.id, email: user.email });
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  // Fetch ALL purchases from Supabase using service role
  const db = adminClient();
  const { data, error } = await db
    .from('purchases')
    .select('id, user_id, purchase_type, course_id, course_name, plan, amount, purchased_at')
    .order('purchased_at', { ascending: false })
    .limit(500);

  if (error) {
    logger.error(ROUTE, 'fetch_failed', { ip, userId: user.id, reason: error.message });
    return NextResponse.json({ ok: false, error: 'Failed to fetch purchases' }, { status: 500 });
  }

  const purchases = (data ?? []).map((row) => ({
    id:           row.id as string,
    userId:       row.user_id as string,
    purchaseType: row.purchase_type as 'subscription' | 'course',
    courseId:     (row.course_id as string) ?? undefined,
    courseName:   (row.course_name as string) ?? undefined,
    plan:         (row.plan as string) ?? undefined,
    amount:       row.amount as number,
    date:         row.purchased_at as string,
  }));

  const totalRevenue = purchases.reduce((sum, p) => sum + p.amount, 0);

  return NextResponse.json({ ok: true, purchases, totalRevenue });
}

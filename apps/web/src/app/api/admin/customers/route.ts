/**
 * GET /api/admin/customers
 *
 * Paginated list of user_profiles. Admin-only.
 * Query params: page (default 1), limit (default 20), search (email/name filter).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }             from '@supabase/supabase-js';
import { checkRateLimit }           from '@/lib/rateLimiter';
import { logger }                   from '@/lib/logger';

const ROUTE = '/api/admin/customers';

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

  if (!(await checkRateLimit(`admin-customers:${ip}`, 30, 60_000))) {
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
    logger.authFail(ROUTE, 'invalid_token', { ip });
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!ADMIN_EMAILS.includes((user.email ?? '').toLowerCase())) {
    logger.authFail(ROUTE, 'not_admin', { ip, userId: user.id });
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  // Parse query params
  const page   = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1', 10));
  const limit  = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') ?? '20', 10)));
  const search = (req.nextUrl.searchParams.get('search') ?? '').trim();
  const from   = (page - 1) * limit;
  const to     = from + limit - 1;

  const db = serviceClient();

  try {
    let query = db
      .from('user_profiles')
      .select('id, name, email, is_pro, created_at, coins, streak', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error(ROUTE, 'fetch_failed', { ip, userId: user.id, reason: error.message });
      return NextResponse.json({ ok: false, error: 'Failed to fetch customers' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      customers: data ?? [],
      total: count ?? 0,
    });
  } catch (err: unknown) {
    logger.error(ROUTE, 'unhandled_error', {
      ip, userId: user.id, reason: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

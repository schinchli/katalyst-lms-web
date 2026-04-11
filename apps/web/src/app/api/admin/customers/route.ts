/**
 * GET /api/admin/customers
 *
 * Paginated list of users (from auth.users + user_profiles).
 * Enriches with email from auth, is_pro from subscriptions,
 * purchase_count and unlocked_count from purchases/unlocked_courses.
 * Admin-only.
 * Query params: page (default 1), limit (default 20), search (name filter).
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
    // Fetch user list from auth.users (only admin API has email access)
    const { data: authData, error: authListErr } = await db.auth.admin.listUsers({
      page,
      perPage: limit,
    });
    if (authListErr) {
      logger.error(ROUTE, 'auth_list_failed', { ip, userId: user.id, reason: authListErr.message });
      return NextResponse.json({ ok: false, error: 'Failed to fetch customers' }, { status: 500 });
    }

    let authUsers = authData.users ?? [];
    const total   = authData.total ?? authUsers.length;

    // Apply search filter on name or email
    if (search) {
      const q = search.toLowerCase();
      authUsers = authUsers.filter((u) =>
        (u.email ?? '').toLowerCase().includes(q) ||
        (u.user_metadata?.name ?? '').toLowerCase().includes(q),
      );
    }

    const userIds = authUsers.map((u) => u.id);

    // Fetch profiles for display name (user_profiles has id, name, role, created_at)
    const profileMap = new Map<string, { name: string | null; created_at: string }>();
    if (userIds.length > 0) {
      const { data: profiles } = await db
        .from('user_profiles')
        .select('id, name, created_at')
        .in('id', userIds);
      for (const p of profiles ?? []) {
        profileMap.set(p.id as string, {
          name:       (p.name as string | null) ?? null,
          created_at: p.created_at as string,
        });
      }
    }

    // Fetch subscription status (is_pro)
    const subscriptionMap = new Map<string, boolean>();
    if (userIds.length > 0) {
      const { data: subs } = await db
        .from('subscriptions')
        .select('user_id, tier')
        .in('user_id', userIds);
      for (const s of subs ?? []) {
        subscriptionMap.set(s.user_id as string, (s.tier as string) === 'premium');
      }
    }

    // Fetch purchase counts
    const purchaseCountMap = new Map<string, number>();
    const unlockedCountMap = new Map<string, number>();
    if (userIds.length > 0) {
      const { data: purchaseRows } = await db
        .from('purchases')
        .select('user_id')
        .in('user_id', userIds);
      for (const row of purchaseRows ?? []) {
        const uid = row.user_id as string;
        purchaseCountMap.set(uid, (purchaseCountMap.get(uid) ?? 0) + 1);
      }

      const { data: unlockedRows } = await db
        .from('unlocked_courses')
        .select('user_id')
        .in('user_id', userIds);
      for (const row of unlockedRows ?? []) {
        const uid = row.user_id as string;
        unlockedCountMap.set(uid, (unlockedCountMap.get(uid) ?? 0) + 1);
      }
    }

    // Build enriched customer list
    const customers = authUsers
      .filter((u) => u.id !== user.id) // exclude the requesting admin if desired
      .slice(from, to + 1)             // manual pagination slice for search results
      .map((u) => {
        const profile = profileMap.get(u.id);
        return {
          id:             u.id,
          name:           profile?.name ?? (u.user_metadata?.name as string | null) ?? null,
          email:          u.email ?? null,
          is_pro:         subscriptionMap.get(u.id) ?? false,
          created_at:     profile?.created_at ?? u.created_at,
          coins:          null as null,  // not in schema yet — shown as 0 in UI
          streak:         null as null,  // not in schema yet
          purchase_count: purchaseCountMap.get(u.id) ?? 0,
          unlocked_count: unlockedCountMap.get(u.id) ?? 0,
        };
      });

    return NextResponse.json({ ok: true, customers, total });

  } catch (err: unknown) {
    logger.error(ROUTE, 'unhandled_error', {
      ip, userId: user.id, reason: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

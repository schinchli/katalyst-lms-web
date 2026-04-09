/**
 * GET /api/admin/pending-reviews
 * Returns all quiz_reviews with status='pending' for admin moderation.
 * Admin-only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimiter';
import { logger } from '@/lib/logger';

const ROUTE = '/api/admin/pending-reviews';
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: { user } } = await anonClient.auth.getUser(token);
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  if (!ADMIN_EMAILS.includes((user.email ?? '').toLowerCase())) {
    logger.authFail(ROUTE, 'not_admin', { userId: user.id });
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  if (!(await checkRateLimit(`admin-pending-reviews:${user.id}`, 30, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await serviceClient
    .from('quiz_reviews')
    .select('id, user_id, quiz_id, rating, comment, flag_reason, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    logger.error(ROUTE, 'fetch_failed', { userId: user.id, reason: error.message });
    return NextResponse.json({ ok: false, error: 'Failed to fetch pending reviews' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, reviews: data ?? [] });
}

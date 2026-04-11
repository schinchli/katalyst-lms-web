/**
 * POST /api/admin/moderate-review
 * Approve or reject a pending user review.
 * Admin-only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimiter';
import { logger } from '@/lib/logger';

const ROUTE = '/api/admin/moderate-review';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

const ModerationSchema = z.object({
  reviewId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
});

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > 1024) {
    return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
  }

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

  if (!(await checkRateLimit(`admin-moderate:${user.id}`, 60, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = ModerationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }
  const { reviewId, action } = parsed.data;
  const newStatus = action === 'approve' ? 'published' : 'rejected';

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { error } = await serviceClient
    .from('quiz_reviews')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', reviewId);

  if (error) {
    logger.error(ROUTE, 'update_failed', { userId: user.id, reason: error.message });
    return NextResponse.json({ ok: false, error: 'Failed to update review' }, { status: 500 });
  }

  logger.info(ROUTE, 'review_moderated', { userId: user.id, reviewId, action });
  return NextResponse.json({ ok: true, status: newStatus });
}

/**
 * POST /api/admin/grant-access
 *
 * Admin grants a user access to a quiz/course without payment.
 * Writes to unlocked_courses + orders + purchases for a full audit trail.
 * Admin-only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient }             from '@supabase/supabase-js';
import { z }                        from 'zod';
import { checkRateLimit }           from '@/lib/rateLimiter';
import { logger }                   from '@/lib/logger';

const ROUTE = '/api/admin/grant-access';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const BodySchema = z.object({
  userId:     z.string().uuid('Invalid user ID'),
  quizId:     z.string().min(1).max(100),
  quizTitle:  z.string().max(200).optional(),
  reason:     z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!(await checkRateLimit(`admin-grant-access:${ip}`, 10, 60_000))) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const contentLength = Number(req.headers.get('content-length') ?? '0');
  if (contentLength > 4_096) {
    return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
  }

  // Verify admin token
  const token = (req.headers.get('authorization') ?? '').replace('Bearer ', '').trim();
  if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: { user: admin }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !admin) {
    logger.authFail(ROUTE, 'invalid_token', { ip });
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!ADMIN_EMAILS.includes((admin.email ?? '').toLowerCase())) {
    logger.authFail(ROUTE, 'not_admin', { ip, userId: admin.id });
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  let rawBody: unknown;
  try { rawBody = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { userId, quizId, quizTitle, reason } = parsed.data;
  const db = serviceClient();

  // Verify the target user exists
  const { data: targetUser, error: userErr } = await db
    .from('user_profiles')
    .select('id, name, email')
    .eq('id', userId)
    .maybeSingle();

  if (userErr || !targetUser) {
    return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
  }

  try {
    // 1. Unlock the course for this user
    const { error: unlockErr } = await db
      .from('unlocked_courses')
      .upsert(
        { user_id: userId, course_id: quizId, unlocked_at: new Date().toISOString() },
        { onConflict: 'user_id,course_id' },
      );

    if (unlockErr) {
      logger.error(ROUTE, 'unlock_failed', { userId: admin.id, targetUserId: userId, quizId, reason: unlockErr.message });
      return NextResponse.json({ ok: false, error: 'Failed to unlock course' }, { status: 500 });
    }

    // 2. Write to orders table (audit trail)
    const now = new Date().toISOString();
    await db.from('orders').insert({
      user_id:      userId,
      quiz_id:      quizId,
      quiz_title:   quizTitle ?? quizId,
      amount:       0,
      currency:     'INR',
      gateway:      'admin',
      status:       'completed',
      purchase_type:'course',
      plan:         null,
      user_name:    (targetUser.name as string) ?? '',
      user_email:   (targetUser.email as string) ?? '',
      metadata:     {
        granted_by:  admin.id,
        admin_email: admin.email,
        reason:      reason ?? 'Admin grant',
      },
    });

    // 3. Write to purchases table (for compatibility)
    await db.from('purchases').insert({
      user_id:       userId,
      purchase_type: 'course',
      course_id:     quizId,
      quiz_id:       quizId,
      plan:          null,
      amount:        0,
      status:        'completed',
      gateway:       'admin',
      currency:      'INR',
      purchased_at:  now,
    });

    logger.info(ROUTE, 'access_granted', {
      userId: admin.id, targetUserId: userId, quizId,
      reason: `Granted by admin ${admin.email}`,
    });

    return NextResponse.json({
      ok:          true,
      userId,
      quizId,
      userName:    (targetUser.name as string) ?? '',
      userEmail:   (targetUser.email as string) ?? '',
      grantedAt:   now,
    });

  } catch (err: unknown) {
    logger.error(ROUTE, 'unhandled_error', {
      userId: admin.id, reason: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

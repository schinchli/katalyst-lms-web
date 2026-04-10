/**
 * GET /api/admin/orders/[orderId]
 * Returns a single order record by ID. Admin-only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient }             from '@supabase/supabase-js';
import { checkRateLimit }           from '@/lib/rateLimiter';
import { logger }                   from '@/lib/logger';

const ROUTE = '/api/admin/orders/[orderId]';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

function serviceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!(await checkRateLimit(`admin-order-detail:${ip}`, 30, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const token = (req.headers.get('authorization') ?? '').replace('Bearer ', '').trim();
  if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: { user } } = await anonClient.auth.getUser(token);
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  if (!ADMIN_EMAILS.includes((user.email ?? '').toLowerCase())) {
    logger.authFail(ROUTE, 'not_admin', { ip, userId: user.id });
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const db = serviceClient();

  // Try orders table first
  const { data: order, error } = await db
    .from('orders')
    .select('id, user_id, quiz_id, quiz_title, amount, currency, status, gateway, purchase_type, plan, user_name, user_email, razorpay_payment_id, stripe_session_id, created_at')
    .eq('id', orderId)
    .maybeSingle();

  if (error || !order) {
    // Fall back to purchases table
    const { data: purchase } = await db
      .from('purchases')
      .select('id, user_id, quiz_id, amount, currency, status, gateway, created_at')
      .eq('id', orderId)
      .maybeSingle();

    if (!purchase) return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });

    const { data: profile } = await db
      .from('user_profiles').select('name, email').eq('id', purchase.user_id).maybeSingle();

    return NextResponse.json({
      ok: true,
      order: {
        id:           purchase.id,
        user_id:      purchase.user_id,
        user_name:    (profile as { name?: string } | null)?.name ?? 'Unknown',
        user_email:   (profile as { email?: string } | null)?.email ?? '',
        quiz_id:      (purchase.quiz_id as string) ?? '',
        quiz_title:   '',
        amount:       purchase.amount as number,
        currency:     (purchase.currency as string) ?? 'INR',
        status:       (purchase.status as string) ?? 'completed',
        gateway:      (purchase.gateway as string) ?? '',
        purchase_type:'course',
        plan:         null,
        payment_ref:  '',
        created_at:   purchase.created_at as string,
        _source:      'purchases',
      },
    });
  }

  // Enrich with user profile if user_name is missing
  let userName = (order.user_name as string) ?? '';
  let userEmail = (order.user_email as string) ?? '';
  if (!userName) {
    const { data: profile } = await db
      .from('user_profiles').select('name, email').eq('id', order.user_id).maybeSingle();
    userName = (profile as { name?: string } | null)?.name ?? 'Unknown';
    userEmail = (profile as { email?: string } | null)?.email ?? '';
  }

  return NextResponse.json({
    ok: true,
    order: {
      id:           order.id,
      user_id:      order.user_id,
      user_name:    userName,
      user_email:   userEmail,
      quiz_id:      (order.quiz_id as string) ?? '',
      quiz_title:   (order.quiz_title as string) ?? '',
      amount:       order.amount as number,
      currency:     (order.currency as string) ?? 'INR',
      status:       (order.status as string) ?? 'completed',
      gateway:      (order.gateway as string) ?? '',
      purchase_type:(order.purchase_type as string) ?? 'course',
      plan:         (order.plan as string) ?? null,
      payment_ref:  (order.razorpay_payment_id as string) ?? (order.stripe_session_id as string) ?? '',
      created_at:   order.created_at as string,
      _source:      'orders',
    },
  });
}

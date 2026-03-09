/**
 * POST /api/sync-user
 *
 * Upserts the authenticated user into Supabase user_profiles on every login.
 * Called fire-and-forget from the login page (.catch(() => {})).
 *
 * Body: { supabaseId, email, name, accessToken, createdAt, quizResults? }
 * Returns: { ok: true, action: 'created' | 'updated' }
 */

import { NextRequest, NextResponse }  from 'next/server';
import { createClient }               from '@supabase/supabase-js';
import { checkRateLimit }             from '@/lib/rateLimiter';
import { logger }                     from '@/lib/logger';
import { SyncUserSchema }             from '@/lib/schemas';

const ROUTE = '/api/sync-user';

/** Verify a Supabase JWT and return the authenticated user, or null. */
async function verifyToken(accessToken: string) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: { user }, error } = await client.auth.getUser(accessToken);
  if (error || !user) return null;
  return user;
}

/** Service-role client — bypasses RLS for server-side writes. */
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!checkRateLimit(`sync-user:${ip}`, 20, 60_000)) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json({ ok: false, error: 'Too many requests' }, {
      status: 429, headers: { 'Retry-After': '60' },
    });
  }

  // Rule 157-158: Reject oversized payloads
  const contentLength = parseInt(req.headers.get('content-length') ?? '0', 10);
  if (contentLength > 8_192) {
    return NextResponse.json({ ok: false, error: 'Request payload too large' }, { status: 413 });
  }

  let raw: unknown;
  try { raw = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 }); }

  const parsed = SyncUserSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn(ROUTE, 'validation_failed', { ip, reason: JSON.stringify(parsed.error.flatten()) });
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { supabaseId, email, name, accessToken } = parsed.data;

  // Verify the JWT and confirm identity — prevents impersonation
  const tokenUser = await verifyToken(accessToken);
  if (!tokenUser || tokenUser.id !== supabaseId) {
    logger.authFail(ROUTE, 'token_mismatch', { ip, userId: supabaseId });
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (tokenUser.email && tokenUser.email !== email) {
    logger.authFail(ROUTE, 'email_mismatch', { ip, userId: supabaseId });
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const displayName = name?.trim() ? name.trim().slice(0, 100) : email.split('@')[0].slice(0, 100);

  try {
    const db = adminClient();

    // Check if profile already exists
    const { data: existing } = await db
      .from('user_profiles')
      .select('id')
      .eq('id', supabaseId)
      .maybeSingle();

    const action = existing ? 'updated' : 'created';

    const { error: upsertErr } = await db
      .from('user_profiles')
      .upsert(
        { id: supabaseId, name: displayName, updated_at: new Date().toISOString() },
        { onConflict: 'id' },
      );

    if (upsertErr) {
      logger.error(ROUTE, 'upsert_failed', { ip, userId: supabaseId, reason: upsertErr.message });
      return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
    }

    logger.info(ROUTE, 'sync_complete', { ip, userId: supabaseId, action });
    return NextResponse.json({ ok: true, action });

  } catch (err: unknown) {
    logger.error(ROUTE, 'unhandled_error', { ip, reason: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/sync-user — health check
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkRateLimit(`sync-user-get:${ip}`, 10, 60_000)) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const auth  = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const user = await verifyToken(token);
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const { count } = await adminClient()
    .from('user_profiles')
    .select('id', { count: 'exact', head: true });

  return NextResponse.json({ ok: true, totalUsers: count ?? 0 });
}

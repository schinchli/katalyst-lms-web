/**
 * POST /api/account/delete
 *
 * Permanently deletes the authenticated user's account and all associated data.
 *
 * Tables cleaned (in order):
 *   - quiz_results      (user's quiz history)
 *   - coin_transactions (if table exists)
 *   - referral_redemptions (if table exists)
 *   - user_profiles     (display name, role, etc.)
 *   - auth.users        (via supabase.auth.admin.deleteUser — cascades RLS rows)
 *
 * Rate limit: 5 req/min per IP (destructive action).
 * Auth: Bearer token required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimiter';
import { logger } from '@/lib/logger';

const ROUTE = '/api/account/delete';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  const len = Number(req.headers.get('content-length') ?? '0');
  if (len > 1_024) {
    return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
  }

  // Rate limit: very low — this is a destructive, irreversible action
  if (!(await checkRateLimit(`account-delete:${ip}`, 5, 60_000))) {
    logger.warn(ROUTE, 'rate limit exceeded', { ip });
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  // Verify Bearer token
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    logger.warn(ROUTE, 'missing auth token', { ip });
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceRoleKey) {
    logger.error(ROUTE, 'Supabase env vars not configured', { ip });
    return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 });
  }

  // Verify the token and get the user's ID
  const anonClient = createClient(url, anonKey);
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);

  if (authError || !user) {
    logger.warn(ROUTE, 'invalid auth token', { ip, reason: authError?.message });
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  logger.info(ROUTE, 'account deletion requested', { userId, ip });

  // Use service role for all deletions
  const adminClient = createClient(url, serviceRoleKey);

  try {
    // Delete quiz results
    const { error: quizResultsError } = await adminClient
      .from('quiz_results')
      .delete()
      .eq('user_id', userId);
    if (quizResultsError) {
      logger.error(ROUTE, 'failed to delete quiz_results', { userId, error: quizResultsError.message });
      throw new Error('Failed to delete quiz history');
    }

    // Delete coin transactions (best-effort — table may not exist yet)
    await adminClient.from('coin_transactions').delete().eq('user_id', userId);

    // Delete referral redemptions (best-effort — table may not exist yet)
    await adminClient.from('referral_redemptions').delete().eq('user_id', userId);

    // Delete user profile
    const { error: profileError } = await adminClient
      .from('user_profiles')
      .delete()
      .eq('id', userId);
    if (profileError) {
      logger.error(ROUTE, 'failed to delete user_profiles row', { userId, error: profileError.message });
      throw new Error('Failed to delete user profile');
    }

    // Delete auth user — this cascades any remaining RLS-protected rows
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      logger.error(ROUTE, 'failed to delete auth user', { userId, error: deleteUserError.message });
      throw new Error('Failed to delete auth account');
    }

    logger.info(ROUTE, 'account deletion complete', { userId, ip });
    return NextResponse.json({
      ok: true,
      message: 'Your account and all associated data have been permanently deleted.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error during account deletion';
    logger.error(ROUTE, message, { userId, ip });
    // Never silently fail a partial delete — surface the error so the user can retry
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

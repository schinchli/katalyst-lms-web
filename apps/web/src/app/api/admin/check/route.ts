/**
 * GET /api/admin/check
 *
 * Returns { isAdmin: boolean } after server-side JWT verification.
 *
 * Security:
 *  - Verifies Supabase JWT (no localStorage bypass possible)
 *  - Admin list stored server-side in ADMIN_EMAILS env var
 *  - OWASP A01 (Broken Access Control) remediation
 *  - Rate limited: 30 req / 60 s per IP
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }               from '@supabase/supabase-js';
import { checkRateLimit }             from '@/lib/rateLimiter';
import { logger }                     from '@/lib/logger';

function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? '';
  return new Set(
    raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean),
  );
}

async function verifyToken(accessToken: string) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: { user }, error } = await client.auth.getUser(accessToken);
  if (error || !user) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const ROUTE = '/api/admin/check';
  const ip    = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  // ── Rate limiting ──────────────────────────────────────────────────────────
  if (!(await checkRateLimit(`admin-check:${ip}`, 30, 60_000))) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json(
      { isAdmin: false, error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  // ── Parse token ────────────────────────────────────────────────────────────
  const auth  = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';

  if (!token) {
    logger.authFail(ROUTE, 'missing_token', { ip });
    return NextResponse.json({ isAdmin: false, error: 'Unauthorized' }, { status: 401 });
  }

  // ── Verify JWT server-side ─────────────────────────────────────────────────
  const user = await verifyToken(token);
  if (!user) {
    logger.authFail(ROUTE, 'invalid_token', { ip });
    return NextResponse.json({ isAdmin: false, error: 'Unauthorized' }, { status: 401 });
  }

  // ── Check admin status ─────────────────────────────────────────────────────
  const adminEmails = getAdminEmails();
  const emailMatch  = user.email ? adminEmails.has(user.email.toLowerCase()) : false;
  const isAdmin     = emailMatch;

  if (!isAdmin) {
    logger.authFail(ROUTE, 'not_admin', { ip, userId: user.id });
  } else {
    logger.info(ROUTE, 'admin_verified', { ip, userId: user.id });
  }

  return NextResponse.json({ isAdmin, userId: user.id }, { status: 200 });
}

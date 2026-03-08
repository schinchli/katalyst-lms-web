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
  // ── Rate limiting ──────────────────────────────────────────────────────────
  const ip  = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const key = `admin-check:${ip}`;
  if (!checkRateLimit(key, 30, 60_000)) {
    return NextResponse.json(
      { isAdmin: false, error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  // ── Parse token ────────────────────────────────────────────────────────────
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';

  if (!token) {
    return NextResponse.json({ isAdmin: false, error: 'Unauthorized' }, { status: 401 });
  }

  // ── Verify JWT server-side ─────────────────────────────────────────────────
  const user = await verifyToken(token);
  if (!user) {
    return NextResponse.json({ isAdmin: false, error: 'Unauthorized' }, { status: 401 });
  }

  // ── Check admin status ─────────────────────────────────────────────────────
  // 1. Email allowlist (env var ADMIN_EMAILS=a@b.com,c@d.com)
  const adminEmails = getAdminEmails();
  const emailMatch  = user.email ? adminEmails.has(user.email.toLowerCase()) : false;

  // 2. Supabase user_metadata.role = 'admin' (set via Supabase Dashboard)
  const metaRole = (user.user_metadata as Record<string, unknown>)?.role;
  const metaMatch = metaRole === 'admin';

  const isAdmin = emailMatch || metaMatch;

  return NextResponse.json({ isAdmin, userId: user.id }, { status: 200 });
}

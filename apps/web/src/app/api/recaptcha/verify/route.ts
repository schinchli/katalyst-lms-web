/**
 * POST /api/recaptcha/verify
 * Verifies a reCAPTCHA v3 token server-side. Secret key never leaves the server.
 *
 * Body: { token: string, action: string }
 * Returns: { ok: boolean, score?: number } | { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z }                          from 'zod';
import { verifyRecaptcha }            from '@/lib/recaptcha';
import { checkRateLimit }             from '@/lib/rateLimiter';
import { logger }                     from '@/lib/logger';

const ROUTE = '/api/recaptcha/verify';

const BodySchema = z.object({
  token:  z.string(),
  action: z.enum(['login', 'signup', 'reset_password', 'profile_save', 'contact']),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  // 10 verifications / 60 s per IP
  if (!checkRateLimit(`recaptcha:${ip}`, 10, 60_000)) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let raw: unknown;
  try { raw = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { token, action } = parsed.data;

  // If token is empty the reCAPTCHA script failed to load (CSP, network, etc.).
  // Log and allow through — server-side rate limiting is the real protection.
  if (!token) {
    logger.warn(ROUTE, 'recaptcha_token_empty', { ip, action });
    return NextResponse.json({ ok: true, score: 0, note: 'recaptcha_skipped' });
  }

  const result = await verifyRecaptcha(token, action);

  if (!result.ok) {
    logger.warn(ROUTE, 'recaptcha_failed', { ip, action, reason: result.error, score: result.score });
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  logger.info(ROUTE, 'recaptcha_passed', { ip, action, score: result.score });
  return NextResponse.json({ ok: true, score: result.score });
}

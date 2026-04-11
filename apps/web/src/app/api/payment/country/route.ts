/**
 * GET /api/payment/country
 * Returns the caller's two-letter country code using Vercel's edge-provided
 * x-vercel-ip-country header (free, no external API). Falls back to 'IN'
 * so the client always has a sensible default.
 *
 * Rate limit: 60 req / 60 s per IP
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimiter';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`payment-country:${ip}`, 60, 60_000))) {
    return NextResponse.json({ country: 'IN' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  // Vercel sets this header automatically on every edge request.
  // In local dev it will be absent — we default to 'IN'.
  const country = req.headers.get('x-vercel-ip-country') ?? 'IN';
  return NextResponse.json({ country }, {
    headers: { 'Cache-Control': 'private, max-age=3600' },
  });
}

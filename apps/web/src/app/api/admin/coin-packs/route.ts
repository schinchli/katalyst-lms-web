/**
 * Admin-only: GET/POST managed coin packs
 *
 * GET  — returns all coin packs (including disabled) for admin view
 * POST — saves the full coin packs array to app_settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }             from '@supabase/supabase-js';
import { z }                        from 'zod';
import { checkRateLimit }           from '@/lib/rateLimiter';
import { logger }                   from '@/lib/logger';
import type { CoinPack }            from '@/types';

const ROUTE = '/api/admin/coin-packs';
export const MANAGED_COIN_PACKS_KEY = 'managed_coin_packs';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function verifyAdmin(req: NextRequest) {
  const auth  = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return { ok: false as const, status: 401, error: 'Unauthorized' };

  const { data: { user }, error } = await anonClient().auth.getUser(token);
  if (error || !user) return { ok: false as const, status: 401, error: 'Unauthorized' };
  if (!ADMIN_EMAILS.includes((user.email ?? '').toLowerCase())) {
    return { ok: false as const, status: 403, error: 'Forbidden' };
  }
  return { ok: true as const, user };
}

const CoinPackSchema = z.object({
  id:       z.string().min(1).max(64),
  label:    z.string().min(1).max(100),
  coins:    z.number().int().positive(),
  priceInr: z.number().min(0),
  priceUsd: z.number().min(0),
  popular:  z.boolean().optional(),
  enabled:  z.boolean(),
});

function normalizeCoinPack(raw: unknown): CoinPack | null {
  const result = CoinPackSchema.safeParse(raw);
  if (!result.success) return null;
  return {
    id:       result.data.id,
    label:    result.data.label,
    coins:    result.data.coins,
    priceInr: result.data.priceInr,
    priceUsd: result.data.priceUsd,
    popular:  result.data.popular ?? false,
    enabled:  result.data.enabled,
  };
}

function normalizeCoinPacks(value: unknown): CoinPack[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeCoinPack).filter((p): p is CoinPack => p !== null);
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`admin-coin-packs-get:${ip}`, 30, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const auth = await verifyAdmin(req);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const { data } = await adminClient()
    .from('app_settings')
    .select('value')
    .eq('key', MANAGED_COIN_PACKS_KEY)
    .maybeSingle();

  return NextResponse.json({ ok: true, packs: normalizeCoinPacks(data?.value) });
}

const SavePacksSchema = z.object({
  packs: z.array(z.unknown()),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`admin-coin-packs-post:${ip}`, 20, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const contentLength = parseInt(req.headers.get('content-length') ?? '0', 10);
  if (contentLength > 32_768) {
    return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
  }

  const auth = await verifyAdmin(req);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = SavePacksSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const packs = normalizeCoinPacks(parsed.data.packs);

  const { error } = await adminClient()
    .from('app_settings')
    .upsert({
      key:        MANAGED_COIN_PACKS_KEY,
      value:      packs,
      updated_by: auth.user.id,
    }, { onConflict: 'key' });

  if (error) {
    logger.error(ROUTE, 'save_failed', { ip, userId: auth.user.id, reason: error.message });
    return NextResponse.json({ ok: false, error: 'Failed to save coin packs' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, packs });
}

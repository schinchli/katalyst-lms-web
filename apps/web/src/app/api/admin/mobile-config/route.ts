import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimiter';
import { normalizePlatformExperience } from '@/lib/platformExperience';
import { z } from 'zod';

// Platform experience config — the NESTED shape that both readers
// (web lib/platformExperience.ts and mobile config/platformExperience.ts)
// expect and that the Settings page + mobile admin save actually POST.
// Sections are loose records (bounded value types); the exact field set is
// enforced by normalizePlatformExperience before persisting.
const MobileConfigSchema = z.object({
  copy:    z.record(z.string().max(64), z.string().max(512)).optional(),
  colors:  z.record(z.string().max(64), z.string().max(64)).optional(),
  layout:  z.record(z.string().max(64), z.union([z.string().max(32), z.number(), z.boolean()])).optional(),
  widgets: z.record(z.string().max(64), z.boolean()).optional(),
  theme:   z.record(z.string().max(64), z.union([z.string().max(64), z.null()])).optional(),
}).strict();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

const MOBILE_PLATFORM_CONFIG_KEY = 'mobile_experience_config';

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

async function verifyAdminFromAuthHeader(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return { ok: false as const, status: 401, error: 'Unauthorized' };

  const { data: { user }, error } = await anonClient().auth.getUser(token);
  if (error || !user) return { ok: false as const, status: 401, error: 'Unauthorized' };
  if (!ADMIN_EMAILS.includes((user.email ?? '').toLowerCase())) {
    return { ok: false as const, status: 403, error: 'Forbidden' };
  }

  return { ok: true as const, user };
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`admin-mobile-config:${ip}`, 10, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const len = Number(req.headers.get('content-length') ?? '0');
  const MAX_BODY = 32_768;
  if (len > MAX_BODY) {
    return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
  }

  const auth = await verifyAdminFromAuthHeader(req);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  let raw: unknown = null;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = MobileConfigSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  // Normalize to the canonical experience shape (fills defaults, clamps
  // counts, validates the theme preset) — mobile-only extras like
  // widgets.showDiscountBanner / theme.platformAccent survive the merge.
  const config = normalizePlatformExperience(parsed.data);

  const { error } = await adminClient()
    .from('app_settings')
    .upsert({
      key: MOBILE_PLATFORM_CONFIG_KEY,
      value: config,
      updated_by: auth.user.id,
    }, { onConflict: 'key' });

  if (error) return NextResponse.json({ ok: false, error: 'Failed to save mobile config' }, { status: 500 });
  return NextResponse.json({ ok: true, config });
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`admin-mobile-config-get:${ip}`, 30, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  const auth = await verifyAdminFromAuthHeader(req);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const { data, error } = await adminClient()
    .from('app_settings')
    .select('value')
    .eq('key', MOBILE_PLATFORM_CONFIG_KEY)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: true, config: null });
  return NextResponse.json({ ok: true, config: data?.value ?? null });
}

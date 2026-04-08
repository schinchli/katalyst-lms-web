import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimiter';
import { z } from 'zod';

// Mobile experience config schema — only allow known keys with safe types
const MobileConfigSchema = z.object({
  primaryColor:     z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor:      z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  platformTheme:    z.string().max(64).optional(),
  appName:          z.string().max(128).optional(),
  logoUrl:          z.string().url().max(512).optional(),
  welcomeMessage:   z.string().max(512).optional(),
  features:         z.record(z.string().max(64), z.boolean()).optional(),
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

  const { error } = await adminClient()
    .from('app_settings')
    .upsert({
      key: MOBILE_PLATFORM_CONFIG_KEY,
      value: parsed.data,
      updated_by: auth.user.id,
    }, { onConflict: 'key' });

  if (error) return NextResponse.json({ ok: false, error: 'Failed to save mobile config' }, { status: 500 });
  return NextResponse.json({ ok: true, config: parsed.data });
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

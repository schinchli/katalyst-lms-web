import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimiter';
import {
  DEFAULT_PLATFORM_THEME,
  PLATFORM_THEME_KEY,
  normalizePlatformTheme,
} from '@/lib/platformTheme';

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
  if (!(await checkRateLimit(`admin-theme:${ip}`, 30, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const auth = await verifyAdminFromAuthHeader(req);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const theme = normalizePlatformTheme(body);
  const { error } = await adminClient()
    .from('app_settings')
    .upsert({
      key: PLATFORM_THEME_KEY,
      value: theme,
      updated_by: auth.user.id,
    }, { onConflict: 'key' });

  if (error) {
    return NextResponse.json({ ok: false, error: 'Failed to save theme' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, theme });
}

export async function GET(req: NextRequest) {
  const auth = await verifyAdminFromAuthHeader(req);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const { data, error } = await adminClient()
    .from('app_settings')
    .select('value')
    .eq('key', PLATFORM_THEME_KEY)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: true, theme: DEFAULT_PLATFORM_THEME });
  return NextResponse.json({ ok: true, theme: normalizePlatformTheme(data?.value) });
}


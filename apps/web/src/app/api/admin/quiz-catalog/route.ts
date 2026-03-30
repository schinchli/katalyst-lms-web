import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimiter';
import { normalizeQuizCatalogOverrides, QUIZ_CATALOG_OVERRIDES_KEY } from '@/lib/quizCatalog';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);

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

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`admin-quiz-catalog-get:${ip}`, 30, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  const auth = await verifyAdminFromAuthHeader(req);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const { data, error } = await adminClient()
    .from('app_settings')
    .select('value')
    .eq('key', QUIZ_CATALOG_OVERRIDES_KEY)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: true, overrides: {} });
  return NextResponse.json({ ok: true, overrides: normalizeQuizCatalogOverrides(data?.value) });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`admin-quiz-catalog:${ip}`, 10, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const len = Number(req.headers.get('content-length') ?? '0');
  const MAX_BODY = 32_768;
  if (len > MAX_BODY) {
    return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
  }

  const auth = await verifyAdminFromAuthHeader(req);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const overrides = normalizeQuizCatalogOverrides(body);

  const { error } = await adminClient()
    .from('app_settings')
    .upsert({
      key: QUIZ_CATALOG_OVERRIDES_KEY,
      value: overrides,
      updated_by: auth.user.id,
    }, { onConflict: 'key' });

  if (error) return NextResponse.json({ ok: false, error: 'Failed to save quiz catalog overrides' }, { status: 500 });
  return NextResponse.json({ ok: true, overrides });
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimiter';
import type { Contest, ContestStatus } from '@/types';

export const MANAGED_CONTESTS_KEY = 'managed_contests';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

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

const VALID_STATUSES = new Set<ContestStatus>(['live', 'upcoming', 'past']);

export function normalizeContest(raw: unknown): Contest | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const id = typeof r.id === 'string' && r.id.trim() ? r.id.trim() : null;
  const title = typeof r.title === 'string' && r.title.trim() ? r.title.trim() : null;
  if (!id || !title) return null;

  const status: ContestStatus = VALID_STATUSES.has(r.status as ContestStatus)
    ? (r.status as ContestStatus)
    : 'upcoming';

  const quizId = typeof r.quizId === 'string' ? r.quizId.trim() : '';
  const quizTitle = typeof r.quizTitle === 'string' ? r.quizTitle.trim() : '';
  const category = typeof r.category === 'string' ? r.category.trim() : 'general';
  const icon = typeof r.icon === 'string' ? r.icon.trim() : 'award';
  const description = typeof r.description === 'string' ? r.description.trim() : '';

  const toNonNegInt = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));
  const entryFee = toNonNegInt(r.entryFee);
  const prizeCoins = toNonNegInt(r.prizeCoins);
  const participants = toNonNegInt(r.participants);
  const maxParticipants = toNonNegInt(r.maxParticipants) || 100;

  // Validate ISO date strings
  const toIso = (v: unknown): string => {
    if (typeof v !== 'string') return new Date().toISOString();
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  };
  const startTime = toIso(r.startTime);
  const endTime = toIso(r.endTime);

  const contest: Contest = {
    id,
    title,
    description,
    status,
    quizId,
    quizTitle,
    category,
    icon,
    entryFee,
    prizeCoins,
    startTime,
    endTime,
    participants,
    maxParticipants,
  };

  if (r.topScore !== undefined) {
    contest.topScore = Math.max(0, Math.round(Number(r.topScore) || 0));
  }
  if (typeof r.winner === 'string' && r.winner.trim()) {
    contest.winner = r.winner.trim();
  }
  if (typeof r.rules === 'string' && r.rules.trim()) {
    contest.rules = r.rules.trim();
  }
  if (r.maxAttempts !== undefined) {
    const ma = Math.max(1, Math.round(Number(r.maxAttempts) || 1));
    contest.maxAttempts = ma;
  }
  if (typeof r.resultsPublishedAt === 'string') {
    const d = new Date(r.resultsPublishedAt);
    if (!isNaN(d.getTime())) contest.resultsPublishedAt = d.toISOString();
  }

  return contest;
}

function normalizeContests(raw: unknown): Contest[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeContest).filter((c): c is Contest => c !== null);
}

export async function GET(req: NextRequest) {
  const auth = await verifyAdminFromAuthHeader(req);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const { data, error } = await adminClient()
    .from('app_settings')
    .select('value')
    .eq('key', MANAGED_CONTESTS_KEY)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: true, contests: [] });
  return NextResponse.json({ ok: true, contests: normalizeContests(data?.value) });
}

const postBodySchema = z.object({
  contests: z.array(z.unknown()),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`admin-contests:${ip}`, 20, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const len = Number(req.headers.get('content-length') ?? '0');
  if (len > 65_536) {
    return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
  }

  const auth = await verifyAdminFromAuthHeader(req);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  let rawBody: unknown = null;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = postBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const contests = normalizeContests(parsed.data.contests);

  const { error } = await adminClient()
    .from('app_settings')
    .upsert(
      { key: MANAGED_CONTESTS_KEY, value: contests, updated_by: auth.user.id },
      { onConflict: 'key' },
    );

  if (error) {
    return NextResponse.json({ ok: false, error: 'Failed to save contests' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, contests });
}

const deleteBodySchema = z.object({
  contestId: z.string().min(1),
});

export async function DELETE(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`admin-contests:${ip}`, 20, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const auth = await verifyAdminFromAuthHeader(req);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  let rawBody: unknown = null;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = deleteBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { contestId } = parsed.data;
  const db = adminClient();

  const { data: existing, error: fetchError } = await db
    .from('app_settings')
    .select('value')
    .eq('key', MANAGED_CONTESTS_KEY)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ ok: false, error: 'Failed to fetch contests' }, { status: 500 });
  }

  const current = normalizeContests(existing?.value);
  const updated = current.filter((c) => c.id !== contestId);

  const { error: saveError } = await db
    .from('app_settings')
    .upsert(
      { key: MANAGED_CONTESTS_KEY, value: updated, updated_by: auth.user.id },
      { onConflict: 'key' },
    );

  if (saveError) {
    return NextResponse.json({ ok: false, error: 'Failed to delete contest' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deletedContestId: contestId });
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimiter';
import { MANAGED_QUIZ_CONTENT_KEY, normalizeManagedQuizContent } from '@/lib/managedQuizContent';
import { SYSTEM_FEATURES_KEY, normalizeSystemFeatures } from '@/lib/systemFeatures';

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

export async function GET(req: NextRequest) {
  const auth = await verifyAdminFromAuthHeader(req);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const { data, error } = await adminClient()
    .from('app_settings')
    .select('value')
    .eq('key', MANAGED_QUIZ_CONTENT_KEY)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: true, content: { quizzes: [], questions: {} } });
  return NextResponse.json({ ok: true, content: normalizeManagedQuizContent(data?.value) });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`admin-quiz-content:${ip}`, 20, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const len = Number(req.headers.get('content-length') ?? '0');
  const MAX_BODY = 262_144;
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

  const content = normalizeManagedQuizContent(body);

  const { error } = await adminClient()
    .from('app_settings')
    .upsert({
      key: MANAGED_QUIZ_CONTENT_KEY,
      value: content,
      updated_by: auth.user.id,
    }, { onConflict: 'key' });

  if (error) {
    return NextResponse.json({ ok: false, error: 'Failed to save managed quiz content' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, content });
}

const deleteBodySchema = z.object({
  quizId: z.string().min(1),
});

export async function DELETE(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`admin-quiz-content:${ip}`, 20, 60_000))) {
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

  const { quizId } = parsed.data;
  const db = adminClient();

  // Fetch current managed content
  const { data: contentData, error: contentError } = await db
    .from('app_settings')
    .select('value')
    .eq('key', MANAGED_QUIZ_CONTENT_KEY)
    .maybeSingle();

  if (contentError) {
    return NextResponse.json({ ok: false, error: 'Failed to fetch managed quiz content' }, { status: 500 });
  }

  const current = normalizeManagedQuizContent(contentData?.value);

  // Remove the quiz and its questions
  const updatedContent = {
    quizzes: current.quizzes.filter((quiz) => quiz.id !== quizId),
    questions: Object.fromEntries(
      Object.entries(current.questions).filter(([key]) => key !== quizId),
    ),
  };

  // Check if this quiz is configured as the daily quiz — if so, clear dailyQuizQuizId
  const { data: featuresData } = await db
    .from('app_settings')
    .select('value')
    .eq('key', SYSTEM_FEATURES_KEY)
    .maybeSingle();

  const systemFeatures = normalizeSystemFeatures(featuresData?.value);
  if (systemFeatures.dailyQuizQuizId === quizId) {
    const updatedFeatures = { ...systemFeatures, dailyQuizQuizId: '' };
    await db
      .from('app_settings')
      .upsert({ key: SYSTEM_FEATURES_KEY, value: updatedFeatures, updated_by: auth.user.id }, { onConflict: 'key' });
  }

  // Save updated content
  const { error: saveError } = await db
    .from('app_settings')
    .upsert(
      { key: MANAGED_QUIZ_CONTENT_KEY, value: updatedContent, updated_by: auth.user.id },
      { onConflict: 'key' },
    );

  if (saveError) {
    return NextResponse.json({ ok: false, error: 'Failed to delete quiz' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deletedQuizId: quizId });
}

const patchBodySchema = z.object({
  quizId: z.string().min(1).optional(),
  quiz: z.record(z.string(), z.unknown()).optional(),
  questions: z.array(z.unknown()).optional(),
});

export async function PATCH(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`admin-quiz-content:${ip}`, 20, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const len = Number(req.headers.get('content-length') ?? '0');
  const MAX_BODY = 262_144;
  if (len > MAX_BODY) {
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

  const parsed = patchBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { quizId, quiz: quizPatch, questions: questionsPatch } = parsed.data;
  if (!quizId && !quizPatch && !questionsPatch) {
    return NextResponse.json({ ok: false, error: 'Nothing to patch' }, { status: 400 });
  }

  const db = adminClient();

  const { data: contentData, error: contentError } = await db
    .from('app_settings')
    .select('value')
    .eq('key', MANAGED_QUIZ_CONTENT_KEY)
    .maybeSingle();

  if (contentError) {
    return NextResponse.json({ ok: false, error: 'Failed to fetch managed quiz content' }, { status: 500 });
  }

  const current = normalizeManagedQuizContent(contentData?.value);
  const targetId = quizId ?? (quizPatch as { id?: string } | undefined)?.id;

  let updatedContent = { ...current };

  if (targetId && quizPatch) {
    const existingIdx = current.quizzes.findIndex((q) => q.id === targetId);
    const merged = normalizeManagedQuizContent({
      quizzes: existingIdx >= 0
        ? current.quizzes.map((q) => (q.id === targetId ? { ...q, ...quizPatch } : q))
        : [...current.quizzes, quizPatch],
      questions: current.questions,
    });
    updatedContent = { ...updatedContent, quizzes: merged.quizzes };
  }

  if (targetId && questionsPatch) {
    const normalized = normalizeManagedQuizContent({
      quizzes: current.quizzes,
      questions: { ...current.questions, [targetId]: questionsPatch },
    });
    updatedContent = { ...updatedContent, questions: normalized.questions };
  }

  const { error: saveError } = await db
    .from('app_settings')
    .upsert(
      { key: MANAGED_QUIZ_CONTENT_KEY, value: updatedContent, updated_by: auth.user.id },
      { onConflict: 'key' },
    );

  if (saveError) {
    return NextResponse.json({ ok: false, error: 'Failed to patch quiz content' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, content: updatedContent });
}

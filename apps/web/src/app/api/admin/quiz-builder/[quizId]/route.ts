/**
 * PATCH  /api/admin/quiz-builder/[quizId]  — update quiz metadata
 * DELETE /api/admin/quiz-builder/[quizId]  — delete a managed quiz (built-ins blocked)
 * Admin-only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimiter';
import { logger } from '@/lib/logger';
import {
  MANAGED_QUIZ_CONTENT_KEY,
  normalizeManagedQuizContent,
} from '@/lib/managedQuizContent';
import { BASE_QUIZ_IDS } from '../route';

const ROUTE = '/api/admin/quiz-builder/[quizId]';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

function anonClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
function serviceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

async function verifyAdmin(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace('Bearer ', '').trim();
  if (!token) return null;
  const { data: { user } } = await anonClient().auth.getUser(token);
  if (!user || !ADMIN_EMAILS.includes((user.email ?? '').toLowerCase())) return null;
  return user;
}

async function fetchManaged() {
  const { data } = await serviceClient()
    .from('app_settings').select('value').eq('key', MANAGED_QUIZ_CONTENT_KEY).maybeSingle();
  return normalizeManagedQuizContent(data?.value);
}

async function saveManaged(content: ReturnType<typeof normalizeManagedQuizContent>, userId: string) {
  const { error } = await serviceClient()
    .from('app_settings')
    .upsert({ key: MANAGED_QUIZ_CONTENT_KEY, value: content, updated_by: userId }, { onConflict: 'key' });
  return error;
}

const PatchSchema = z.object({
  title:        z.string().min(1).max(200).optional(),
  description:  z.string().max(2000).optional(),
  category:     z.string().min(1).max(50).optional(),
  difficulty:   z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  duration:     z.number().int().min(1).max(300).optional(),
  isPremium:    z.boolean().optional(),
  price:        z.number().int().min(0).optional(),
  icon:         z.string().max(10).optional(),
  examCode:     z.string().max(20).optional(),
  certLevel:    z.enum(['foundational', 'associate', 'professional', 'specialty']).optional(),
  enabled:      z.boolean().optional(),
  mode:         z.enum(['quiz_zone', 'true_false', 'exam', 'fun_and_learn', 'guess_the_word', 'audio', 'maths_quiz', 'multi_match']).optional(),
  correctScore: z.number().optional(),
  wrongScore:   z.number().optional(),
});

// ── PATCH: update quiz metadata ───────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> },
) {
  const { quizId } = await params;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`admin-quiz-builder-mut:${ip}`, 10, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }
  const contentLength = Number(req.headers.get('content-length') ?? '0');
  if (contentLength > 8_192) {
    return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
  }

  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const managed = await fetchManaged();
  const existingIdx = managed.quizzes.findIndex((q) => q.id === quizId);

  if (existingIdx === -1 && !BASE_QUIZ_IDS.has(quizId)) {
    return NextResponse.json({ ok: false, error: 'Quiz not found' }, { status: 404 });
  }

  let updatedQuizzes;
  if (existingIdx >= 0) {
    // Update existing managed entry
    updatedQuizzes = managed.quizzes.map((q) =>
      q.id === quizId ? { ...q, ...parsed.data } : q
    );
  } else {
    // Built-in quiz: add a managed override entry with the patch
    const builtIn = { id: quizId, title: quizId, description: '', category: 'general', difficulty: 'beginner' as const, questionCount: 0, duration: 10, isPremium: false, price: 0, icon: '📚', enabled: true, correctScore: 1, wrongScore: 0 };
    updatedQuizzes = [...managed.quizzes, { ...builtIn, ...parsed.data }];
  }

  const updatedContent = { ...managed, quizzes: updatedQuizzes };
  const error = await saveManaged(updatedContent, user.id);
  if (error) {
    logger.error(ROUTE, 'patch_failed', { userId: user.id, quizId, reason: error.message });
    return NextResponse.json({ ok: false, error: 'Failed to update quiz' }, { status: 500 });
  }

  const updatedQuiz = updatedQuizzes.find((q) => q.id === quizId);
  logger.info(ROUTE, 'quiz_updated', { userId: user.id, quizId });
  return NextResponse.json({ ok: true, quiz: { ...updatedQuiz, _source: BASE_QUIZ_IDS.has(quizId) ? 'builtin' : 'managed' } });
}

// ── DELETE: remove a managed quiz ─────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> },
) {
  const { quizId } = await params;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`admin-quiz-builder-mut:${ip}`, 10, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  // Block deletion of built-in quizzes
  if (BASE_QUIZ_IDS.has(quizId)) {
    return NextResponse.json({
      ok: false,
      error: 'Built-in quizzes cannot be deleted. Use the catalog override to disable them.',
    }, { status: 409 });
  }

  const managed = await fetchManaged();
  if (!managed.quizzes.find((q) => q.id === quizId)) {
    return NextResponse.json({ ok: false, error: 'Quiz not found' }, { status: 404 });
  }

  const updatedContent = {
    quizzes: managed.quizzes.filter((q) => q.id !== quizId),
    questions: Object.fromEntries(
      Object.entries(managed.questions).filter(([k]) => k !== quizId)
    ),
  };

  const error = await saveManaged(updatedContent, user.id);
  if (error) {
    logger.error(ROUTE, 'delete_failed', { userId: user.id, quizId, reason: error.message });
    return NextResponse.json({ ok: false, error: 'Failed to delete quiz' }, { status: 500 });
  }

  logger.info(ROUTE, 'quiz_deleted', { userId: user.id, quizId });
  return NextResponse.json({ ok: true, deletedQuizId: quizId });
}

/**
 * GET /api/admin/quiz-builder/[quizId]/questions  — fetch questions for a quiz
 * PUT /api/admin/quiz-builder/[quizId]/questions  — full replace of all questions
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
  buildManagedQuizDataset,
} from '@/lib/managedQuizContent';

const ROUTE = '/api/admin/quiz-builder/[quizId]/questions';

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

const OptionSchema = z.object({
  id:   z.string().min(1).max(20),
  text: z.string().min(1).max(1000),
});

const QuestionSchema = z.object({
  id:              z.string().min(1).max(100).optional(),
  text:            z.string().min(1).max(2000),
  options:         z.array(OptionSchema).min(2).max(6),
  correctOptionId: z.string().min(1).max(20),
  explanation:     z.string().max(2000).default(''),
  difficulty:      z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  hint:            z.string().max(500).optional(),
  category:        z.string().max(50).optional(),
});

const PutQuestionsSchema = z.object({
  questions: z.array(QuestionSchema).max(500),
});

// ── GET: questions for a quiz ─────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> },
) {
  const { quizId } = await params;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`admin-quiz-builder-get:${ip}`, 30, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const managed = await fetchManaged();
  const dataset = buildManagedQuizDataset(managed);
  const questions = dataset.questions[quizId] ?? [];

  return NextResponse.json({ ok: true, quizId, questions, count: questions.length });
}

// ── PUT: full replace of all questions ────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> },
) {
  const { quizId } = await params;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`admin-quiz-builder-mut:${ip}`, 10, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }
  const contentLength = Number(req.headers.get('content-length') ?? '0');
  if (contentLength > 262_144) { // 256 KB
    return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
  }

  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = PutQuestionsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  // Assign IDs and validate correctOptionId references
  const questions = parsed.data.questions.map((q, i) => {
    const optionIds = new Set(q.options.map((o) => o.id));
    const correctOptionId = optionIds.has(q.correctOptionId) ? q.correctOptionId : q.options[0].id;
    return {
      id:              q.id ?? `${quizId}-q${i + 1}`,
      text:            q.text,
      options:         q.options,
      correctOptionId,
      explanation:     q.explanation,
      difficulty:      q.difficulty,
      hint:            q.hint,
      category:        q.category,
      quizId,
    };
  });

  const managed = await fetchManaged();
  const updatedContent = {
    ...managed,
    questions: { ...managed.questions, [quizId]: questions },
    // Also update questionCount on the quiz entry
    quizzes: managed.quizzes.map((q) =>
      q.id === quizId ? { ...q, questionCount: questions.length } : q
    ),
  };

  const { error } = await serviceClient()
    .from('app_settings')
    .upsert({ key: MANAGED_QUIZ_CONTENT_KEY, value: updatedContent, updated_by: user.id }, { onConflict: 'key' });

  if (error) {
    logger.error(ROUTE, 'save_questions_failed', { userId: user.id, quizId, reason: error.message });
    return NextResponse.json({ ok: false, error: 'Failed to save questions' }, { status: 500 });
  }

  logger.info(ROUTE, 'questions_saved', { userId: user.id, quizId, count: questions.length });
  return NextResponse.json({ ok: true, quizId, count: questions.length, questions });
}

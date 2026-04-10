/**
 * GET  /api/admin/quiz-builder  — merged catalog (built-in + managed)
 * POST /api/admin/quiz-builder  — create a new dynamic quiz
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
import { quizzes as BASE_QUIZZES } from '@/data/quizzes';

const ROUTE = '/api/admin/quiz-builder';

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

async function fetchManagedContent() {
  const { data } = await serviceClient()
    .from('app_settings')
    .select('value')
    .eq('key', MANAGED_QUIZ_CONTENT_KEY)
    .maybeSingle();
  return normalizeManagedQuizContent(data?.value);
}

async function saveManagedContent(content: ReturnType<typeof normalizeManagedQuizContent>, userId: string) {
  const { error } = await serviceClient()
    .from('app_settings')
    .upsert({ key: MANAGED_QUIZ_CONTENT_KEY, value: content, updated_by: userId }, { onConflict: 'key' });
  return error;
}

function toSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

function uniqueId(base: string, existingIds: Set<string>): string {
  if (!existingIds.has(base)) return base;
  let n = 2;
  while (existingIds.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

// Base quiz IDs (built-in, from quizzes.ts) — exported for use by products page
export const BASE_QUIZ_IDS = new Set(BASE_QUIZZES.map((q) => q.id));

const CreateQuizSchema = z.object({
  title:         z.string().min(1).max(200),
  description:   z.string().max(2000).default(''),
  category:      z.string().min(1).max(50),
  difficulty:    z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  duration:      z.number().int().min(1).max(300).default(10),
  isPremium:     z.boolean().default(false),
  price:         z.number().int().min(0).default(0),
  icon:          z.string().max(10).default('📚'),
  examCode:      z.string().max(20).optional(),
  certLevel:     z.enum(['foundational', 'associate', 'professional', 'specialty']).optional(),
  mode:          z.enum(['quiz_zone', 'true_false', 'exam', 'fun_and_learn', 'guess_the_word', 'audio', 'maths_quiz', 'multi_match']).optional(),
});

// ── GET: merged effective catalog ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`admin-quiz-builder-get:${ip}`, 30, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const managed = await fetchManagedContent();
  const dataset = buildManagedQuizDataset(managed);

  // Annotate each quiz with its source
  const quizzesAnnotated = dataset.quizzes.map((q) => ({
    ...q,
    _source: BASE_QUIZ_IDS.has(q.id) ? 'builtin' : 'managed',
  }));

  return NextResponse.json({ ok: true, quizzes: quizzesAnnotated, total: quizzesAnnotated.length });
}

// ── POST: create a new dynamic quiz ──────────────────────────────────────────
export async function POST(req: NextRequest) {
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
  const parsed = CreateQuizSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const managed = await fetchManagedContent();
  const allIds = new Set([
    ...BASE_QUIZ_IDS,
    ...managed.quizzes.map((q) => q.id),
  ]);
  const newId = uniqueId(toSlug(parsed.data.title), allIds);

  const newQuiz = {
    id:            newId,
    title:         parsed.data.title,
    description:   parsed.data.description,
    category:      parsed.data.category,
    difficulty:    parsed.data.difficulty,
    duration:      parsed.data.duration,
    isPremium:     parsed.data.isPremium,
    price:         parsed.data.isPremium ? parsed.data.price : 0,
    icon:          parsed.data.icon,
    examCode:      parsed.data.examCode,
    certLevel:     parsed.data.certLevel,
    mode:          parsed.data.mode,
    questionCount: 0,
    enabled:       true,
    correctScore:  1,
    wrongScore:    0,
  };

  const updatedContent = {
    ...managed,
    quizzes: [...managed.quizzes, newQuiz],
    questions: { ...managed.questions, [newId]: [] },
  };

  const error = await saveManagedContent(updatedContent, user.id);
  if (error) {
    logger.error(ROUTE, 'create_failed', { userId: user.id, reason: error.message });
    return NextResponse.json({ ok: false, error: 'Failed to create quiz' }, { status: 500 });
  }

  logger.info(ROUTE, 'quiz_created', { userId: user.id, quizId: newId });
  return NextResponse.json({ ok: true, quiz: { ...newQuiz, _source: 'managed' } }, { status: 201 });
}

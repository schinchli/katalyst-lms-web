/**
 * POST /api/quiz-submit
 *
 * Server-side quiz score validation. Prevents client-side score tampering.
 *
 * Flow:
 * 1. Verify Supabase JWT
 * 2. Load quiz definition + correct answers (server-side only)
 * 3. Validate submission timing (must be > 0s, < quiz duration)
 * 4. Calculate score server-side from submitted answers
 * 5. Write result to Supabase using service role
 * 6. Return verified score to client
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }             from '@supabase/supabase-js';
import { z }                        from 'zod';
import { checkRateLimit }           from '@/lib/rateLimiter';
import { logger }                   from '@/lib/logger';
import { quizQuestions, quizzes }   from '@/data/quizzes';

const ROUTE = '/api/quiz-submit';

const SubmitSchema = z.object({
  quizId:    z.string().min(1).max(100),
  answers:   z.record(z.string(), z.string()),
  startedAt: z.string().datetime({ offset: true }),
});

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  // Rate limit: 20 submissions per minute per IP
  if (!checkRateLimit(`quiz-submit:${ip}`, 20, 60_000)) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json({ ok: false, error: 'Too many requests' }, {
      status: 429, headers: { 'Retry-After': '60' },
    });
  }

  // Verify JWT
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !user) {
    logger.warn(ROUTE, 'invalid_token', { ip });
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Rule 157-158: Reject oversized payloads before parsing
  const contentLength = parseInt(req.headers.get('content-length') ?? '0', 10);
  if (contentLength > 32_768) {
    return NextResponse.json({ ok: false, error: 'Request payload too large' }, { status: 413 });
  }

  // Parse + validate request body
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }
  const { quizId, answers, startedAt } = parsed.data;

  // Validate quiz exists
  const quiz = quizzes.find((q) => q.id === quizId);
  if (!quiz) {
    return NextResponse.json({ ok: false, error: 'Quiz not found' }, { status: 404 });
  }

  // Validate timing — must be between 5 seconds and (quiz.duration + 5) minutes
  const startMs     = new Date(startedAt).getTime();
  const nowMs       = Date.now();
  const elapsedSecs = Math.round((nowMs - startMs) / 1000);
  const maxSecs     = (quiz.duration + 5) * 60;

  if (elapsedSecs < 5) {
    logger.warn(ROUTE, 'suspicious_timing', { ip, userId: user.id, quizId, elapsedSecs });
    return NextResponse.json({ ok: false, error: 'Submission too fast' }, { status: 400 });
  }
  if (elapsedSecs > maxSecs) {
    // Session expired — still accept but cap time at quiz duration
    logger.warn(ROUTE, 'session_expired', { ip, userId: user.id, quizId, elapsedSecs });
  }
  const timeTaken = Math.min(elapsedSecs, quiz.duration * 60);

  // Load questions and calculate score server-side
  const questions = quizQuestions[quizId] ?? [];
  if (questions.length === 0) {
    logger.error(ROUTE, 'no_questions', { ip, userId: user.id, quizId });
    return NextResponse.json({ ok: false, error: 'Quiz data unavailable' }, { status: 500 });
  }

  // Only score questions that are actually in this quiz (ignore extra submitted keys)
  const validQIds  = new Set(questions.map((q) => q.id));
  let   finalScore = 0;
  for (const [qId, chosen] of Object.entries(answers)) {
    if (!validQIds.has(qId)) continue;
    const q = questions.find((q) => q.id === qId);
    if (q && chosen === q.correctOptionId) finalScore++;
  }

  const totalQuestions = questions.length;
  const completedAt    = new Date().toISOString();

  // Write result to Supabase using service role (bypasses RLS)
  const db = adminClient();
  const { error: writeError } = await db.from('quiz_results').upsert(
    {
      user_id:         user.id,
      quiz_id:         quizId,
      score:           finalScore,
      total_questions: totalQuestions,
      time_taken:      timeTaken,
      answers,
      completed_at:    completedAt,
    },
    { onConflict: 'user_id,quiz_id' },
  );

  if (writeError) {
    logger.error(ROUTE, 'write_failed', { ip, userId: user.id, quizId, reason: writeError.message });
    return NextResponse.json({ ok: false, error: 'Failed to save result' }, { status: 500 });
  }

  logger.info(ROUTE, 'submit_ok', { userId: user.id, quizId, score: finalScore, totalQuestions, timeTaken });

  return NextResponse.json({
    ok: true,
    score:          finalScore,
    totalQuestions,
    timeTaken,
    completedAt,
  });
}

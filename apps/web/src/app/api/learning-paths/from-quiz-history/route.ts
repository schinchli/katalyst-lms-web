/**
 * GET /api/learning-paths/from-quiz-history
 * ─────────────────────────────────────────
 * Reads the caller's recent quiz_results (Bearer JWT auth), identifies
 * questions they got wrong, embeds those question texts, and retrieves
 * cross-corpus chunks from knowledge_chunks that most closely match.
 *
 * Returns an ordered "study these next" recommendation list.
 *
 * No new schema needed — joins quiz_results.answers (jsonb) against the
 * in-memory question banks imported from /data/*.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimiter';
import { logger } from '@/lib/logger';
import { embedQuery, semanticSearch, type KbHit } from '@/lib/rag';
import type { Question } from '@/types';
import {
  clf02CloudConceptsQuestions, clf02SecurityQuestions,
  clf02BillingQuestions, clf02TechnologyQuestions,
} from '@/data/clf-c02-questions';
import {
  aipC01RagFoundationsQuestions, aipC01SecurityOpsQuestions, aipC01AdvancedPatternsQuestions,
} from '@/data/aip-c01-questions';
import {
  eksCoreksM01Questions, eksCoreksM02Questions, eksCoreksM03Questions,
  eksCoreksM04Questions, eksCoreksM05Questions, eksCoreksM06Questions,
  eksCoreksM07Questions, eksCoreksM08Questions, eksCoreksM09Questions,
} from '@/data/eks-coreks-questions';

export const runtime = 'nodejs';
export const maxDuration = 30;

const ROUTE = '/api/learning-paths/from-quiz-history';

// ── Build a single questionId → Question lookup map at module load ───────────
const ALL_QUESTIONS: Question[] = [
  ...clf02CloudConceptsQuestions, ...clf02SecurityQuestions,
  ...clf02BillingQuestions,        ...clf02TechnologyQuestions,
  ...aipC01RagFoundationsQuestions, ...aipC01SecurityOpsQuestions,
  ...aipC01AdvancedPatternsQuestions,
  ...eksCoreksM01Questions, ...eksCoreksM02Questions, ...eksCoreksM03Questions,
  ...eksCoreksM04Questions, ...eksCoreksM05Questions, ...eksCoreksM06Questions,
  ...eksCoreksM07Questions, ...eksCoreksM08Questions, ...eksCoreksM09Questions,
];
const QUESTION_MAP = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));

const querySchema = z.object({
  limit:           z.coerce.number().int().min(1).max(20).default(8),
  recentResults:   z.coerce.number().int().min(1).max(50).default(10),
  maxWrong:        z.coerce.number().int().min(1).max(20).default(8),
});

async function verifyUser(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: { user } } = await sb.auth.getUser(token);
  return user;
}

interface QuizResultRow {
  quiz_id:         string;
  score:           number;
  total_questions: number;
  answers:         Record<string, string>;
  completed_at:    string;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!(await checkRateLimit(`lp-history:${ip}`, 30, 60_000))) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const parsed = querySchema.safeParse({
    limit:         sp.get('limit')         ?? undefined,
    recentResults: sp.get('recentResults') ?? undefined,
    maxWrong:      sp.get('maxWrong')      ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }
  const { limit, recentResults, maxWrong } = parsed.data;

  try {
    // 1. Load recent quiz_results for this user (use service role to bypass RLS — read-only)
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!SERVICE_KEY) {
      return NextResponse.json({ ok: false, error: 'Server misconfigured' }, { status: 500 });
    }
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, SERVICE_KEY);
    const { data: results, error } = await sb
      .from('quiz_results')
      .select('quiz_id, score, total_questions, answers, completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(recentResults);
    if (error) {
      logger.error(ROUTE, 'quiz_results_fetch_failed', { userId: user.id, reason: error.message });
      return NextResponse.json({ ok: false, error: 'Failed to load quiz history' }, { status: 500 });
    }

    const rows = (results ?? []) as QuizResultRow[];

    if (rows.length === 0) {
      return NextResponse.json({
        ok: true,
        empty_reason: 'no_history',
        message: "You haven't taken any quizzes yet. Try one to get personalized recommendations.",
        wrong_questions: [],
        recommendations: [],
      });
    }

    // 2. Walk each result's answers to find wrong questions
    const wrongQuestions: Question[] = [];
    const seen = new Set<string>();
    for (const row of rows) {
      const answers = row.answers ?? {};
      for (const [qid, choice] of Object.entries(answers)) {
        if (seen.has(qid)) continue;
        const q = QUESTION_MAP.get(qid);
        if (!q) continue;
        if (q.correctOptionId !== choice) {
          wrongQuestions.push(q);
          seen.add(qid);
          if (wrongQuestions.length >= maxWrong) break;
        }
      }
      if (wrongQuestions.length >= maxWrong) break;
    }

    if (wrongQuestions.length === 0) {
      return NextResponse.json({
        ok: true,
        empty_reason: 'all_correct',
        message: "Nice — you've answered every recent question correctly. Try a harder quiz?",
        wrong_questions: [],
        recommendations: [],
      });
    }

    // 3. Embed each wrong question and aggregate top-k chunks
    const aggregateScores = new Map<string, { hit: KbHit; total: number; count: number }>();
    for (const q of wrongQuestions) {
      const queryText = `${q.text}. Correct: ${q.options.find((o) => o.id === q.correctOptionId)?.text ?? ''}`;
      try {
        const emb = await embedQuery(queryText);
        const hits = await semanticSearch(emb, { matchCount: limit });
        for (const h of hits) {
          const prev = aggregateScores.get(h.id);
          if (prev) {
            prev.total += h.similarity;
            prev.count += 1;
            if (h.similarity > prev.hit.similarity) prev.hit = h;
          } else {
            aggregateScores.set(h.id, { hit: h, total: h.similarity, count: 1 });
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown';
        logger.error(ROUTE, 'embed_failed', { qid: q.id, reason: msg });
        // continue with the rest
      }
    }

    // Rank by (total similarity / count) — average sim weighted lightly by how many
    // wrong-questions retrieved this chunk
    const ranked = [...aggregateScores.values()]
      .map((v) => ({
        ...v.hit,
        score:    v.total / v.count,
        matched:  v.count,
      }))
      .sort((a, b) => (b.matched - a.matched) || (b.score - a.score))
      .slice(0, limit);

    logger.info(ROUTE, 'computed', {
      userId: user.id, wrong: wrongQuestions.length, recs: ranked.length,
    });

    return NextResponse.json({
      ok: true,
      wrong_questions: wrongQuestions.map((q) => ({
        id:        q.id,
        quiz_id:   q.quizId,
        category:  q.category,
        text:      q.text.length > 220 ? q.text.slice(0, 217) + '…' : q.text,
      })),
      recommendations: ranked.map((r) => ({
        id:          r.id,
        corpus:      r.corpus,
        source_type: r.source_type,
        title:       r.title,
        content:     r.content.length > 400 ? r.content.slice(0, 397) + '…' : r.content,
        metadata:    r.metadata,
        similarity:  Math.round(r.score * 1000) / 1000,
        matched:     r.matched,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    logger.error(ROUTE, 'failed', { ip, error: msg });
    return NextResponse.json({ ok: false, error: 'Recommendation failed' }, { status: 500 });
  }
}

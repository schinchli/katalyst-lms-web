/**
 * POST /api/recommendations
 * ─────────────────────────
 * Cross-path RAG recommendation engine. Combines server-side progress
 * (quiz_results · flashcard_progress) with the caller's reading progress
 * (notesRead, sent by the client from localStorage) and RAG semantic search
 * to produce categorised "what to study next" recommendations — each with a
 * reason, a CTA, and official AWS reading links where relevant.
 *
 * Auth: Bearer JWT. Body: { notesRead?: string[] }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimiter';
import {
  buildRecommendations, moduleServices,
  type ProgressContext, type Recommendation,
} from '@/lib/recommendations';
import { flashcardDecks } from '@/data/flashcards';
import { embedQuery, semanticSearch } from '@/lib/rag';
import { getSourcesByTopic } from '@/lib/sources';

export const runtime = 'nodejs';

const bodySchema = z.object({
  notesRead: z.array(z.string().max(64)).max(200).optional().default([]),
});

function anon() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

async function verifyUser(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return { user: null, token: '' };
  const { data: { user } } = await anon().auth.getUser(token);
  return { user, token };
}

// Card counts per deck (to compute flashcard confidence ratio).
const DECK_TOTAL = new Map(flashcardDecks.map((d) => [d.id, d.cardCount ?? d.cards.length]));

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`recommendations:${ip}`, 30, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }
  if (Number(req.headers.get('content-length') ?? '0') > 8_192) {
    return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
  }

  const { user, token } = await verifyUser(req);
  let body: unknown = {};
  try { body = await req.json(); } catch { /* empty body ok */ }
  const parsed = bodySchema.safeParse(body ?? {});
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });

  const notesRead = new Set(parsed.data.notesRead);
  const quizPct = new Map<string, number>();
  const flashConfidence = new Map<string, { known: number; total: number }>();

  // Authed Supabase client (the user's JWT — RLS scopes all reads/writes to them).
  const sb = user
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      })
    : null;

  // Server-side progress (authed users only; guests get path-order recs).
  if (user && sb) {
    const [{ data: quizzes }, { data: flash }] = await Promise.all([
      sb.from('quiz_results').select('quiz_id, score, total_questions').eq('user_id', user.id),
      sb.from('flashcard_progress').select('deck_id, known_ids').eq('user_id', user.id),
    ]);
    for (const q of quizzes ?? []) {
      const pct = q.total_questions ? Math.round((q.score / q.total_questions) * 100) : 0;
      quizPct.set(q.quiz_id, pct);
    }
    for (const f of (flash ?? []) as { deck_id: string; known_ids: string[] }[]) {
      flashConfidence.set(f.deck_id, { known: (f.known_ids ?? []).length, total: DECK_TOTAL.get(f.deck_id) ?? 0 });
    }
  }

  const ctx: ProgressContext = { notesRead, quizPct, flashConfidence };
  const recs: Recommendation[] = buildRecommendations(ctx);

  // ── Determine the active topic for RAG-driven extras ──────────────────────
  const activeModule = recs.find((r) => r.category === 'continue' || r.category === 'review')?.moduleId
    ?? recs.find((r) => r.moduleId)?.moduleId;

  // Hands-on lab — Well-Architected Labs / AWS Workshops for the active service.
  if (activeModule) {
    const svc = moduleServices(activeModule)[0];
    recs.push({
      category: 'lab', title: 'Hands-On: AWS Well-Architected Labs',
      reason: `Apply ${activeModule.startsWith('arch') ? 'architecting' : 'cloud'} concepts in a guided lab${svc ? ` (${svc})` : ''}.`,
      link: 'https://www.wellarchitectedlabs.com/', cta: 'Open lab',
      sourceUrl: 'https://www.wellarchitectedlabs.com/', sourceTitle: 'AWS Well-Architected Labs',
      moduleId: activeModule, score: 35,
    });
  }

  // Related concepts — RAG semantic neighbours across all corpora.
  if (activeModule) {
    try {
      const terms = [...moduleServices(activeModule), activeModule.replace(/-/g, ' ')].join(' ');
      const emb = await embedQuery(terms);
      const hits = await semanticSearch(emb, { matchCount: 6 });
      const seen = new Set<string>();
      for (const h of hits) {
        const url = (h.metadata as Record<string, unknown>)?.source_url as string | undefined;
        const link = url ?? (h.corpus === 'module-notes'
          ? `/dashboard/learning-paths`
          : '/dashboard/recommended');
        const key = h.title ?? link;
        if (seen.has(key) || !h.title) continue;
        seen.add(key);
        recs.push({
          category: 'related', title: h.title.replace(/ \(part \d+\)$/, ''),
          reason: `Related to your current topic · ${h.corpus.replace('-', ' ')}`,
          link, cta: url ? 'Read on AWS' : 'Explore',
          sourceUrl: url, sourceTitle: url ? 'AWS Documentation' : undefined,
          score: Math.round(h.similarity * 30),
        });
        if (seen.size >= 4) break;
      }
    } catch { /* RAG optional — engine recs still returned */ }
  }

  // Extra official reading by active topic if none surfaced.
  if (activeModule && !recs.some((r) => r.category === 'aws_reading')) {
    for (const s of getSourcesByTopic(moduleServices(activeModule), 2)) {
      recs.push({
        category: 'aws_reading', title: s.title, reason: 'Recommended official AWS reading.',
        link: s.url, cta: 'Read on AWS', sourceUrl: s.url, sourceTitle: s.title, score: 38,
      });
    }
  }

  // ── Persist the recommendation snapshot for the signed-in user ────────────
  // Replace the user's stored set with the latest (RLS scopes to auth.uid()).
  let persisted = false;
  if (user && sb && recs.length > 0) {
    try {
      const ITEM_TYPE: Record<string, string> = {
        take_quiz: 'quiz', review: 'quiz', practice_flashcards: 'flashcard',
        aws_reading: 'aws_reading', lab: 'lab', related: 'related',
        continue: 'lesson', study_next: 'lesson', deep_dive: 'lesson',
      };
      const rows = recs.slice(0, 60).map((r) => ({
        user_id: user.id,
        item_type: ITEM_TYPE[r.category] ?? 'lesson',
        item_id: r.moduleId ?? r.link,
        title: r.title,
        reason: r.reason ?? null,
        score: r.score,
        difficulty: r.difficulty ?? null,
        estimated_time: r.estimatedMinutes ?? null,
        source_reference: r.sourceUrl ?? null,
        category: r.category,
      }));
      await sb.from('lms_recommendations').delete().eq('user_id', user.id);
      const { error } = await sb.from('lms_recommendations').insert(rows);
      persisted = !error;
    } catch { persisted = false; }
  }

  return NextResponse.json({
    ok: true,
    authenticated: Boolean(user),
    persisted,
    counts: { quizzesTaken: quizPct.size, decksPracticed: flashConfidence.size, modulesRead: notesRead.size },
    recommendations: recs,
  });
}

/**
 * POST /api/admin/generate-flashcards
 * ──────────────────────────────────
 * Admin tool: turns a topic into N flashcards by retrieving top-k chunks
 * from knowledge_chunks (corpus-filterable), then prompting gpt-4o-mini
 * in JSON mode to write cards grounded in those chunks.
 *
 * Body:
 *   {
 *     topic: string,           // required, 3-500 chars
 *     count?: number,          // default 5, max 20
 *     corpus?: string[],       // restrict retrieval, default = all corpora
 *     retrievalLimit?: number, // top-k chunks fed to the LLM, default 8
 *     save?: boolean,          // if true, persists cards into knowledge_chunks
 *                              //         with corpus='generated-flashcards'
 *   }
 *
 * Auth: Bearer JWT — caller's email must be in ADMIN_EMAILS env.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import OpenAI from 'openai';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimiter';
import { logger } from '@/lib/logger';
import { embedQuery, semanticSearch } from '@/lib/rag';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ROUTE = '/api/admin/generate-flashcards';
const GENERATED_CORPUS = 'generated-flashcards';
const GEN_MODEL = process.env.EKS_RAG_GEN_MODEL?.trim() || 'gpt-4o-mini';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

async function verifyAdmin(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: { user } } = await sb.auth.getUser(token);
  if (!user || !ADMIN_EMAILS.includes((user.email ?? '').toLowerCase())) return null;
  return user;
}

const schema = z.object({
  topic:          z.string().min(3).max(500),
  count:          z.number().int().min(1).max(20).default(5),
  corpus:         z.array(z.string().min(1).max(60)).max(10).optional(),
  retrievalLimit: z.number().int().min(3).max(15).default(8),
  save:           z.boolean().default(false),
});

interface GeneratedCard {
  front:            string;
  back:             string;
  source_chunk_ids: string[];
}

export async function POST(req: NextRequest) {
  if (Number(req.headers.get('content-length') ?? '0') > 4_000) {
    return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
  }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!(await checkRateLimit(`gen-flashcards:${ip}`, 10, 60_000))) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const user = await verifyAdmin(req);
  if (!user) {
    logger.authFail(ROUTE, 'not_admin', { ip });
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  let raw: unknown;
  try { raw = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: 'invalid JSON body' }, { status: 400 }); }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }
  const { topic, count, corpus, retrievalLimit, save } = parsed.data;

  const OPENAI_KEY = process.env.OPENAI_API_KEY?.trim();
  if (!OPENAI_KEY) {
    return NextResponse.json({ ok: false, error: 'OPENAI_API_KEY not configured' }, { status: 500 });
  }

  try {
    // 1. Retrieve top-k grounding chunks
    const emb = await embedQuery(topic);
    const chunks = await semanticSearch(emb, {
      matchCount:   retrievalLimit,
      filterCorpus: corpus && corpus.length ? corpus : null,
    });

    if (!chunks.length) {
      return NextResponse.json({
        ok: true, topic, cards: [], sources: [],
        warning: 'No matching chunks — broaden the topic or remove the corpus filter.',
      });
    }

    // 2. Build context + call LLM in JSON mode
    const context = chunks.map((c, i) => {
      const meta = c.metadata as { module?: string; topic?: string };
      const where = [c.corpus, meta?.module ? `M${meta.module}` : null, c.source_type, meta?.topic]
        .filter(Boolean).join(' · ');
      return `[${i + 1}] ${where}\n${c.content.slice(0, 1000)}`;
    }).join('\n\n---\n\n');

    const openai = new OpenAI({ apiKey: OPENAI_KEY });
    const res = await openai.chat.completions.create({
      model:           GEN_MODEL,
      max_tokens:      2000,
      temperature:     0.4,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a senior instructional designer for LearnKloud. Write EXACTLY ${count} high-quality flashcards on the user's topic, grounded ONLY in the provided course excerpts.

Output JSON shape:
{"cards":[{"front":"...","back":"...","source_indices":[1,3]}, ...]}

Rules:
- "source_indices" must be a 1-based array of excerpt numbers you used.
- "front" is a concise question or prompt (≤200 chars).
- "back" is a precise, complete answer (≤500 chars). Include the WHY when useful.
- Use only facts from the excerpts. Never invent details.
- Spread cards across DIFFERENT concepts — do not paraphrase the same idea.
- If excerpts don't support ${count} unique cards, return fewer.`,
        },
        {
          role: 'user',
          content: `Topic: ${topic}\n\nCourse excerpts:\n\n${context}`,
        },
      ],
    });

    let parsedCards: Array<{ front?: unknown; back?: unknown; source_indices?: unknown }> = [];
    const rawContent = res.choices[0]?.message?.content ?? '{}';
    try {
      const json = JSON.parse(rawContent) as { cards?: unknown };
      parsedCards = Array.isArray(json.cards) ? json.cards as typeof parsedCards : [];
    } catch {
      logger.error(ROUTE, 'json_parse_failed', { snippet: rawContent.slice(0, 200) });
      return NextResponse.json({ ok: false, error: 'LLM returned invalid JSON' }, { status: 500 });
    }

    const cards: GeneratedCard[] = parsedCards
      .slice(0, count)
      .map((c) => {
        const front = typeof c.front === 'string' ? c.front.slice(0, 200) : '';
        const back  = typeof c.back  === 'string' ? c.back.slice(0, 500)  : '';
        const indices = Array.isArray(c.source_indices)
          ? c.source_indices.filter((n): n is number => Number.isInteger(n))
          : [];
        const source_chunk_ids = indices
          .map((i) => chunks[i - 1]?.id)
          .filter((id): id is string => Boolean(id));
        return { front, back, source_chunk_ids };
      })
      .filter((c) => c.front && c.back);

    // 3. Optionally persist
    let saved_count = 0;
    if (save && cards.length > 0) {
      const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
      if (!SERVICE_KEY) {
        return NextResponse.json({ ok: false, error: 'service role not configured', cards }, { status: 500 });
      }
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, SERVICE_KEY);

      const cardTexts = cards.map((c) => `Q: ${c.front}\n\nA: ${c.back}`);
      const cardEmb = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: cardTexts,
      });

      const rows = cards.map((c, i) => {
        const content = cardTexts[i];
        return {
          corpus:       GENERATED_CORPUS,
          source_type:  'flashcard',
          content_hash: createHash('sha256').update(content, 'utf8').digest('hex'),
          title:        c.front,
          content,
          embedding:    cardEmb.data[i].embedding,
          metadata: {
            topic,
            generated_by:        GEN_MODEL,
            generated_for_user:  user.id,
            source_chunk_ids:    c.source_chunk_ids,
          },
        };
      });

      const { error } = await sb
        .from('knowledge_chunks')
        .upsert(rows, { onConflict: 'corpus,content_hash', ignoreDuplicates: true });
      if (error) {
        logger.error(ROUTE, 'save_failed', { reason: error.message });
        return NextResponse.json({ ok: false, error: 'Save failed', cards }, { status: 500 });
      }
      saved_count = rows.length;
    }

    logger.info(ROUTE, 'generated', {
      ip, userId: user.id, topic, generated: cards.length, saved: saved_count,
    });

    return NextResponse.json({
      ok:    true,
      topic,
      cards,
      saved_count,
      sources: chunks.map((c) => ({
        id:          c.id,
        corpus:      c.corpus,
        source_type: c.source_type,
        title:       c.title,
        metadata:    c.metadata,
        similarity:  Math.round(c.similarity * 1000) / 1000,
      })),
      usage: {
        input_tokens:  res.usage?.prompt_tokens     ?? 0,
        output_tokens: res.usage?.completion_tokens ?? 0,
        model:         res.model,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    logger.error(ROUTE, 'failed', { ip, error: msg });
    return NextResponse.json({ ok: false, error: 'Generation failed' }, { status: 500 });
  }
}

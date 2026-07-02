/**
 * ragResources — derive clickable study resources from RAG-retrieved chunks.
 *
 * Given the knowledge chunks that answered a question, surface the most relevant
 * next actions the learner can TAP: their learning path, reading (module notes),
 * a recommended video, a quiz, and a flashcard deck. All items are real,
 * navigable targets pulled from existing data (no invented/hardcoded links).
 */
import { LEARNING_PATHS } from '@/data/learningPaths';
import { PLAYLIST, type VideoItem } from '@/data/videos';
import { embedMany, cosineSimilarity, type KbHit } from './rag';
import { buildResourceCatalog, type CatalogItem } from './resourceCatalog';

export type RagResourceType = 'learning-path' | 'notes' | 'video' | 'quiz' | 'flashcard' | 'article';

export interface RagResource {
  type: RagResourceType;
  /** Resource id used by the client to route (quizId, flashcard category, moduleId, path id, video id, article slug). */
  id: string;
  title: string;
  subtitle?: string;
  /** External URL (videos → YouTube). */
  url?: string;
}

// ── Semantic recommendation engine ────────────────────────────────────────────
// Ranks the full resource catalog by embedding similarity to the question.
// Catalog + embeddings are cached (TTL) so we embed the pool at most once per
// window; when content is added the next refresh picks it up automatically.

interface Cache { ts: number; items: CatalogItem[]; embeddings: number[][] }
let _cache: Cache | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000;
// Same-domain AWS content shares a moderate cosine floor (~0.15–0.25) even when
// off-topic, so 0.15 let noise through (e.g. Storage notes for a Bedrock query).
// 0.28 keeps genuinely-relevant picks and drops filler; a slot may show nothing
// rather than something irrelevant.
const MIN_SCORE = 0.28;

async function getCatalogCache(now: number): Promise<Cache> {
  if (_cache && now - _cache.ts < CACHE_TTL_MS && _cache.items.length) return _cache;
  const items = await buildResourceCatalog();
  const embeddings = await embedMany(items.map((i) => i.text));
  _cache = { ts: now, items, embeddings };
  return _cache;
}

const READING_SUBTITLE: Partial<Record<RagResourceType, string>> = {
  'learning-path': 'Continue your learning path',
  article: 'Blog',
  notes: 'Reading',
  video: 'Recommended video',
  quiz: 'Test yourself',
  flashcard: 'Drill flashcards',
};

/**
 * Semantically rank the resource catalog against the question embedding and
 * return the single best item per slot: learning path, a reading (blog article
 * or module notes — whichever is more relevant), video, quiz, flashcards.
 */
export async function recommendResources(questionEmbedding: number[]): Promise<RagResource[]> {
  if (!questionEmbedding?.length) return [];
  const cache = await getCatalogCache(Date.now());
  if (!cache.items.length || cache.embeddings.length !== cache.items.length) return [];

  const scored = cache.items.map((it, i) => ({ it, score: cosineSimilarity(questionEmbedding, cache.embeddings[i]) }));
  const bestOf = (...types: RagResourceType[]) =>
    scored.filter((s) => types.includes(s.it.rtype)).sort((a, b) => b.score - a.score)[0];

  // Relative floor: same-domain AWS content clears a fixed floor even when
  // off-topic, so a slot must also land within ~40% of the single best match.
  // This drops the "least-bad" filler (e.g. an EKS quiz for a Bedrock question)
  // while keeping genuinely-relevant picks.
  const topScore = scored.reduce((m, s) => Math.max(m, s.score), 0);
  const floor = Math.max(MIN_SCORE, topScore * 0.55);

  const out: RagResource[] = [];
  const add = (s?: { it: CatalogItem; score: number }) => {
    if (s && s.score >= floor) {
      out.push({ type: s.it.rtype as RagResourceType, id: s.it.rid, title: s.it.title, url: s.it.url, subtitle: READING_SUBTITLE[s.it.rtype] });
    }
  };

  add(bestOf('learning-path'));
  add(bestOf('article', 'notes')); // most relevant reading — Sanity blog or module notes
  add(bestOf('video'));
  add(bestOf('quiz'));
  add(bestOf('flashcard'));
  return out;
}

function moduleKey(meta: unknown): string | null {
  const m = (meta as { module?: string | number } | null)?.module;
  if (m == null) return null;
  return String(m).replace(/^m/i, '').padStart(2, '0');
}

/** Best-effort keyword match of a video against the question + corpus. */
function pickVideo(question: string, corpus: string): VideoItem | null {
  if (!PLAYLIST.length) return null;
  const terms = `${question} ${corpus}`.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  let best: { v: VideoItem; score: number } | null = null;
  for (const v of PLAYLIST) {
    const hay = `${v.title} ${v.tag} ${v.description}`.toLowerCase();
    const score = terms.filter((t) => hay.includes(t)).length;
    if (!best || score > best.score) best = { v, score };
  }
  return best && best.score > 0 ? best.v : PLAYLIST[0];
}

export function buildRagResources(chunks: KbHit[], question: string): RagResource[] {
  if (!chunks.length) return [];

  // Primary corpus = most frequent among the top chunks.
  const counts = new Map<string, number>();
  for (const c of chunks) counts.set(c.corpus, (counts.get(c.corpus) ?? 0) + 1);
  const corpus = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const topModule = moduleKey(chunks.find((c) => c.corpus === corpus)?.metadata);

  const path =
    LEARNING_PATHS.find((p) => p.id === corpus) ??
    LEARNING_PATHS.find((p) => corpus.startsWith(p.id) || p.id.startsWith(corpus));
  if (!path) return [];

  // Prefer the step matching the retrieved module; else the first of that type.
  const stepOf = (type: string) => {
    const steps = path.steps.filter((s) => s.type === type);
    const matched = topModule
      ? steps.find((s) => s.resourceId.includes(topModule) || s.id.includes(topModule))
      : undefined;
    return matched ?? steps[0];
  };

  const out: RagResource[] = [
    { type: 'learning-path', id: path.id, title: path.certName, subtitle: 'Continue your learning path' },
  ];

  const notes = stepOf('notes');
  if (notes) out.push({ type: 'notes', id: notes.resourceId, title: notes.title.replace(/^Read:\s*/i, ''), subtitle: 'Reading' });

  // Video: a path video step if present, else a keyword-matched playlist video.
  const videoStep = path.steps.find((s) => s.type === 'video');
  const video = videoStep ? PLAYLIST.find((v) => v.id === videoStep.resourceId) : pickVideo(question, corpus);
  if (video) {
    out.push({ type: 'video', id: video.id, title: video.title, subtitle: 'Recommended video', url: `https://youtu.be/${video.youtubeId}` });
  }

  const quiz = stepOf('quiz');
  if (quiz) out.push({ type: 'quiz', id: quiz.resourceId, title: quiz.title.replace(/^Quiz:\s*/i, ''), subtitle: 'Test yourself' });

  const flash = stepOf('flashcard');
  if (flash) out.push({ type: 'flashcard', id: flash.resourceId, title: flash.title.replace(/^Flashcards?:\s*/i, ''), subtitle: 'Drill flashcards' });

  return out;
}

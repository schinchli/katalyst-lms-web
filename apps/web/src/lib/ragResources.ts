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
import type { KbHit } from './rag';

export type RagResourceType = 'learning-path' | 'notes' | 'video' | 'quiz' | 'flashcard';

export interface RagResource {
  type: RagResourceType;
  /** Resource id used by the client to route (quizId, flashcard category, moduleId, path id, video id). */
  id: string;
  title: string;
  subtitle?: string;
  /** External URL (videos → YouTube). */
  url?: string;
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

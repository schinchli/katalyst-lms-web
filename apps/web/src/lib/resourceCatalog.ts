/**
 * resourceCatalog — the pool of clickable study resources the recommendation
 * engine ranks over. Built from LIVE data sources, so the engine automatically
 * "improves with every addition": add a video / quiz / flashcard deck / article /
 * learning path and it becomes recommendable on the next catalog refresh.
 *
 * Each item carries an embedding `text` (title + description/tags) used for
 * semantic ranking against the learner's question.
 */
import { PLAYLIST } from '@/data/videos';
import { quizzes } from '@/data/quizzes';
import { flashcardDecks } from '@/data/flashcards';
import { LEARNING_PATHS } from '@/data/learningPaths';
import { fetchArticleList } from '@/lib/sanityClient';

export type CatalogType = 'learning-path' | 'notes' | 'video' | 'quiz' | 'flashcard' | 'article';

export interface CatalogItem {
  rtype: CatalogType;
  rid:   string;
  title: string;
  url?:  string;
  /** Text used to embed this item for semantic matching. */
  text:  string;
}

/**
 * Assemble the full candidate catalog. Sanity articles are fetched live (empty
 * if Sanity isn't configured — the rest of the catalog still works).
 */
export async function buildResourceCatalog(): Promise<CatalogItem[]> {
  const items: CatalogItem[] = [];

  for (const v of PLAYLIST) {
    items.push({
      rtype: 'video', rid: v.id, title: v.title,
      url: `https://youtu.be/${v.youtubeId}`,
      text: `${v.title}. ${v.tag}. ${v.description}`,
    });
  }

  for (const q of quizzes) {
    items.push({
      rtype: 'quiz', rid: q.id, title: q.title,
      text: `${q.title}. ${q.category}. ${q.examCode ?? ''} certification quiz`,
    });
  }

  for (const d of flashcardDecks) {
    items.push({
      rtype: 'flashcard', rid: d.id, title: d.title,
      text: `${d.title}. ${d.description}. ${d.category}. flashcards`,
    });
  }

  const seenNotes = new Set<string>();
  for (const p of LEARNING_PATHS) {
    items.push({
      rtype: 'learning-path', rid: p.id, title: p.certName,
      text: `${p.certName}. ${p.certCode}. ${p.tagline}`,
    });
    for (const s of p.steps) {
      if (s.type === 'notes' && !seenNotes.has(s.resourceId)) {
        seenNotes.add(s.resourceId);
        items.push({
          rtype: 'notes', rid: s.resourceId,
          title: s.title.replace(/^Read:\s*/i, ''),
          text: `${s.title}. ${s.subtitle ?? ''}`,
        });
      }
    }
  }

  // Sanity articles → "Blog" cards (in-app reader). Best-effort; never throws.
  try {
    const articles = await fetchArticleList({ limit: 100 });
    for (const a of articles) {
      items.push({
        rtype: 'article', rid: a.slug, title: a.title,
        text: `${a.title}. ${a.excerpt ?? ''} ${a.tag ?? ''} ${a.provider} ${a.category}`,
      });
    }
  } catch { /* Sanity unavailable — skip blogs */ }

  return items;
}

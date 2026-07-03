/**
 * ragResources — the RAG half of the recommendation engine.
 * Pins the MIN_SCORE gate (0.28) and the relative floor (55% of the best
 * match) that keep off-topic same-domain filler out of the resource slots,
 * plus the chunk→resource mapping in buildRagResources.
 */
import type { KbHit } from '@/lib/rag';

// Catalog fixture: one item per slot type, embedding = [item index] so the
// "question embedding" is literally an array of per-item scores.
const CATALOG = [
  { rtype: 'learning-path', rid: 'clf-c02', title: 'Cloud Practitioner', text: 'clf' },
  { rtype: 'notes',         rid: 'm01',     title: 'EC2 Notes',          text: 'notes' },
  { rtype: 'article',       rid: 'blog-1',  title: 'Bedrock Blog',       text: 'article' },
  { rtype: 'video',         rid: 'v1',      title: 'Intro Video',        text: 'video', url: 'https://youtu.be/x' },
  { rtype: 'quiz',          rid: 'q1',      title: 'EC2 Quiz',           text: 'quiz' },
  { rtype: 'flashcard',     rid: 'f1',      title: 'EC2 Cards',          text: 'flash' },
];

jest.mock('@/lib/resourceCatalog', () => ({
  buildResourceCatalog: jest.fn().mockResolvedValue(
    // resolved lazily so CATALOG above is initialised
    [] as unknown[],
  ),
}));
jest.mock('@/lib/rag', () => ({
  embedMany: jest.fn(),
  cosineSimilarity: jest.fn((q: number[], e: number[]) => q[e[0]] ?? 0),
}));

import { recommendResources, buildRagResources } from '@/lib/ragResources';
import { buildResourceCatalog } from '@/lib/resourceCatalog';
import { embedMany } from '@/lib/rag';

beforeAll(() => {
  (buildResourceCatalog as jest.Mock).mockResolvedValue(CATALOG);
  (embedMany as jest.Mock).mockResolvedValue(CATALOG.map((_, i) => [i]));
});

// Scores array indexed by CATALOG position: [path, notes, article, video, quiz, flash]
const scores = (s: number[]) => s;

describe('recommendResources — score gating', () => {
  it('returns every slot when all scores clear the floor', async () => {
    // reading slot = best of article(0.8) vs notes(0.85) → notes
    const out = await recommendResources(scores([0.9, 0.85, 0.8, 0.88, 0.86, 0.9]));
    expect(out.map((r) => r.type)).toEqual(['learning-path', 'notes', 'video', 'quiz', 'flashcard']);
  });

  it('drops items below the absolute MIN_SCORE (0.28)', async () => {
    const out = await recommendResources(scores([0.9, 0.1, 0.1, 0.1, 0.1, 0.1]));
    expect(out.map((r) => r.type)).toEqual(['learning-path']);
  });

  it('relative floor: a slot within MIN_SCORE but far from the best match is dropped', async () => {
    // top = 0.9 → floor = max(0.28, 0.495). Video at 0.3 clears MIN but not the floor.
    const out = await recommendResources(scores([0.9, 0.6, 0.6, 0.3, 0.6, 0.6]));
    expect(out.some((r) => r.type === 'video')).toBe(false);
    expect(out.some((r) => r.type === 'quiz')).toBe(true);
  });

  it('reading slot picks the better of article vs notes', async () => {
    const notesWin = await recommendResources(scores([0.9, 0.8, 0.5, 0.8, 0.8, 0.8]));
    expect(notesWin.find((r) => r.type === 'notes')).toBeTruthy();
    const articleWin = await recommendResources(scores([0.9, 0.5, 0.8, 0.8, 0.8, 0.8]));
    expect(articleWin.find((r) => r.type === 'article')).toBeTruthy();
  });

  it('returns [] for an empty question embedding', async () => {
    expect(await recommendResources([])).toEqual([]);
  });
});

describe('buildRagResources — chunk → tappable resources', () => {
  const hit = (corpus: string, module?: string): KbHit => ({
    id: 'c1', corpus, source_type: 'notes', title: null, content: '…',
    metadata: module ? { module } : {}, similarity: 0.8,
  });

  it('maps a clf-c02 corpus to real path resources (path, notes, quiz, flashcards)', () => {
    const out = buildRagResources([hit('clf-c02', 'm01')], 'what is ec2?');
    const types = out.map((r) => r.type);
    expect(types[0]).toBe('learning-path');
    expect(out[0].id).toBe('clf-c02');
    expect(types).toEqual(expect.arrayContaining(['notes', 'quiz', 'flashcard']));
    // Every id must be a real, navigable resource id (non-empty).
    for (const r of out) expect(r.id).toBeTruthy();
  });

  it('returns [] when the corpus matches no learning path', () => {
    expect(buildRagResources([hit('unknown-corpus')], 'q')).toEqual([]);
  });

  it('returns [] for no chunks', () => {
    expect(buildRagResources([], 'q')).toEqual([]);
  });
});

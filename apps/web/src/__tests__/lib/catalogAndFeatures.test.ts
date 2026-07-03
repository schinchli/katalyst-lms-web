/**
 * quizCatalog (admin override merge layer — the single source of truth for
 * premium flags on web AND mobile) + systemFeatures normalization +
 * deckMetadata SEO helpers.
 */
import { quizzes } from '@/data/quizzes';
import { normalizeQuizCatalogOverrides, applyQuizCatalogOverrides } from '@/lib/quizCatalog';
import { normalizeSystemFeatures, DEFAULT_SYSTEM_FEATURES } from '@/lib/systemFeatures';
import { deckDescription, deckTitle, deckJsonLd } from '@/lib/deckMetadata';
import { flashcardDecks } from '@/data/flashcards';

describe('normalizeQuizCatalogOverrides', () => {
  it('returns {} for non-object input', () => {
    expect(normalizeQuizCatalogOverrides(null)).toEqual({});
    expect(normalizeQuizCatalogOverrides('nope')).toEqual({});
    expect(normalizeQuizCatalogOverrides(42)).toEqual({});
  });

  it('keeps only well-typed fields and drops junk entries', () => {
    const out = normalizeQuizCatalogOverrides({
      'quiz-a': { isPremium: true, price: 199.6, enabled: false, hacker: 'x' },
      'quiz-b': { isPremium: 'yes', price: NaN },
      'quiz-c': 'garbage',
    });
    expect(out['quiz-a']).toEqual({ isPremium: true, price: 200, enabled: false });
    expect(out['quiz-b']).toBeUndefined();
    expect(out['quiz-c']).toBeUndefined();
  });

  it('clamps negative prices to 0', () => {
    const out = normalizeQuizCatalogOverrides({ q: { price: -50 } });
    expect(out.q).toEqual({ price: 0 });
  });
});

describe('applyQuizCatalogOverrides', () => {
  const target = () => quizzes[0];
  const original = { isPremium: quizzes[0].isPremium, price: quizzes[0].price };

  afterEach(() => {
    // restore base flags so other suites see pristine data
    applyQuizCatalogOverrides({});
    expect(target().isPremium).toBe(original.isPremium);
  });

  it('applies premium + price override to the live quiz registry', () => {
    applyQuizCatalogOverrides({ [target().id]: { isPremium: true, price: 299 } });
    expect(target().isPremium).toBe(true);
    expect(target().price).toBe(299);
  });

  it('premium with no price falls back to 149', () => {
    applyQuizCatalogOverrides({ [target().id]: { isPremium: true, price: 0 } });
    expect(target().price).toBe(149);
  });

  it('free quizzes get price 0 regardless of override price', () => {
    applyQuizCatalogOverrides({ [target().id]: { isPremium: false, price: 500 } });
    expect(target().price).toBe(0);
  });

  it('disabled quizzes are marked enabled=false, re-enabled on reset', () => {
    applyQuizCatalogOverrides({ [target().id]: { enabled: false } });
    expect(target().enabled).toBe(false);
    applyQuizCatalogOverrides({});
    expect(target().enabled).toBe(true);
  });
});

describe('normalizeSystemFeatures', () => {
  it('returns defaults for empty/invalid input', () => {
    expect(normalizeSystemFeatures(null)).toEqual(DEFAULT_SYSTEM_FEATURES);
    expect(normalizeSystemFeatures(undefined)).toEqual(DEFAULT_SYSTEM_FEATURES);
  });

  it('merges valid overrides over defaults', () => {
    const out = normalizeSystemFeatures({ maintenanceMode: true, leaderboardEnabled: true });
    expect(out.maintenanceMode).toBe(true);
    expect(out.leaderboardEnabled).toBe(true);
    expect(out.adsEnabled).toBe(DEFAULT_SYSTEM_FEATURES.adsEnabled);
  });
});

describe('deckMetadata SEO helpers', () => {
  const deck = flashcardDecks[0];

  it('meta description is capped at 160 chars', () => {
    expect(deckDescription(deck).length).toBeLessThanOrEqual(160);
  });

  it('title contains deck title + card count', () => {
    const t = deckTitle(deck);
    expect(t).toContain(deck.title);
    expect(t).toContain(String(deck.cardCount));
  });

  it('JSON-LD is valid schema.org Quiz with a real URL', () => {
    const ld = deckJsonLd(deck);
    expect(ld['@type']).toBe('Quiz');
    expect(String(ld.url)).toContain(`/flashcards/${deck.id}`);
    expect(Array.isArray(ld.hasPart)).toBe(true);
  });
});

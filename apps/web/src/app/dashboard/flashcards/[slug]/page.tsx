'use client';
export const dynamic = 'force-dynamic';

/**
 * /dashboard/flashcards/[slug] — authenticated study view for a specific deck.
 *
 * The URL fully identifies which deck you're studying so it can be linked,
 * bookmarked, shared, and survive a page refresh. The deck-list page at
 * /dashboard/flashcards routes here on click; the public teaser at
 * /flashcards/[slug] sends users here via ?next= after login.
 *
 * If the slug doesn't match any deck (typo, deck removed, etc.) we redirect
 * back to /dashboard/flashcards.
 */
import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { flashcardDecks, type FlashcardDeck, type Flashcard } from '@/data/flashcards';
import { supabase } from '@/lib/supabase';
import { FlipCard } from '@/components/FlipCard';

// ── localStorage persistence helpers ─────────────────────────────────────────

function loadKnownIds(deckId: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(`flashcards-known-${deckId}`);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveKnownIds(deckId: string, known: Set<string>) {
  try {
    if (known.size === 0) {
      localStorage.removeItem(`flashcards-known-${deckId}`);
    } else {
      localStorage.setItem(`flashcards-known-${deckId}`, JSON.stringify([...known]));
    }
  } catch {
    // storage full or unavailable — silently skip
  }
}

// ── DB sync helpers (fire-and-forget) ────────────────────────────────────────

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function dbSyncProgress(deckId: string, known: Set<string>) {
  getToken().then((token) => {
    if (!token) return;
    fetch('/api/flashcard-progress', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ deckId, knownIds: [...known] }),
    }).catch(() => { /* best-effort */ });
  });
}

async function fetchDbProgress(deckId: string): Promise<Set<string> | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    const res = await fetch(`/api/flashcard-progress?deckId=${encodeURIComponent(deckId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json = await res.json() as { ok: boolean; knownIds: string[] };
    return json.ok ? new Set(json.knownIds) : null;
  } catch { return null; }
}

// ── Study mode view ───────────────────────────────────────────────────────────

function StudyView({
  deck,
  onBack,
}: {
  deck: FlashcardDeck;
  onBack: () => void;
}) {
  const [known, setKnown] = useState<Set<string>>(() => loadKnownIds(deck.id));
  const [queue, setQueue] = useState<Flashcard[]>(() => {
    const persistedKnown = loadKnownIds(deck.id);
    return deck.cards.filter((c) => !persistedKnown.has(c.id));
  });
  const [index, setIndex]       = useState(0);
  const [flipped, setFlipped]   = useState(false);
  const [skipped, setSkipped]   = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(() => {
    const persistedKnown = loadKnownIds(deck.id);
    return deck.cards.every((c) => persistedKnown.has(c.id));
  });
  const [reviewRound, setReviewRound] = useState(1);

  // Hydrate known IDs from DB on mount — DB wins over localStorage if it has data.
  useEffect(() => {
    fetchDbProgress(deck.id).then((dbKnown) => {
      if (!dbKnown || dbKnown.size === 0) return;
      setKnown(dbKnown);
      saveKnownIds(deck.id, dbKnown);
      const remaining = deck.cards.filter((c) => !dbKnown.has(c.id));
      setQueue(remaining);
      setFinished(remaining.length === 0);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck.id]);

  const card  = queue[index];
  const total = queue.length;

  const advance = useCallback((nextIndex: number, nextQueue: Flashcard[]) => {
    setFlipped(false);
    setTimeout(() => {
      if (nextIndex >= nextQueue.length) setFinished(true);
      else { setIndex(nextIndex); setQueue(nextQueue); }
    }, 150);
  }, []);

  const next      = useCallback(() => advance(index + 1, queue), [advance, index, queue]);
  const prev      = useCallback(() => {
    if (index === 0) return;
    setFlipped(false);
    setTimeout(() => setIndex((i) => i - 1), 150);
  }, [index]);

  const markKnown = useCallback(() => {
    const updated = new Set([...known, card.id]);
    setKnown(updated);
    saveKnownIds(deck.id, updated);
    dbSyncProgress(deck.id, updated);
    setSkipped((s) => { const n = new Set(s); n.delete(card.id); return n; });
    advance(index + 1, queue);
  }, [known, card, deck.id, advance, index, queue]);

  const markSkip = useCallback(() => {
    setSkipped((s) => new Set([...s, card.id]));
    setKnown((k) => {
      const updated = new Set(k);
      updated.delete(card.id);
      saveKnownIds(deck.id, updated);
      return updated;
    });
    advance(index + 1, queue);
  }, [card, deck.id, advance, index, queue]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped((f) => !f); }
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'k' || e.key === 'K') markKnown();
      if (e.key === 's' || e.key === 'S') markSkip();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, markKnown, markSkip]);

  const startReviewRound = useCallback(() => {
    const reviewCards = deck.cards.filter((c) => skipped.has(c.id));
    setQueue(reviewCards);
    setIndex(0);
    setFlipped(false);
    setFinished(false);
    setReviewRound((r) => r + 1);
  }, [deck.cards, skipped]);

  // "Restart deck" keeps mastered cards excluded — only resets the review queue.
  // Cards already marked "Knew it" are not shown again (user already knows them).
  const resetAll = useCallback(() => {
    const remaining = deck.cards.filter((c) => !known.has(c.id));
    setSkipped(new Set());
    setQueue(remaining);
    setIndex(0);
    setFlipped(false);
    setFinished(remaining.length === 0);
    setReviewRound(1);
  }, [deck, known]);

  const unmarkKnown = useCallback((cardId: string) => {
    setKnown((k) => {
      const updated = new Set(k);
      updated.delete(cardId);
      saveKnownIds(deck.id, updated);
      dbSyncProgress(deck.id, updated);
      return updated;
    });
    setSkipped((s) => new Set([...s, cardId]));
  }, [deck.id]);

  // ── Finish screen ───────────────────────────────────────────────────────────

  if (finished) {
    const knownCards  = deck.cards.filter((c) => known.has(c.id));
    const reviewCards = deck.cards.filter((c) => skipped.has(c.id));
    const hasReview   = reviewCards.length > 0;

    return (
      <div className="page-content">
        <div style={{ maxWidth: 660, margin: '0 auto' }}>

          {/* Back link */}
          <button onClick={onBack} className="btn-ghost" style={{ fontSize: 13, padding: '6px 16px', marginBottom: 24 }}>
            ← All Decks
          </button>

          {/* Result card */}
          <div className="vx-card" style={{ textAlign: 'center', padding: '36px 24px 28px', marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{hasReview ? '📋' : '🎉'}</div>
            <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
              {hasReview ? `Round ${reviewRound} Complete` : 'All Cards Mastered!'}
            </h2>
            <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: 14 }}>{deck.title}</p>

            {/* Stat row */}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 24 }}>
              <div className="dash-stat-card" style={{ flex: 1, maxWidth: 160, justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--success)' }}>{known.size}</div>
                <span className="vx-badge vx-badge-success">Knew it</span>
              </div>
              <div className="dash-stat-card" style={{ flex: 1, maxWidth: 160, justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--warning)' }}>{skipped.size}</div>
                <span className="vx-badge vx-badge-warning">Need review</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {hasReview && (
                <button onClick={startReviewRound} className="btn-primary" style={{ fontSize: 14 }}>
                  ↻ Review {reviewCards.length} card{reviewCards.length !== 1 ? 's' : ''}
                </button>
              )}
              <button onClick={resetAll} className="btn-secondary" style={{ fontSize: 14 }}>
                Restart deck
              </button>
            </div>
          </div>

          {/* Need review list */}
          {hasReview && (
            <div className="vx-card" style={{ marginBottom: 16 }}>
              <div className="vx-card-header">
                <h5 className="vx-card-title">Need review ({reviewCards.length})</h5>
              </div>
              <div className="vx-list">
                {reviewCards.map((c) => (
                  <div key={c.id} className="vx-list-item" style={{ cursor: 'default' }}>
                    <div className="dash-stat-icon" style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(255,159,67,0.15)', color: 'var(--warning)' }}>
                      ↻
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="vx-list-title">{c.front}</div>
                      <div className="vx-list-sub">{c.back}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Knew it list */}
          {knownCards.length > 0 && (
            <div className="vx-card" style={{ marginBottom: 24 }}>
              <div className="vx-card-header">
                <h5 className="vx-card-title">Knew it ({knownCards.length})</h5>
              </div>
              <div className="vx-list">
                {knownCards.map((c) => (
                  <div key={c.id} className="vx-list-item" style={{ cursor: 'default' }}>
                    <div className="dash-stat-icon" style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(40,199,111,0.15)', color: 'var(--success)' }}>
                      ✓
                    </div>
                    <span className="vx-list-title" style={{ flex: 1 }}>{c.front}</span>
                    <button
                      onClick={() => unmarkKnown(c.id)}
                      title="Move back to review"
                      className="btn-ghost"
                      style={{ fontSize: 11, padding: '3px 10px', marginLeft: 8 }}
                    >
                      undo
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Study card view ─────────────────────────────────────────────────────────

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} className="btn-ghost" style={{ fontSize: 13, padding: '6px 14px' }}>
          ← Decks
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{deck.title}</h1>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
            {reviewRound > 1 ? `Review round ${reviewRound} · ` : ''}Card {index + 1} of {total} · {known.size} known
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="course-progress-bar" style={{ marginBottom: 28 }}>
        <div
          className="course-progress-fill"
          style={{ width: `${((index + 1) / total) * 100}%`, background: deck.color }}
        />
      </div>

      {/* Flip card */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <FlipCard card={card} isFlipped={flipped} onFlip={() => setFlipped((f) => !f)} />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={prev}
          disabled={index === 0}
          className="btn-secondary"
          style={{ fontSize: 13, padding: '9px 18px', opacity: index === 0 ? 0.4 : 1 }}
        >
          ← Prev
        </button>

        <button
          onClick={() => setFlipped((f) => !f)}
          className="btn-primary"
          style={{ fontSize: 13, padding: '9px 22px' }}
        >
          {flipped ? 'Hide Answer' : 'Show Answer'}
        </button>

        <button
          onClick={markKnown}
          className="btn-ghost"
          style={{ fontSize: 13, padding: '9px 18px', borderColor: 'var(--success)', color: 'var(--success)' }}
        >
          ✓ Knew it
        </button>

        <button
          onClick={markSkip}
          className="btn-ghost"
          style={{ fontSize: 13, padding: '9px 18px', borderColor: 'var(--warning)', color: 'var(--warning)' }}
        >
          ↻ Review later
        </button>

        <button onClick={next} className="btn-secondary" style={{ fontSize: 13, padding: '9px 18px' }}>
          Next →
        </button>
      </div>

      {/* Keyboard hint */}
      <p style={{ textAlign: 'center', marginTop: 18, fontSize: 11, color: 'var(--text-secondary)' }}>
        Keyboard:&nbsp;
        <kbd style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '1px 5px', borderRadius: 3 }}>Space</kbd> flip ·&nbsp;
        <kbd style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '1px 5px', borderRadius: 3 }}>←→</kbd> navigate ·&nbsp;
        <kbd style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '1px 5px', borderRadius: 3 }}>K</kbd> knew it ·&nbsp;
        <kbd style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '1px 5px', borderRadius: 3 }}>S</kbd> skip
      </p>
    </div>
  );
}

// ── Route page — looks up deck by slug, renders StudyView ───────────────────

export default function FlashcardStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router   = useRouter();
  const deck     = flashcardDecks.find((d) => d.id === slug);

  useEffect(() => {
    if (!deck) router.replace('/dashboard/flashcards');
  }, [deck, router]);

  if (!deck) return null;

  return <StudyView deck={deck} onBack={() => router.push('/dashboard/flashcards')} />;
}


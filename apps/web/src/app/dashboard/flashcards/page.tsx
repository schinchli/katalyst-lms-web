'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { flashcardDecks, type FlashcardDeck, type Flashcard } from '@/data/flashcards';

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

// ── Deck selection view ───────────────────────────────────────────────────────

function DeckGrid({ onSelect }: { onSelect: (deck: FlashcardDeck) => void }) {
  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Flashcards</h1>
          <p className="page-subtitle">Reinforce key concepts with spaced repetition</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {flashcardDecks.map((deck) => (
          <button
            key={deck.id}
            onClick={() => onSelect(deck)}
            className="quiz-card"
            style={{ textAlign: 'left', width: '100%', fontFamily: 'inherit', border: 'none', padding: 0 }}
          >
            <div className="card-body">
              {/* Icon row + category badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                  background: `${deck.color}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {deck.icon}
                </div>
                <span className="card-cat" style={{ background: `${deck.color}20`, color: deck.color, margin: 0 }}>
                  {deck.category}
                </span>
              </div>

              <div className="card-title">{deck.title}</div>
              <div className="card-desc">{deck.description}</div>

              <hr className="card-divider" />

              <div className="card-footer">
                <span className="card-meta">{deck.cardCount} cards</span>
                <button className="btn-start" style={{ background: deck.color }}>
                  Study now →
                </button>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Individual card flip component ───────────────────────────────────────────

function FlipCard({
  card,
  isFlipped,
  onFlip,
}: {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
}) {
  return (
    <div
      onClick={onFlip}
      style={{
        width: '100%',
        maxWidth: 600,
        height: 300,
        cursor: 'pointer',
        perspective: '1000px',
        userSelect: 'none',
      }}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>
        {/* Front */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          background: 'var(--surface)',
          border: '2px solid var(--primary)',
          borderRadius: 'var(--radius)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 32,
          boxShadow: 'var(--shadow)',
        }}>
          <span className="vx-badge vx-badge-primary" style={{ marginBottom: 16, letterSpacing: 1 }}>
            CONCEPT
          </span>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', textAlign: 'center', lineHeight: 1.3 }}>
            {card.front}
          </div>
          <p style={{ position: 'absolute', bottom: 16, margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
            Click to reveal answer
          </p>
        </div>

        {/* Back */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: 'var(--surface)',
          border: '2px solid var(--success)',
          borderRadius: 'var(--radius)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '32px 36px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow)',
        }}>
          <span className="vx-badge vx-badge-success" style={{ marginBottom: 16, letterSpacing: 1 }}>
            ANSWER
          </span>
          <div style={{
            fontSize: 15, color: 'var(--text)', textAlign: 'center', lineHeight: 1.6,
            overflowY: 'auto', maxHeight: 200, whiteSpace: 'pre-line',
          }}>
            {card.back}
          </div>
          <p style={{ position: 'absolute', bottom: 16, margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
            Click to flip back
          </p>
        </div>
      </div>
    </div>
  );
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

// ── Root page ─────────────────────────────────────────────────────────────────

export default function FlashcardsPage() {
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);

  // Scroll to top whenever the view switches (deck grid ↔ study view)
  useEffect(() => {
    document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'instant' });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeDeck]);

  if (activeDeck) {
    return <StudyView deck={activeDeck} onBack={() => setActiveDeck(null)} />;
  }

  return <DeckGrid onSelect={setActiveDeck} />;
}

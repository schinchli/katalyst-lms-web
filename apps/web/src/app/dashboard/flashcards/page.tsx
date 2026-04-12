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

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 20,
      }}>
        {flashcardDecks.map((deck) => (
          <button
            key={deck.id}
            onClick={() => onSelect(deck)}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 24,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'transform 0.15s, box-shadow 0.15s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            {/* Icon + category */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: `${deck.color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
              }}>
                {deck.icon}
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: 0.6, color: deck.color,
              }}>
                {deck.category}
              </span>
            </div>

            {/* Title */}
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>
              {deck.title}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.4 }}>
              {deck.description}
            </div>

            {/* Card count + CTA */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {deck.cardCount} cards
              </span>
              <span style={{
                fontSize: 12, fontWeight: 700, color: deck.color,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                Study now →
              </span>
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
          borderRadius: 16,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 32,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--primary)', marginBottom: 16 }}>
            CONCEPT
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', textAlign: 'center', lineHeight: 1.3 }}>
            {card.front}
          </div>
          <div style={{ position: 'absolute', bottom: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
            Click to reveal answer
          </div>
        </div>

        {/* Back */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: 'var(--surface)',
          border: '2px solid var(--success, #28C76F)',
          borderRadius: 16,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '32px 36px',
          overflow: 'hidden',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--success, #28C76F)', marginBottom: 16 }}>
            ANSWER
          </div>
          <div style={{
            fontSize: 15, color: 'var(--text)', textAlign: 'center', lineHeight: 1.6,
            overflowY: 'auto', maxHeight: 200, whiteSpace: 'pre-line',
          }}>
            {card.back}
          </div>
          <div style={{ position: 'absolute', bottom: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
            Click to flip back
          </div>
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
  // Load persisted known IDs once — exclude those from the initial queue
  const [known, setKnown] = useState<Set<string>>(() => loadKnownIds(deck.id));
  const [queue, setQueue] = useState<Flashcard[]>(() => {
    const persistedKnown = loadKnownIds(deck.id);
    return deck.cards.filter((c) => !persistedKnown.has(c.id));
  });
  const [index, setIndex]         = useState(0);
  const [flipped, setFlipped]     = useState(false);
  const [skipped, setSkipped]     = useState<Set<string>>(new Set());
  // If every card is already known, start on the finish screen
  const [finished, setFinished]   = useState(() => {
    const persistedKnown = loadKnownIds(deck.id);
    return deck.cards.every((c) => persistedKnown.has(c.id));
  });
  const [reviewRound, setReviewRound] = useState(1);

  const card  = queue[index];
  const total = queue.length;

  const advance = useCallback((nextIndex: number, nextQueue: Flashcard[]) => {
    setFlipped(false);
    setTimeout(() => {
      if (nextIndex >= nextQueue.length) {
        setFinished(true);
      } else {
        setIndex(nextIndex);
        setQueue(nextQueue);
      }
    }, 150);
  }, []);

  const next = useCallback(() => {
    advance(index + 1, queue);
  }, [advance, index, queue]);

  const prev = useCallback(() => {
    if (index === 0) return;
    setFlipped(false);
    setTimeout(() => setIndex((i) => i - 1), 150);
  }, [index]);

  const markKnown = useCallback(() => {
    const updated = new Set([...known, card.id]);
    setKnown(updated);
    saveKnownIds(deck.id, updated);
    // remove from skipped if it was there
    setSkipped((s) => { const n = new Set(s); n.delete(card.id); return n; });
    advance(index + 1, queue);
  }, [known, card, deck.id, advance, index, queue]);

  const markSkip = useCallback(() => {
    setSkipped((s) => new Set([...s, card.id]));
    // remove from known if it was there
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

  const resetAll = useCallback(() => {
    const cleared: Set<string> = new Set();
    saveKnownIds(deck.id, cleared);
    setKnown(cleared);
    setSkipped(new Set());
    setQueue([...deck.cards]);
    setIndex(0);
    setFlipped(false);
    setFinished(false);
    setReviewRound(1);
  }, [deck]);

  // Called from the finish screen — moves a card out of "known" into "needs review"
  const unmarkKnown = useCallback((cardId: string) => {
    setKnown((k) => {
      const updated = new Set(k);
      updated.delete(cardId);
      saveKnownIds(deck.id, updated);
      return updated;
    });
    setSkipped((s) => new Set([...s, cardId]));
  }, [deck.id]);

  if (finished) {
    const knownCards  = deck.cards.filter((c) => known.has(c.id));
    const reviewCards = deck.cards.filter((c) => skipped.has(c.id));
    const hasReview   = reviewCards.length > 0;

    return (
      <div className="page-content">
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          {/* Hero */}
          <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
            <div style={{ fontSize: 52 }}>{hasReview ? '📋' : '🎉'}</div>
            <h2 style={{ margin: '12px 0 6px', fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>
              {hasReview ? `Round ${reviewRound} Complete` : 'All Cards Mastered!'}
            </h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
              {deck.title}
            </p>
          </div>

          {/* Score row */}
          <div style={{
            display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 28,
          }}>
            <div style={{
              flex: 1, maxWidth: 160, textAlign: 'center', padding: '16px 12px',
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
            }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--success, #28C76F)' }}>{known.size}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Knew it</div>
            </div>
            <div style={{
              flex: 1, maxWidth: 160, textAlign: 'center', padding: '16px 12px',
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
            }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--warning, #FF9F43)' }}>{skipped.size}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Need review</div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
            {hasReview && (
              <button onClick={startReviewRound} className="btn-primary" style={{ padding: '10px 22px', fontSize: 14 }}>
                ↻ Review {reviewCards.length} card{reviewCards.length !== 1 ? 's' : ''}
              </button>
            )}
            <button
              onClick={resetAll}
              style={{
                padding: '10px 22px', borderRadius: 8, fontWeight: 600, fontSize: 14,
                border: '1.5px solid var(--border)', background: 'transparent',
                color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Restart deck
            </button>
            <button
              onClick={onBack}
              style={{
                padding: '10px 22px', borderRadius: 8, fontWeight: 600, fontSize: 14,
                border: '1.5px solid var(--border)', background: 'transparent',
                color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              All Decks
            </button>
          </div>

          {/* "Need review" card list */}
          {hasReview && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--warning, #FF9F43)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Need review ({reviewCards.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {reviewCards.map((c) => (
                  <div key={c.id} style={{
                    background: 'var(--surface)', border: '1px solid var(--warning, #FF9F43)',
                    borderRadius: 10, padding: '12px 16px',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{c.front}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.back}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* "Knew it" card list */}
          {knownCards.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--success, #28C76F)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Knew it ({knownCards.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {knownCards.map((c) => (
                  <div key={c.id} style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '10px 16px',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <span style={{ color: 'var(--success, #28C76F)', fontSize: 14, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 13, color: 'var(--text)', flex: 1 }}>{c.front}</span>
                    <button
                      onClick={() => unmarkKnown(c.id)}
                      title="Move back to review"
                      style={{
                        flexShrink: 0, padding: '3px 10px', borderRadius: 6,
                        fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        border: '1px solid var(--border)', background: 'transparent',
                        color: 'var(--text-secondary)', fontFamily: 'inherit',
                      }}
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

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button
          onClick={onBack}
          style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            border: '1.5px solid var(--border)', background: 'transparent',
            color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
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
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 32, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${((index + 1) / total) * 100}%`,
          background: deck.color,
          borderRadius: 2,
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Card */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <FlipCard card={card} isFlipped={flipped} onFlip={() => setFlipped((f) => !f)} />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={prev}
          disabled={index === 0}
          style={{
            padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            border: '1.5px solid var(--border)', background: 'transparent',
            color: index === 0 ? 'var(--text-secondary)' : 'var(--text)',
            opacity: index === 0 ? 0.4 : 1,
            cursor: index === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          }}
        >
          ← Prev
        </button>

        <button
          onClick={() => setFlipped((f) => !f)}
          className="btn-primary"
          style={{ padding: '9px 24px', fontSize: 13 }}
        >
          {flipped ? 'Hide Answer' : 'Show Answer'}
        </button>

        <button
          onClick={markKnown}
          style={{
            padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            border: '1.5px solid var(--success, #28C76F)', background: 'transparent',
            color: 'var(--success, #28C76F)', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          ✓ Knew it
        </button>

        <button
          onClick={markSkip}
          style={{
            padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            border: '1.5px solid var(--warning, #FF9F43)', background: 'transparent',
            color: 'var(--warning, #FF9F43)', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          ↻ Review later
        </button>

        <button
          onClick={next}
          style={{
            padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            border: '1.5px solid var(--border)', background: 'transparent',
            color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Next →
        </button>
      </div>

      {/* Keyboard hint */}
      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--text-secondary)' }}>
        Keyboard: <kbd style={{ background: 'var(--border)', padding: '1px 5px', borderRadius: 3 }}>Space</kbd> flip ·
        <kbd style={{ background: 'var(--border)', padding: '1px 5px', borderRadius: 3, margin: '0 2px' }}>←→</kbd> navigate ·
        <kbd style={{ background: 'var(--border)', padding: '1px 5px', borderRadius: 3, margin: '0 2px' }}>K</kbd> knew it ·
        <kbd style={{ background: 'var(--border)', padding: '1px 5px', borderRadius: 3 }}>S</kbd> skip
      </div>
    </div>
  );
}

// ── Root page ─────────────────────────────────────────────────────────────────

export default function FlashcardsPage() {
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);

  if (activeDeck) {
    return <StudyView deck={activeDeck} onBack={() => setActiveDeck(null)} />;
  }

  return <DeckGrid onSelect={setActiveDeck} />;
}

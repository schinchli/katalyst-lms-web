'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { flashcardDecks, type FlashcardDeck, type Flashcard } from '@/data/flashcards';

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
  const [index, setIndex]       = useState(0);
  const [flipped, setFlipped]   = useState(false);
  const [known, setKnown]       = useState<Set<string>>(new Set());
  const [skipped, setSkipped]   = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);

  const card = deck.cards[index];
  const total = deck.cards.length;

  const next = useCallback(() => {
    setFlipped(false);
    setTimeout(() => {
      if (index + 1 >= total) setFinished(true);
      else setIndex((i) => i + 1);
    }, 150);
  }, [index, total]);

  const prev = useCallback(() => {
    if (index === 0) return;
    setFlipped(false);
    setTimeout(() => setIndex((i) => i - 1), 150);
  }, [index]);

  const markKnown = useCallback(() => {
    setKnown((k) => new Set([...k, card.id]));
    next();
  }, [card, next]);

  const markSkip = useCallback(() => {
    setSkipped((s) => new Set([...s, card.id]));
    next();
  }, [card, next]);

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

  if (finished) {
    return (
      <div className="page-content">
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: 400, gap: 20, textAlign: 'center',
        }}>
          <div style={{ fontSize: 56 }}>🎉</div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Deck Complete!</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 15 }}>
            You reviewed all {total} cards in <strong style={{ color: 'var(--text)' }}>{deck.title}</strong>
          </p>
          <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--success, #28C76F)' }}>{known.size}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Knew it</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--warning, #FF9F43)' }}>{skipped.size}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Need review</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              onClick={() => { setIndex(0); setFlipped(false); setKnown(new Set()); setSkipped(new Set()); setFinished(false); }}
              className="btn-primary"
              style={{ padding: '10px 24px' }}
            >
              Study Again
            </button>
            <button
              onClick={onBack}
              style={{
                padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14,
                border: '1.5px solid var(--border)', background: 'transparent',
                color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              All Decks
            </button>
          </div>
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
            Card {index + 1} of {total} · {known.size} known
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

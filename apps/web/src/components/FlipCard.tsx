'use client';
/**
 * FlipCard — the 600×300 flippable study card used by both the
 * authenticated /dashboard/flashcards screen and the public
 * /flashcards/[slug] teaser. Kept in one place so the two surfaces
 * stay visually identical.
 */
import type { Flashcard } from '@/data/flashcards';

interface FlipCardProps {
  card:      Flashcard;
  isFlipped: boolean;
  onFlip:    () => void;
}

export function FlipCard({ card, isFlipped, onFlip }: FlipCardProps) {
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
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front */}
        <div
          style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden',
            background: 'var(--surface)',
            border: '2px solid var(--primary)',
            borderRadius: 'var(--radius)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 32,
            boxShadow: 'var(--shadow)',
          }}
        >
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
        <div
          style={{
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
          }}
        >
          <span className="vx-badge vx-badge-success" style={{ marginBottom: 16, letterSpacing: 1 }}>
            ANSWER
          </span>
          <div
            style={{
              fontSize: 15, color: 'var(--text)', textAlign: 'center', lineHeight: 1.6,
              overflowY: 'auto', maxHeight: 200, whiteSpace: 'pre-line',
            }}
          >
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

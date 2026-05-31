'use client';
/**
 * TeaserCard — client component that renders one flashcard with a flip
 * animation. Used on public /flashcards/[slug] pages so unauthenticated
 * visitors can experience the format before being asked to sign in.
 */
import { useState } from 'react';

export function TeaserCard({ front, back, color }: { front: string; back: string; color: string }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setFlipped((v) => !v)}
      aria-label={flipped ? 'Show question' : 'Show answer'}
      style={{
        width: '100%',
        minHeight: 200,
        padding: '28px 28px',
        borderRadius: 14,
        background: 'var(--surface)',
        border: `2px solid ${color}33`,
        boxShadow: `0 4px 24px ${color}22`,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        position: 'relative',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color,
          marginBottom: 12,
        }}
      >
        {flipped ? 'Answer' : 'Question'} · tap to flip
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: flipped ? 500 : 700,
          color: 'var(--text)',
          lineHeight: 1.55,
          whiteSpace: 'pre-wrap',
        }}
      >
        {flipped ? back : front}
      </div>
    </button>
  );
}

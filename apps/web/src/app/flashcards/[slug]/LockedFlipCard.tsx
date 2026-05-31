'use client';
/**
 * LockedFlipCard — wraps the shared FlipCard with local flip state.
 * Used on the public /flashcards/[slug] teaser page so the first card
 * is fully flippable without auth, while cards 2…N are gated by the
 * login wall directly below it.
 */
import { useState } from 'react';
import type { Flashcard } from '@/data/flashcards';
import { FlipCard } from '@/components/FlipCard';

export function LockedFlipCard({ card }: { card: Flashcard }) {
  const [flipped, setFlipped] = useState(false);
  return <FlipCard card={card} isFlipped={flipped} onFlip={() => setFlipped((f) => !f)} />;
}

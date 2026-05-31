/**
 * deckMetadata.ts — shared SEO/metadata helpers for the public
 * /flashcards/* routes.
 */
import type { FlashcardDeck } from '@/data/flashcards';

export const PUBLIC_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://learnkloud.today';

/** Build a sentence-form description for a deck, capped at 160 chars for meta description. */
export function deckDescription(deck: FlashcardDeck): string {
  const base = `${deck.cardCount} free flashcards on ${deck.title}. ${deck.description}`;
  return base.length > 160 ? base.slice(0, 157) + '…' : base;
}

/** Build a deck page title, capped at ~60 chars for Google rich-snippet display. */
export function deckTitle(deck: FlashcardDeck): string {
  return `${deck.title} — ${deck.cardCount} flashcards | LearnKloud`;
}

/** Pick an Open Graph image — defaults to brand image until per-deck OG is generated. */
export function deckOgImage(): string {
  return `${PUBLIC_BASE_URL}/og-default.png`;
}

/** schema.org structured data for a flashcard deck (Quiz / LearningResource). */
export function deckJsonLd(deck: FlashcardDeck): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: deck.title,
    description: deck.description,
    educationalLevel: 'Intermediate',
    learningResourceType: 'Flashcard',
    inLanguage: 'en',
    numberOfQuestions: deck.cardCount,
    isPartOf: {
      '@type': 'Course',
      name: deck.category === 'eks-coreks'
        ? 'Running Containers on Amazon EKS (200-COREKS)'
        : 'LearnKloud Free Flashcards',
      provider: {
        '@type': 'Organization',
        name: 'LearnKloud',
        url: PUBLIC_BASE_URL,
      },
    },
    hasPart: deck.cards.slice(0, 1).map((card) => ({
      '@type': 'Question',
      name: card.front,
      acceptedAnswer: { '@type': 'Answer', text: card.back },
    })),
    url: `${PUBLIC_BASE_URL}/flashcards/${deck.id}`,
  };
}

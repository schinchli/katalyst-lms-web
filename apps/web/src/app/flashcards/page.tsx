/**
 * /flashcards — public deck browser. Renders all 14 decks (no auth).
 * Each card links to /flashcards/[deck-slug] for the teaser experience.
 *
 * Server component (no hooks) so SEO crawlers see the full HTML.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { flashcardDecks } from '@/data/flashcards';
import { PUBLIC_BASE_URL } from '@/lib/deckMetadata';

const TOTAL_CARDS = flashcardDecks.reduce((sum, d) => sum + d.cardCount, 0);
const TOTAL_DECKS = flashcardDecks.length;

export const metadata: Metadata = {
  title: `Free AWS, Kubernetes & GenAI Flashcards — ${TOTAL_CARDS}+ cards | LearnKloud`,
  description: `Browse ${TOTAL_DECKS} flashcard decks covering Amazon EKS, AWS Cloud Practitioner (CLF-C02), AI Practitioner (AIF-C01), Kubernetes, and GenAI. ${TOTAL_CARDS}+ cards, free to study.`,
  keywords: [
    'AWS flashcards', 'EKS flashcards', 'Kubernetes flashcards', 'CLF-C02 flashcards',
    'AIF-C01 flashcards', 'GenAI flashcards', 'AWS certification prep', 'free flashcards',
    'Amazon EKS exam prep', 'cloud certification flashcards',
  ],
  alternates: { canonical: `${PUBLIC_BASE_URL}/flashcards` },
  openGraph: {
    title: `Free AWS & Kubernetes Flashcards (${TOTAL_CARDS}+) | LearnKloud`,
    description: `${TOTAL_DECKS} decks · ${TOTAL_CARDS} cards · free to study. Amazon EKS, CLF-C02, AIF-C01, Kubernetes, GenAI.`,
    url: `${PUBLIC_BASE_URL}/flashcards`,
    siteName: 'LearnKloud',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Free AWS & Kubernetes Flashcards (${TOTAL_CARDS}+) | LearnKloud`,
    description: `${TOTAL_DECKS} decks · ${TOTAL_CARDS} cards · free to study.`,
  },
  robots: { index: true, follow: true },
};

export default function PublicFlashcardsIndexPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg, #F8F7FA)',
        padding: '32px 16px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* ── Public header (above-the-fold) ──────────────────────────── */}
        <header style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10,
              textDecoration: 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary, #7367F0)',
                color: '#fff', display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 800 }}>K</div>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text, #4B465C)' }}>LearnKloud</span>
            </Link>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/login" className="btn-primary"
                style={{ textDecoration: 'none', padding: '8px 16px', fontSize: 13 }}>
                Sign in
              </Link>
            </div>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px', lineHeight: 1.2 }}>
            Free flashcards for AWS, Kubernetes &amp; GenAI certifications
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6, maxWidth: 720 }}>
            {TOTAL_DECKS} decks · {TOTAL_CARDS} cards · grounded in the official AWS exam guides.
            Browse a deck, flip a card, sign in to track progress.
          </p>
        </header>

        {/* ── Deck grid ───────────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {flashcardDecks.map((deck) => (
            <Link
              key={deck.id}
              href={`/flashcards/${deck.id}`}
              className="quiz-card"
              style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
            >
              {/* Header */}
              <div style={{ padding: '20px 20px 14px', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  marginBottom: 14 }}>
                  <span
                    style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                      background: `${deck.color}20`, color: deck.color,
                      padding: '3px 9px', borderRadius: 10,
                    }}
                  >
                    {deck.category}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {deck.cardCount} cards
                  </span>
                </div>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{deck.icon}</div>
                <h2 style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 15, color: 'var(--text)',
                  lineHeight: 1.4 }}>
                  {deck.title}
                </h2>
                <p
                  style={{
                    margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {deck.description}
                </p>
              </div>
              {/* Footer */}
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: 12, color: 'var(--text-secondary)' }}>
                  <span>Free preview · 1 card</span>
                  <span style={{ color: deck.color, fontWeight: 600 }}>Study →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Footer CTA ─────────────────────────────────────────────── */}
        <footer style={{ marginTop: 48, padding: '24px 0', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
          <p style={{ margin: '0 0 12px', color: 'var(--text-secondary)', fontSize: 14 }}>
            Want progress tracking, AI-grounded explanations, and full quizzes?
          </p>
          <Link href="/signup" className="btn-primary"
            style={{ textDecoration: 'none', padding: '10px 24px', fontSize: 14, display: 'inline-block' }}>
            Create a free account
          </Link>
        </footer>
      </div>
    </div>
  );
}

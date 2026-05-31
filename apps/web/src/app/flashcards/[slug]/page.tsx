/**
 * /flashcards/[slug] — public per-deck teaser page.
 *
 * Shows the deck header + ONE card (rendered as a flippable client widget)
 * + a login wall pointing at the gated /dashboard/flashcards experience.
 *
 * generateMetadata() emits per-deck SEO title/description/OG.
 * generateStaticParams() pre-renders all 14 deck pages at build time so
 * Google can crawl them as fully-static HTML.
 *
 * JSON-LD structured data (Quiz / LearningResource) is injected so
 * Google can show rich results.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { flashcardDecks } from '@/data/flashcards';
import { TeaserCard } from '@/components/TeaserCard';
import {
  PUBLIC_BASE_URL, deckDescription, deckJsonLd, deckOgImage, deckTitle,
} from '@/lib/deckMetadata';

export function generateStaticParams() {
  return flashcardDecks.map((d) => ({ slug: d.id }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const deck = flashcardDecks.find((d) => d.id === slug);
  if (!deck) return { title: 'Deck not found | LearnKloud' };
  const description = deckDescription(deck);
  const title       = deckTitle(deck);
  const ogImage     = deckOgImage();
  const url         = `${PUBLIC_BASE_URL}/flashcards/${deck.id}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    keywords: [
      deck.title, `${deck.title} flashcards`, `${deck.category} flashcards`,
      'free flashcards', 'AWS certification prep', 'LearnKloud',
    ],
    openGraph: {
      title, description, url, siteName: 'LearnKloud', type: 'article',
      images: [{ url: ogImage, width: 1200, height: 630, alt: deck.title }],
    },
    twitter: {
      card: 'summary_large_image', title, description, images: [ogImage],
    },
    robots: { index: true, follow: true },
  };
}

export default async function PublicDeckPage({ params }: PageProps) {
  const { slug } = await params;
  const deck = flashcardDecks.find((d) => d.id === slug);
  if (!deck || !deck.cards[0]) notFound();

  const firstCard    = deck.cards[0];
  const remainingCount = deck.cardCount - 1;
  const jsonLd       = deckJsonLd(deck);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #F8F7FA)', padding: '32px 16px' }}>
      <Script
        id={`jsonld-${deck.id}`}
        type="application/ld+json"
        strategy="beforeInteractive"
      >
        {JSON.stringify(jsonLd)}
      </Script>

      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* ── Public nav ──────────────────────────────────────────────── */}
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 7, background: 'var(--primary, #7367F0)',
              color: '#fff', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 800 }}>K</div>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>LearnKloud</span>
          </Link>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/flashcards" style={{ textDecoration: 'none', padding: '8px 12px',
              fontSize: 13, color: 'var(--text-secondary)', borderRadius: 7 }}>
              All decks
            </Link>
            <Link href="/login" className="btn-primary"
              style={{ textDecoration: 'none', padding: '8px 16px', fontSize: 13 }}>
              Sign in
            </Link>
          </div>
        </nav>

        {/* Breadcrumb */}
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
          <Link href="/flashcards" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            Flashcards
          </Link>
          {' / '}
          <span style={{ color: 'var(--text)' }}>{deck.title}</span>
        </div>

        {/* ── Deck header ─────────────────────────────────────────────── */}
        <header style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <span style={{ fontSize: 36 }}>{deck.icon}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: deck.color }}>
                {deck.category} · {deck.cardCount} cards
              </div>
              <h1 style={{ margin: '2px 0 0', fontSize: 24, fontWeight: 800,
                color: 'var(--text)', lineHeight: 1.3 }}>
                {deck.title}
              </h1>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            {deck.description}
          </p>
        </header>

        {/* ── Teaser card (1 of N) ────────────────────────────────────── */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 10 }}>
            Free preview · Card 1 of {deck.cardCount}
          </div>
          <TeaserCard front={firstCard.front} back={firstCard.back} color={deck.color} />
        </section>

        {/* ── Login wall ─────────────────────────────────────────────── */}
        {remainingCount > 0 && (
          <section
            style={{
              background: 'linear-gradient(135deg, rgba(115,103,240,0.10), rgba(74,144,226,0.06))',
              border: '1px solid rgba(115,103,240,0.25)',
              borderRadius: 14,
              padding: '28px 28px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
              {remainingCount} more cards to study
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: 14, color: 'var(--text-secondary)',
              lineHeight: 1.7, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
              Sign in (free) to see all {deck.cardCount} cards, track which ones you know,
              and unlock the full quiz library.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href={`/login?next=/dashboard/flashcards?deck=${encodeURIComponent(deck.id)}`}
                className="btn-primary"
                style={{ textDecoration: 'none', padding: '10px 22px', fontSize: 14 }}
              >
                Sign in to continue
              </Link>
              <Link
                href={`/signup?next=/dashboard/flashcards?deck=${encodeURIComponent(deck.id)}`}
                style={{
                  textDecoration: 'none', padding: '10px 22px', fontSize: 14,
                  border: '1px solid var(--border)', borderRadius: 7,
                  color: 'var(--text)', background: 'var(--surface)',
                }}
              >
                Create a free account
              </Link>
            </div>
          </section>
        )}

        {/* ── Other decks suggestion ─────────────────────────────────── */}
        <section style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Other decks you might like
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {flashcardDecks
              .filter((d) => d.id !== deck.id)
              .slice(0, 4)
              .map((d) => (
                <Link
                  key={d.id}
                  href={`/flashcards/${d.id}`}
                  style={{
                    display: 'block', textDecoration: 'none',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderLeft: `3px solid ${d.color}`,
                    borderRadius: 10, padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{d.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {d.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {d.cardCount} cards
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}

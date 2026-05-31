/**
 * /flashcards/[slug] — public per-deck teaser page.
 *
 * Visually mirrors the authenticated /dashboard/flashcards study screen:
 *   same header + progress bar + 600×300 FlipCard.
 * The control bar that the authenticated screen uses for Prev / Show
 * Answer / Knew it / Next is replaced by a login-required gate so cards
 * 2…N are gated behind sign-in.
 *
 * generateMetadata() + generateStaticParams() emit per-deck SEO.
 * JSON-LD (Quiz / LearningResource) injected via next/script.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { flashcardDecks } from '@/data/flashcards';
import { LockedFlipCard } from './LockedFlipCard';
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

  const firstCard      = deck.cards[0];
  const totalCards     = deck.cardCount;
  const next           = `/dashboard/flashcards?deck=${encodeURIComponent(deck.id)}`;
  const jsonLd         = deckJsonLd(deck);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #F8F7FA)' }}>
      <Script
        id={`jsonld-${deck.id}`}
        type="application/ld+json"
        strategy="beforeInteractive"
      >
        {JSON.stringify(jsonLd)}
      </Script>

      {/* ── Public nav ──────────────────────────────────────────────────── */}
      <nav
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 20px', borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 7, background: 'var(--primary, #7367F0)',
            color: '#fff', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 800 }}>K</div>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>LearnKloud</span>
        </Link>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            href="/flashcards"
            style={{ textDecoration: 'none', padding: '8px 12px', fontSize: 13,
              color: 'var(--text-secondary)', borderRadius: 7 }}
          >
            All decks
          </Link>
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="btn-primary"
            style={{ textDecoration: 'none', padding: '8px 16px', fontSize: 13 }}
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* ── Body — same layout as authenticated /dashboard/flashcards study view ── */}
      <div style={{ padding: '24px 20px 48px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>

          {/* Breadcrumb */}
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
            <Link href="/flashcards" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Flashcards
            </Link>
            {' / '}
            <span style={{ color: 'var(--text)' }}>{deck.title}</span>
          </div>

          {/* Header — mirrors StudyView header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <Link
              href="/flashcards"
              className="btn-ghost"
              style={{ fontSize: 13, padding: '6px 14px', textDecoration: 'none' }}
            >
              ← Decks
            </Link>
            <div>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                {deck.title}
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
                Card 1 of {totalCards} · Free preview
              </p>
            </div>
          </div>

          {/* Progress bar — shows 1/N filled */}
          <div className="course-progress-bar" style={{ marginBottom: 28 }}>
            <div
              className="course-progress-fill"
              style={{
                width: `${Math.max((1 / totalCards) * 100, 4)}%`,
                background: 'var(--primary)',
              }}
            />
          </div>

          {/* Flip card — same dimensions, border, badges as authenticated screen */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <LockedFlipCard card={firstCard} />
          </div>

          {/* Locked control bar — same shape as authenticated controls,
              but every button funnels to login instead of advancing the deck. */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(115,103,240,0.10), rgba(74,144,226,0.06))',
              border: '1px solid rgba(115,103,240,0.25)',
              borderRadius: 'var(--radius)',
              padding: '20px 22px',
              marginBottom: 18,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 6 }}>🔒</div>
            <h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              {totalCards - 1} more card{totalCards - 1 === 1 ? '' : 's'} to study
            </h2>
            <p
              style={{
                margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
                maxWidth: 460, marginLeft: 'auto', marginRight: 'auto',
              }}
            >
              Sign in (free) to flip every card, mark what you know, and pick up exactly
              where you left off.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href={`/login?next=${encodeURIComponent(next)}`}
                className="btn-primary"
                style={{ textDecoration: 'none', padding: '10px 22px', fontSize: 14 }}
              >
                Sign in to continue
              </Link>
              <Link
                href={`/signup?next=${encodeURIComponent(next)}`}
                className="btn-secondary"
                style={{ textDecoration: 'none', padding: '10px 22px', fontSize: 14 }}
              >
                Create free account
              </Link>
            </div>
          </div>

          {/* Keyboard hint — same row as authenticated study view */}
          <p style={{ textAlign: 'center', marginTop: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
            After sign-in:&nbsp;
            <kbd style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '1px 5px', borderRadius: 3 }}>Space</kbd> flip ·&nbsp;
            <kbd style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '1px 5px', borderRadius: 3 }}>←→</kbd> navigate ·&nbsp;
            <kbd style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '1px 5px', borderRadius: 3 }}>K</kbd> knew it ·&nbsp;
            <kbd style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '1px 5px', borderRadius: 3 }}>S</kbd> skip
          </p>

          {/* Other decks suggestion */}
          <section style={{ marginTop: 48 }}>
            <h2
              style={{
                fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)',
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12,
              }}
            >
              Other decks you might like
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 12,
              }}
            >
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
                        <div
                          style={{
                            fontSize: 12, fontWeight: 700, color: 'var(--text)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}
                        >
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
    </div>
  );
}

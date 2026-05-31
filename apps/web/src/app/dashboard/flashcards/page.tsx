'use client';
export const dynamic = 'force-dynamic';

/**
 * /dashboard/flashcards — list of all decks.
 *
 * Each deck is a Link to /dashboard/flashcards/<deck.id> so the URL
 * reflects exactly which deck you're studying (mirrors the public
 * /flashcards/<slug> pattern). Backward-compat: if someone hits this
 * page with the legacy ?deck=<id> query (cached links, old emails),
 * redirect to the dynamic route on mount.
 */
import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { flashcardDecks } from '@/data/flashcards';

function DeckGrid() {
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
          <Link
            key={deck.id}
            href={`/dashboard/flashcards/${deck.id}`}
            className="quiz-card"
            style={{ textDecoration: 'none', display: 'block' }}
          >
            <div className="card-body">
              {/* Icon row + category badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div
                  style={{
                    width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                    background: `${deck.color}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20,
                  }}
                >
                  {deck.icon}
                </div>
                <span
                  className="card-cat"
                  style={{ background: `${deck.color}20`, color: deck.color, margin: 0 }}
                >
                  {deck.category}
                </span>
              </div>

              <div className="card-title">{deck.title}</div>
              <div className="card-desc">{deck.description}</div>

              <hr className="card-divider" />

              <div className="card-footer">
                <span className="card-meta">{deck.cardCount} cards</span>
                <span className="btn-start" style={{ background: deck.color }}>
                  Study now →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function LegacyDeckRedirect() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get('deck');
    if (!id) return;
    if (!flashcardDecks.some((d) => d.id === id)) return;
    router.replace(`/dashboard/flashcards/${id}`);
  }, [router, searchParams]);

  return null;
}

export default function FlashcardsPage() {
  return (
    <Suspense fallback={null}>
      <LegacyDeckRedirect />
      <DeckGrid />
    </Suspense>
  );
}

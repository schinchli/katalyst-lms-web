'use client';
export const dynamic = 'force-dynamic';

/**
 * /dashboard/recommended
 *
 * Cross-path RAG recommendation panel. Sends the learner's reading progress
 * (notes-read from localStorage) plus the auth token to /api/recommendations,
 * which combines it with server-side quiz + flashcard progress and RAG semantic
 * search to return categorised "what to study next" recommendations — each with
 * a reason, a CTA, and official AWS reading links.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/LoadingSpinner';
import { CATEGORY_META, type RecCategory } from '@/lib/recommendations';

interface Rec {
  category: RecCategory;
  title: string;
  reason: string;
  difficulty?: string;
  estimatedMinutes?: number;
  link: string;
  cta: string;
  sourceUrl?: string;
  sourceTitle?: string;
}
interface ApiResponse {
  ok: true;
  authenticated: boolean;
  counts: { quizzesTaken: number; decksPracticed: number; modulesRead: number };
  recommendations: Rec[];
}

function readNotesRead(): string[] {
  if (typeof window === 'undefined') return [];
  const out: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('notes-read-') && localStorage.getItem(k) === '1') {
      out.push(k.replace('notes-read-', ''));
    }
  }
  return out;
}

function isExternal(link: string) { return /^https?:\/\//.test(link); }

export default function RecommendedPage() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [data, setData] = useState<ApiResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ notesRead: readNotesRead() }),
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.ok) { setStatus('error'); return; }
        setData(json as ApiResponse);
        setStatus('ok');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (status === 'loading') return <div className="page-content"><LoadingSpinner /></div>;
  if (status === 'error' || !data) {
    return (
      <div className="page-content" style={{ maxWidth: 880 }}>
        <div className="vx-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🤔</div>
          <h5 style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--text)' }}>Couldn’t load recommendations</h5>
          <Link href="/dashboard/learning-paths" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: 8 }}>
            Browse learning paths
          </Link>
        </div>
      </div>
    );
  }

  // Group by category, ordered by CATEGORY_META.order.
  const byCat = new Map<RecCategory, Rec[]>();
  for (const r of data.recommendations) {
    const arr = byCat.get(r.category) ?? []; arr.push(r); byCat.set(r.category, arr);
  }
  const orderedCats = [...byCat.keys()].sort((a, b) => CATEGORY_META[a].order - CATEGORY_META[b].order);

  const { quizzesTaken, decksPracticed, modulesRead } = data.counts;

  return (
    <div className="page-content" style={{ maxWidth: 880, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(115,103,240,0.12), rgba(74,144,226,0.08))',
        border: '1px solid rgba(115,103,240,0.25)', borderRadius: 14, padding: '22px 26px', marginBottom: 22,
      }}>
        <h3 style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 22, color: 'var(--text)' }}>Recommended for you</h3>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
          {data.authenticated
            ? `Based on ${modulesRead} modules read · ${quizzesTaken} quizzes · ${decksPracticed} flashcard decks across all AWS learning paths.`
            : 'Sign in to personalise these by your quiz scores and flashcard confidence.'}
        </p>
      </div>

      {orderedCats.length === 0 ? (
        <div className="vx-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          <h5 style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--text)' }}>Start a path to get recommendations</h5>
          <Link href="/dashboard/learning-paths" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: 8 }}>
            Browse learning paths
          </Link>
        </div>
      ) : (
        orderedCats.map((cat) => {
          const meta = CATEGORY_META[cat];
          const items = byCat.get(cat)!;
          return (
            <section key={cat} style={{ marginBottom: 26 }}>
              <h4 style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 17, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{meta.icon}</span> {meta.label}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 12 }}>
                {items.map((r, i) => {
                  const ext = isExternal(r.link);
                  const inner = (
                    <div className="vx-card" style={{ padding: '16px 18px', height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{r.title}</span>
                        {r.estimatedMinutes ? <span style={{ flexShrink: 0, fontSize: 12, color: 'var(--text-secondary)' }}>{r.estimatedMinutes} min</span> : null}
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{r.reason}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{r.cta} {ext ? '↗' : '→'}</span>
                        {r.difficulty ? <span className="vx-badge vx-badge-secondary" style={{ fontSize: 10 }}>{r.difficulty}</span> : null}
                      </div>
                    </div>
                  );
                  return ext ? (
                    <a key={i} href={r.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{inner}</a>
                  ) : (
                    <Link key={i} href={r.link} style={{ textDecoration: 'none' }}>{inner}</Link>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

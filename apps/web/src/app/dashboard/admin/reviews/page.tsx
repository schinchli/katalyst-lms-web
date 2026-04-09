'use client';
export const dynamic = 'force-dynamic';

/**
 * Admin Manage Reviews — Katalyst
 * View and edit quiz review stats stored in app_settings.
 */

import { useState, useEffect } from 'react';
import { useRouter }           from 'next/navigation';
import { supabase }            from '@/lib/supabase';
import { quizzes }             from '@/data/quizzes';
import LoadingSpinner          from '@/components/LoadingSpinner';

interface ReviewDistribution {
  '5': number;
  '4': number;
  '3': number;
  '2': number;
  '1': number;
}

interface ReviewStats {
  rating: number;
  count: number;
  distribution: ReviewDistribution;
}

interface QuizReviewRow {
  quizId: string;
  quizTitle: string;
  stats: ReviewStats;
  saving: boolean;
  feedback: string;
}

type PageStatus = 'loading' | 'authorized' | 'unauthorized' | 'error';

const EMPTY_DIST: ReviewDistribution = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

export default function ReviewsPage() {
  const router = useRouter();
  const [pageStatus, setPageStatus] = useState<PageStatus>('loading');
  const [token, setToken]           = useState('');
  const [rows, setRows]             = useState<QuizReviewRow[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setPageStatus('unauthorized'); return; }

        const res = await fetch('/api/admin/check', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) { setPageStatus('unauthorized'); return; }
        const { isAdmin } = await res.json() as { isAdmin: boolean };
        if (!isAdmin) { setPageStatus('unauthorized'); return; }

        setToken(session.access_token);
        setPageStatus('authorized');

        // Fetch existing stats
        const statsRes = await fetch('/api/admin/reviews', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        let storedStats: Record<string, ReviewStats> = {};
        if (statsRes.ok) {
          const body = await statsRes.json() as { ok: boolean; stats: Record<string, ReviewStats> };
          if (body.ok) storedStats = body.stats;
        }

        // Build rows for each quiz
        const quizRows: QuizReviewRow[] = quizzes.map((q) => {
          const existing = storedStats[q.id];
          return {
            quizId: q.id,
            quizTitle: q.title,
            stats: existing ?? { rating: 0, count: 0, distribution: { ...EMPTY_DIST } },
            saving: false,
            feedback: '',
          };
        });
        setRows(quizRows);
      } catch {
        setPageStatus('error');
      }
    })();
  }, []);

  function updateRow(quizId: string, patch: Partial<QuizReviewRow>) {
    setRows((prev) => prev.map((r) => r.quizId === quizId ? { ...r, ...patch } : r));
  }

  function updateStats(quizId: string, patch: Partial<ReviewStats>) {
    setRows((prev) => prev.map((r) => {
      if (r.quizId !== quizId) return r;
      return { ...r, stats: { ...r.stats, ...patch } };
    }));
  }

  function updateDist(quizId: string, star: keyof ReviewDistribution, value: number) {
    setRows((prev) => prev.map((r) => {
      if (r.quizId !== quizId) return r;
      return {
        ...r,
        stats: {
          ...r.stats,
          distribution: { ...r.stats.distribution, [star]: value },
        },
      };
    }));
  }

  async function saveRow(quizId: string) {
    const row = rows.find((r) => r.quizId === quizId);
    if (!row) return;

    updateRow(quizId, { saving: true, feedback: '' });

    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quizId,
          rating: row.stats.rating,
          count: row.stats.count,
          distribution: row.stats.distribution,
        }),
      });

      if (res.ok) {
        updateRow(quizId, { saving: false, feedback: 'Saved' });
        setTimeout(() => updateRow(quizId, { feedback: '' }), 2500);
      } else {
        updateRow(quizId, { saving: false, feedback: 'Error saving' });
      }
    } catch {
      updateRow(quizId, { saving: false, feedback: 'Network error' });
    }
  }

  if (pageStatus === 'loading') return <LoadingSpinner label="Verifying admin access..." />;
  if (pageStatus !== 'authorized') {
    return (
      <div className="page-error" role="alert">
        <div className="page-error-icon">🔐</div>
        <p style={{ margin: 0, fontWeight: 700 }}>Access Denied</p>
        <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Reviews</h1>
          <p className="page-subtitle">Edit quiz review stats displayed to users</p>
        </div>
        <button className="btn-primary" style={{ height: 36, padding: '0 16px', fontSize: 13 }} onClick={() => router.push('/dashboard/admin')}>
          Admin Home
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {rows.map((row) => (
          <div key={row.quizId} className="vx-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{row.quizTitle}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, fontFamily: 'monospace' }}>{row.quizId}</div>
              </div>
              <div style={{ fontSize: 16, color: 'var(--warning)', letterSpacing: 1 }}>{renderStars(row.stats.rating)}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Rating</label>
                <input
                  type="number"
                  min={0} max={5} step={0.1}
                  value={row.stats.rating}
                  onChange={(e) => updateStats(row.quizId, { rating: parseFloat(e.target.value) || 0 })}
                  className="admin-field-input"
                  style={{ marginTop: 4 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Count</label>
                <input
                  type="number"
                  min={0}
                  value={row.stats.count}
                  onChange={(e) => updateStats(row.quizId, { count: parseInt(e.target.value, 10) || 0 })}
                  className="admin-field-input"
                  style={{ marginTop: 4 }}
                />
              </div>
              {(['5', '4', '3', '2', '1'] as const).map((star) => (
                <div key={star}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{star} Star</label>
                  <input
                    type="number"
                    min={0}
                    value={row.stats.distribution[star]}
                    onChange={(e) => updateDist(row.quizId, star, parseInt(e.target.value, 10) || 0)}
                    className="admin-field-input"
                    style={{ marginTop: 4 }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                className="btn-primary"
                style={{ height: 34, padding: '0 20px', fontSize: 13 }}
                disabled={row.saving}
                onClick={() => saveRow(row.quizId)}
              >
                {row.saving ? 'Saving...' : 'Save'}
              </button>
              {row.feedback && (
                <span style={{
                  fontSize: 13, fontWeight: 600,
                  color: row.feedback === 'Saved' ? 'var(--success)' : 'var(--error)',
                }}>
                  {row.feedback === 'Saved' ? '✓ ' : ''}{row.feedback}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

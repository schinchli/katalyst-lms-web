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

interface PendingReview {
  id: string;
  quiz_id: string;
  user_id: string;
  rating: number;
  comment: string;
  flag_reason: string | null;
  created_at: string;
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
  const [pending, setPending]       = useState<PendingReview[]>([]);
  const [moderating, setModerating] = useState<Record<string, boolean>>({});

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

        // Fetch pending reviews from moderation queue
        const pendingRes = await fetch('/api/admin/pending-reviews', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (pendingRes.ok) {
          const pb = await pendingRes.json() as { ok: boolean; reviews: PendingReview[] };
          if (pb.ok) setPending(pb.reviews);
        }
      } catch {
        setPageStatus('error');
      }
    })();
  }, []);

  async function moderateReview(reviewId: string, action: 'approve' | 'reject') {
    setModerating((prev) => ({ ...prev, [reviewId]: true }));
    try {
      await fetch('/api/admin/moderate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reviewId, action }),
      });
      setPending((prev) => prev.filter((r) => r.id !== reviewId));
    } finally {
      setModerating((prev) => { const n = { ...prev }; delete n[reviewId]; return n; });
    }
  }

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

      {/* ── Moderation Queue ──────────────────────────────────────────────── */}
      {pending.length > 0 && (
        <div className="vx-card" style={{ padding: 20, marginBottom: 24, border: '1px solid rgba(255,159,67,0.4)', background: 'rgba(255,159,67,0.04)' }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--warning)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            🚨 Moderation Queue
            <span style={{ background: 'var(--warning)', color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: 12, fontWeight: 700 }}>{pending.length}</span>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
            These reviews were flagged by the content filter and are not visible to users until approved.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pending.map((r) => (
              <div key={r.id} style={{ padding: '14px 16px', background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{r.quiz_id}</span>
                    <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                      {[1,2,3,4,5].map((n) => (
                        <span key={n} style={{ color: n <= r.rating ? 'var(--warning)' : 'var(--border)', fontSize: 14 }}>★</span>
                      ))}
                    </div>
                  </div>
                  {r.flag_reason && (
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,76,81,0.1)', color: 'var(--error)', fontWeight: 600 }}>
                      {r.flag_reason}
                    </span>
                  )}
                </div>
                <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text)', lineHeight: 1.6, fontStyle: 'italic' }}>
                  &ldquo;{r.comment}&rdquo;
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    disabled={moderating[r.id]}
                    onClick={() => moderateReview(r.id, 'approve')}
                    style={{ height: 32, padding: '0 16px', borderRadius: 8, background: 'rgba(40,199,111,0.12)', border: '1px solid var(--success)', color: 'var(--success)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    disabled={moderating[r.id]}
                    onClick={() => moderateReview(r.id, 'reject')}
                    style={{ height: 32, padding: '0 16px', borderRadius: 8, background: 'rgba(255,76,81,0.08)', border: '1px solid rgba(255,76,81,0.4)', color: 'var(--error)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Aggregate Stats Editor ─────────────────────────────────────────── */}
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

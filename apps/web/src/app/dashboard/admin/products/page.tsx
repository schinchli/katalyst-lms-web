'use client';
export const dynamic = 'force-dynamic';

/**
 * Admin Product List — Katalyst
 * Read-only list of quizzes with catalog override info.
 */

import { useState, useEffect } from 'react';
import { useRouter }           from 'next/navigation';
import { supabase }            from '@/lib/supabase';
import { quizzes }             from '@/data/quizzes';
import LoadingSpinner          from '@/components/LoadingSpinner';

interface CatalogOverride {
  isPremium?: boolean;
  price?: number;
}

type PageStatus = 'loading' | 'authorized' | 'unauthorized' | 'error';

function difficultyColor(d: string): string {
  if (d === 'beginner')     return 'success';
  if (d === 'intermediate') return 'warning';
  return 'error';
}

export default function ProductsPage() {
  const router = useRouter();
  const [pageStatus, setPageStatus] = useState<PageStatus>('loading');
  const [overrides, setOverrides]   = useState<Record<string, CatalogOverride>>({});

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

        setPageStatus('authorized');

        // Fetch catalog overrides
        const catRes = await fetch('/api/quiz-catalog');
        if (catRes.ok) {
          const body = await catRes.json() as { ok: boolean; overrides: Record<string, CatalogOverride> };
          if (body.ok) setOverrides(body.overrides);
        }
      } catch {
        setPageStatus('error');
      }
    })();
  }, []);

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
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{quizzes.length} quizzes in catalog</p>
        </div>
        <button className="btn-primary" style={{ height: 36, padding: '0 16px', fontSize: 13 }} onClick={() => router.push('/dashboard/admin')}>
          Admin Home
        </button>
      </div>

      <div className="vx-card" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['', 'Title', 'Category', 'Difficulty', 'Questions', 'Plan', 'Price'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quizzes.map((q) => {
                const override = overrides[q.id];
                const isPremium = override?.isPremium ?? q.isPremium;
                const price = override?.price ?? q.price ?? 0;

                return (
                  <tr
                    key={q.id}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onClick={() => router.push(`/dashboard/quiz/${q.id}`)}
                  >
                    <td style={{ padding: '10px 14px', fontSize: 20, width: 48, textAlign: 'center' }}>{q.icon}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{q.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{q.id}</div>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
                      {q.category}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className={`vx-badge vx-badge-${difficultyColor(q.difficulty)}`}>{q.difficulty}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text)' }}>{q.questionCount}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {isPremium ? (
                        <span className="vx-badge vx-badge-warning">Premium</span>
                      ) : (
                        <span className="vx-badge vx-badge-success">Free</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: isPremium ? 'var(--primary)' : 'var(--text-secondary)' }}>
                      {isPremium ? `₹${price.toLocaleString('en-IN')}` : 'Free'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

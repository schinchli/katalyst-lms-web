'use client';
export const dynamic = 'force-dynamic';

/**
 * Admin Products — LearnKloud
 * Full quiz catalog: built-in + managed, fetched from /api/admin/quiz-builder.
 * Click "Edit" to open in Quiz Builder. Click row to preview the quiz.
 */

import { useState, useEffect } from 'react';
import { useRouter }           from 'next/navigation';
import { supabase }            from '@/lib/supabase';
import LoadingSpinner          from '@/components/LoadingSpinner';

interface QuizProduct {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  questionCount: number;
  isPremium: boolean;
  price: number;
  icon: string;
  enabled: boolean;
  _source: 'builtin' | 'managed';
}

type PageStatus = 'loading' | 'authorized' | 'unauthorized' | 'error';

function difficultyColor(d: string) {
  if (d === 'beginner')     return 'success';
  if (d === 'intermediate') return 'warning';
  return 'error';
}

export default function ProductsPage() {
  const router = useRouter();
  const [pageStatus,  setPageStatus]  = useState<PageStatus>('loading');
  const [token,       setToken]       = useState('');
  const [products,    setProducts]    = useState<QuizProduct[]>([]);
  const [search,      setSearch]      = useState('');
  const [filterPlan,  setFilterPlan]  = useState<'all' | 'free' | 'premium'>('all');

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

        // Fetch merged catalog from quiz-builder API
        const catRes = await fetch('/api/admin/quiz-builder', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (catRes.ok) {
          const body = await catRes.json() as { ok: boolean; quizzes: QuizProduct[] };
          if (body.ok) setProducts(body.quizzes);
        }
      } catch { setPageStatus('error'); }
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

  const managed = products.filter((p) => p._source === 'managed').length;
  const filtered = products.filter((p) => {
    if (filterPlan === 'free'    && p.isPremium)  return false;
    if (filterPlan === 'premium' && !p.isPremium) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.id.includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">
            {products.length} quizzes in catalog
            <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
              · {managed} managed · {products.length - managed} built-in
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-primary"
            style={{ height: 36, padding: '0 16px', fontSize: 13 }}
            onClick={() => router.push('/dashboard/admin/quiz-builder')}
          >
            + Quiz Builder
          </button>
          <button
            style={{ height: 36, borderRadius: 8, padding: '0 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontFamily: 'inherit' }}
            onClick={() => router.push('/dashboard/admin')}
          >
            Admin Home
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="admin-field-input"
          style={{ width: 220 }}
          placeholder="Search title or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {(['all', 'free', 'premium'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterPlan(f)}
            style={{
              height: 34, padding: '0 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              background: filterPlan === f ? 'var(--primary)' : 'transparent',
              color: filterPlan === f ? '#fff' : 'var(--text-secondary)',
              border: filterPlan === f ? 'none' : '1.5px solid var(--border)',
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 4 }}>{filtered.length} results</span>
      </div>

      <div className="vx-card" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['', 'Title', 'Category', 'Difficulty', 'Questions', 'Plan', 'Price', 'Source', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  style={{ borderBottom: '1px solid var(--border)', opacity: p.enabled ? 1 : 0.5 }}
                >
                  <td style={{ padding: '10px 14px', fontSize: 20, width: 48, textAlign: 'center' }}>{p.icon}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{p.id}</div>
                    {!p.enabled && <div style={{ fontSize: 10, color: 'var(--error)', fontWeight: 700, marginTop: 2 }}>DISABLED</div>}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
                    {p.category}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className={`vx-badge vx-badge-${difficultyColor(p.difficulty)}`}>{p.difficulty}</span>
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text)' }}>{p.questionCount}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {p.isPremium
                      ? <span className="vx-badge vx-badge-warning">Premium</span>
                      : <span className="vx-badge vx-badge-success">Free</span>}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: p.isPremium ? 'var(--primary)' : 'var(--text-secondary)' }}>
                    {p.isPremium ? `₹${p.price.toLocaleString('en-IN')}` : 'Free'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {p._source === 'managed'
                      ? <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(115,103,240,0.12)', color: 'var(--primary)', fontWeight: 700 }}>MANAGED</span>
                      : <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--bg)', color: 'var(--text-secondary)', fontWeight: 700, border: '1px solid var(--border)' }}>BUILT-IN</span>
                    }
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <button
                      onClick={() => router.push(`/dashboard/admin/quiz-builder?quiz=${p.id}`)}
                      style={{ height: 28, padding: '0 12px', borderRadius: 6, background: 'var(--primary-light)', border: 'none', color: 'var(--primary-text)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
              No products match your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

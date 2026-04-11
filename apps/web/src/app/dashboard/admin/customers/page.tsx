'use client';
export const dynamic = 'force-dynamic';

/**
 * Admin Customer List — LearnKloud
 * Paginated table with search, purchase counts, and Grant Access modal.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter }                                 from 'next/navigation';
import { supabase }                                  from '@/lib/supabase';
import LoadingSpinner                                from '@/components/LoadingSpinner';

interface Customer {
  id: string;
  name: string | null;
  email: string | null;
  is_pro: boolean;
  created_at: string;
  coins: number | null;
  streak: number | null;
  purchase_count: number;
  unlocked_count: number;
}

interface Quiz {
  id: string;
  title: string;
  _source: string;
}

type PageStatus = 'loading' | 'authorized' | 'unauthorized' | 'error';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function avatarInitial(name: string | null): string {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

const AVATAR_COLORS = ['#7367F0', '#28C76F', '#FF9F43', '#00CFE8', '#EA5455', '#9C27B0'];
function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function CustomersPage() {
  const router = useRouter();
  const [pageStatus, setPageStatus] = useState<PageStatus>('loading');
  const [token, setToken]           = useState('');
  const [customers, setCustomers]   = useState<Customer[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const LIMIT = 20;

  // Grant Access modal state
  const [grantTarget, setGrantTarget]     = useState<Customer | null>(null);
  const [quizList, setQuizList]           = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [grantReason, setGrantReason]     = useState('');
  const [grantLoading, setGrantLoading]   = useState(false);
  const [grantMsg, setGrantMsg]           = useState('');

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
      } catch {
        setPageStatus('error');
      }
    })();
  }, []);

  const fetchCustomers = useCallback(async () => {
    if (!token) return;
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (search) params.set('search', search);

    const res = await fetch(`/api/admin/customers?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const body = await res.json() as { ok: boolean; customers: Customer[]; total: number };
      if (body.ok) {
        setCustomers(body.customers);
        setTotal(body.total);
      }
    }
  }, [token, page, search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  function handleSearchChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 300);
  }

  async function openGrantModal(customer: Customer) {
    setGrantTarget(customer);
    setSelectedQuizId('');
    setGrantReason('');
    setGrantMsg('');
    // Fetch quiz list if not already loaded
    if (quizList.length === 0) {
      const res = await fetch('/api/admin/quiz-builder', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const body = await res.json() as { ok: boolean; quizzes: Quiz[] };
        if (body.ok) setQuizList(body.quizzes);
      }
    }
  }

  async function handleGrantAccess() {
    if (!grantTarget || !selectedQuizId) return;
    setGrantLoading(true);
    setGrantMsg('');
    try {
      const selectedQuiz = quizList.find((q) => q.id === selectedQuizId);
      const res = await fetch('/api/admin/grant-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId:    grantTarget.id,
          quizId:    selectedQuizId,
          quizTitle: selectedQuiz?.title ?? selectedQuizId,
          reason:    grantReason || 'Admin grant',
        }),
      });
      const body = await res.json() as { ok: boolean; error?: string };
      if (body.ok) {
        setGrantMsg('✓ Access granted successfully');
        fetchCustomers(); // refresh counts
      } else {
        setGrantMsg(`Error: ${body.error ?? 'Unknown error'}`);
      }
    } catch {
      setGrantMsg('Error: Request failed');
    }
    setGrantLoading(false);
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

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">{total} registered users</p>
        </div>
        <button className="btn-primary" style={{ height: 36, padding: '0 16px', fontSize: 13 }} onClick={() => router.push('/dashboard/admin')}>
          Admin Home
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          className="admin-field-input"
          style={{ maxWidth: 360 }}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="vx-card" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Customer', 'Email', 'Plan', 'Purchases', 'Unlocked', 'Coins', 'Streak', 'Joined', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, fontWeight: 700, color: '#fff',
                          background: avatarColor(c.id), flexShrink: 0,
                        }}>
                          {avatarInitial(c.name)}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{c.name ?? 'Unnamed'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{c.email ?? '-'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {c.is_pro ? (
                        <span className="vx-badge vx-badge-success">Pro</span>
                      ) : (
                        <span className="vx-badge vx-badge-secondary">Free</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text)' }}>
                      {c.purchase_count > 0 ? (
                        <span
                          style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }}
                          onClick={() => router.push(`/dashboard/admin/orders?user=${c.id}`)}
                        >
                          {c.purchase_count}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>0</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--info)' }}>{c.unlocked_count}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--warning)' }}>{c.coins ?? 0}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--error)' }}>
                      {c.streak ?? 0} 🔥
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{formatDate(c.created_at)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <button
                        onClick={() => openGrantModal(c)}
                        style={{
                          padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', border: 'none', background: 'var(--primary)',
                          color: '#fff', fontFamily: 'inherit', whiteSpace: 'nowrap',
                        }}
                      >
                        Grant Access
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Page {page} of {totalPages}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)',
                opacity: page <= 1 ? 0.5 : 1, fontFamily: 'inherit',
              }}
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)',
                opacity: page >= totalPages ? 0.5 : 1, fontFamily: 'inherit',
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Grant Access Modal */}
      {grantTarget && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setGrantTarget(null); }}
        >
          <div className="vx-card" style={{ width: '100%', maxWidth: 460, padding: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Grant Course Access</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Granting access to <strong>{grantTarget.name ?? grantTarget.email}</strong> without payment.
              This will appear in Orders and the user's unlocked courses.
            </div>

            {/* Quiz selector */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                Select Quiz / Course
              </label>
              <select
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
                className="admin-field-input"
                style={{ width: '100%' }}
              >
                <option value="">— Choose a quiz —</option>
                {quizList.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title} {q._source === 'managed' ? '(managed)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                Reason (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Scholarship, demo access, refund comp..."
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                className="admin-field-input"
                style={{ width: '100%' }}
                maxLength={500}
              />
            </div>

            {/* Feedback */}
            {grantMsg && (
              <div style={{
                padding: '8px 12px', borderRadius: 6, marginBottom: 14, fontSize: 13, fontWeight: 600,
                background: grantMsg.startsWith('✓') ? 'var(--success-light, #d4edda)' : 'var(--error-light, #f8d7da)',
                color: grantMsg.startsWith('✓') ? 'var(--success)' : 'var(--error)',
              }}>
                {grantMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setGrantTarget(null)}
                style={{
                  padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', border: '1.5px solid var(--border)', background: 'transparent',
                  color: 'var(--text-secondary)', fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleGrantAccess}
                disabled={!selectedQuizId || grantLoading}
                className="btn-primary"
                style={{ padding: '8px 20px', fontSize: 13, opacity: (!selectedQuizId || grantLoading) ? 0.6 : 1 }}
              >
                {grantLoading ? 'Granting…' : 'Grant Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

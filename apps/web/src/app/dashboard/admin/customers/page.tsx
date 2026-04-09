'use client';
export const dynamic = 'force-dynamic';

/**
 * Admin Customer List — Katalyst
 * Paginated customer table with search.
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
                {['Customer', 'Email', 'Plan', 'Coins', 'Streak', 'Joined'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
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
                          background: avatarColor(c.id),
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
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--warning)' }}>{c.coins ?? 0}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--error)' }}>
                      {c.streak ?? 0} 🔥
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{formatDate(c.created_at)}</td>
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
    </div>
  );
}

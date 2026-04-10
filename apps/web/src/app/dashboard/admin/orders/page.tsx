'use client';
export const dynamic = 'force-dynamic';

/**
 * Admin Order List — Katalyst
 * Paginated orders table with status filter tabs.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter }                        from 'next/navigation';
import { supabase }                         from '@/lib/supabase';
import LoadingSpinner                       from '@/components/LoadingSpinner';

interface Order {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  quiz_id: string;
  amount: number;
  currency: string;
  status: string;
  gateway: string;
  created_at: string;
}

type PageStatus = 'loading' | 'authorized' | 'unauthorized' | 'error';
type StatusFilter = '' | 'completed' | 'pending' | 'failed';

function formatCurrency(amount: number, currency: string = 'INR'): string {
  if (currency === 'USD') return `$${(amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusBadge(status: string): string {
  if (status === 'completed') return 'success';
  if (status === 'pending')   return 'warning';
  return 'error';
}

export default function OrdersPage() {
  const router = useRouter();
  const [pageStatus, setPageStatus] = useState<PageStatus>('loading');
  const [token, setToken]           = useState('');
  const [orders, setOrders]         = useState<Order[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [filter, setFilter]         = useState<StatusFilter>('');
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

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (filter) params.set('status', filter);

    const res = await fetch(`/api/admin/orders?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const body = await res.json() as { ok: boolean; orders: Order[]; total: number };
      if (body.ok) {
        setOrders(body.orders);
        setTotal(body.total);
      }
    }
  }, [token, page, filter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

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
  const filters: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: '' },
    { label: 'Completed', value: 'completed' },
    { label: 'Pending', value: 'pending' },
    { label: 'Failed', value: 'failed' },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">{total} total orders</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{
              height: 36, padding: '0 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', border: '1.5px solid var(--border)', background: 'transparent',
              color: 'var(--text-secondary)', fontFamily: 'inherit',
            }}
            onClick={() => alert('Export coming soon')}
          >
            Export
          </button>
          <button className="btn-primary" style={{ height: 36, padding: '0 16px', fontSize: 13 }} onClick={() => router.push('/dashboard/admin')}>
            Admin Home
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setPage(1); }}
            style={{
              padding: '6px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', border: 'none',
              background: filter === f.value ? 'var(--primary)' : 'var(--surface)',
              color: filter === f.value ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders table */}
      <div className="vx-card" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['#', 'Order ID', 'Customer', 'Quiz', 'Amount', 'Gateway', 'Status', 'Date'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((o, i) => (
                  <tr
                    key={o.id}
                    onClick={() => router.push(`/dashboard/admin/orders/${o.id}`)}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{(page - 1) * LIMIT + i + 1}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-secondary)' }}>
                      {o.id.slice(0, 8)}…
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{o.user_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{o.user_email}</div>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{o.quiz_id || '—'}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(o.amount, o.currency)}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{o.gateway || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className={`vx-badge vx-badge-${statusBadge(o.status)}`}>{o.status}</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{formatDate(o.created_at)}</td>
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
                padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: page <= 1 ? 'not-allowed' : 'pointer',
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
                padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: page >= totalPages ? 'not-allowed' : 'pointer',
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

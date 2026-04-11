'use client';
export const dynamic = 'force-dynamic';

/**
 * Admin E-Commerce Dashboard — LearnKloud
 * Stats overview: revenue, orders, customers, pro subscribers + recent orders table.
 */

import { useState, useEffect } from 'react';
import { useRouter }           from 'next/navigation';
import { supabase }            from '@/lib/supabase';
import LoadingSpinner          from '@/components/LoadingSpinner';

interface RecentOrder {
  id: string;
  user_id: string;
  user_name: string;
  quiz_id: string;
  amount: number;
  currency: string;
  status: string;
  gateway: string;
  created_at: string;
}

interface EcomStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  proSubscribers: number;
  recentOrders: RecentOrder[];
}

type PageStatus = 'loading' | 'authorized' | 'unauthorized' | 'error';

function formatCurrency(amount: number, currency: string = 'INR'): string {
  if (currency === 'USD') return `$${(amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusColor(status: string): string {
  if (status === 'completed') return 'success';
  if (status === 'pending')   return 'warning';
  return 'error';
}

export default function EcommerceDashboardPage() {
  const router = useRouter();
  const [status, setStatus] = useState<PageStatus>('loading');
  const [stats, setStats]   = useState<EcomStats | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setStatus('unauthorized'); return; }

        const checkRes = await fetch('/api/admin/check', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!checkRes.ok) { setStatus('unauthorized'); return; }
        const { isAdmin } = await checkRes.json() as { isAdmin: boolean };
        if (!isAdmin) { setStatus('unauthorized'); return; }

        setStatus('authorized');

        const statsRes = await fetch('/api/admin/ecommerce-stats', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (statsRes.ok) {
          const body = await statsRes.json() as { ok: boolean; stats: EcomStats };
          if (body.ok) setStats(body.stats);
        }
      } catch {
        setStatus('error');
      }
    })();
  }, []);

  if (status === 'loading') return <LoadingSpinner label="Verifying admin access..." />;

  if (status === 'unauthorized' || status === 'error') {
    return (
      <div className="page-error" role="alert">
        <div className="page-error-icon">🔐</div>
        <p style={{ margin: 0, fontWeight: 700 }}>Access Denied</p>
        <p style={{ margin: '4px 0 16px', color: 'var(--text-secondary)', fontSize: 13 }}>
          {status === 'error' ? 'An error occurred verifying access.' : 'You do not have permission to view this page.'}
        </p>
        <button className="btn-primary" onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Revenue', value: stats ? formatCurrency(stats.totalRevenue) : '—', color: 'var(--success)', iconBg: 'rgba(40,199,111,0.12)',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    },
    {
      label: 'Total Orders', value: stats ? String(stats.totalOrders) : '—', color: 'var(--primary)', iconBg: 'rgba(115,103,240,0.12)',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
    },
    {
      label: 'Total Customers', value: stats ? String(stats.totalCustomers) : '—', color: 'var(--info)', iconBg: 'rgba(0,207,232,0.12)',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
    {
      label: 'Pro Subscribers', value: stats ? String(stats.proSubscribers) : '—', color: 'var(--warning)', iconBg: 'rgba(255,159,67,0.12)',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">E-Commerce Dashboard</h1>
          <p className="page-subtitle">Sales and revenue overview</p>
        </div>
        <button
          className="btn-primary"
          style={{ height: 36, padding: '0 16px', fontSize: 13 }}
          onClick={() => router.push('/dashboard/admin')}
        >
          Admin Home
        </button>
      </div>

      {/* Stat Cards */}
      <div className="dash-stats-grid" style={{ marginBottom: 24 }}>
        {statCards.map((s) => (
          <div key={s.label} className="dash-stat-card">
            <div className="dash-stat-icon" style={{ background: s.iconBg, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <div className="dash-stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="dash-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="vx-card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
          Recent Orders
        </div>
        <div style={{ overflowX: 'auto' }}>
          {!stats || stats.recentOrders.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
              No orders yet.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Order ID', 'Customer', 'Quiz', 'Amount', 'Status', 'Date'].map((h) => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((o) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-secondary)' }}>
                      {o.id.slice(0, 8)}...
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text)' }}>{o.user_name}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{o.quiz_id}</td>
                    <td style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(o.amount, o.currency)}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span className={`vx-badge vx-badge-${statusColor(o.status)}`}>{o.status}</span>
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{formatDate(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

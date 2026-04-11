'use client';
export const dynamic = 'force-dynamic';

/**
 * Admin Order Detail — LearnKloud
 * Shows full details of a single order record.
 */

import { useState, useEffect }  from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase }             from '@/lib/supabase';
import LoadingSpinner           from '@/components/LoadingSpinner';

interface OrderDetail {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  quiz_id: string;
  quiz_title: string;
  amount: number;
  currency: string;
  status: string;
  gateway: string;
  purchase_type: string;
  plan: string | null;
  payment_ref: string;
  created_at: string;
  _source: string;
}

type PageStatus = 'loading' | 'authorized' | 'unauthorized' | 'error' | 'not_found';

const STATUS_COLOR: Record<string, string> = {
  completed: 'var(--success)',
  pending:   'var(--warning)',
  failed:    'var(--error)',
};

function formatAmount(amount: number, currency: string) {
  const divisor = currency === 'INR' ? 100 : 100;
  const sym = currency === 'INR' ? '₹' : '$';
  return `${sym}${(amount / divisor).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const { orderId } = useParams<{ orderId: string }>();
  const [pageStatus, setPageStatus] = useState<PageStatus>('loading');
  const [order, setOrder] = useState<OrderDetail | null>(null);

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

        // Fetch order details
        const orderRes = await fetch(`/api/admin/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (orderRes.status === 404) { setPageStatus('not_found'); return; }
        if (!orderRes.ok) { setPageStatus('error'); return; }
        const body = await orderRes.json() as { ok: boolean; order: OrderDetail };
        if (body.ok && body.order) {
          setOrder(body.order);
          setPageStatus('authorized');
        } else {
          setPageStatus('not_found');
        }
      } catch { setPageStatus('error'); }
    })();
  }, [orderId]);

  if (pageStatus === 'loading') return <LoadingSpinner label="Loading order…" />;
  if (pageStatus === 'unauthorized') {
    return (
      <div className="page-error" role="alert">
        <div className="page-error-icon">🔐</div>
        <p style={{ margin: 0, fontWeight: 700 }}>Access Denied</p>
        <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }
  if (pageStatus === 'not_found' || !order) {
    return (
      <div className="page-error" role="alert">
        <div className="page-error-icon">🔍</div>
        <p style={{ margin: 0, fontWeight: 700 }}>Order not found</p>
        <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => router.push('/dashboard/admin/orders')}>Back to Orders</button>
      </div>
    );
  }

  const statusColor = STATUS_COLOR[order.status] ?? 'var(--text-secondary)';
  const amountDisplay = formatAmount(order.amount, order.currency);

  const Field = ({ label, value, mono = false }: { label: string; value: string | null | undefined; mono?: boolean }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--text)', fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>
        {value || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>—</span>}
      </div>
    </div>
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Order Detail</h1>
          <p className="page-subtitle" style={{ fontFamily: 'monospace', fontSize: 12 }}>{order.id}</p>
        </div>
        <button
          style={{ height: 36, borderRadius: 8, padding: '0 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontFamily: 'inherit' }}
          onClick={() => router.push('/dashboard/admin/orders')}
        >
          ← Orders
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Order Summary */}
        <div className="vx-card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>Order Summary</div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--success)' }}>{amountDisplay}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{order.currency}</div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 8, background: `${statusColor}18`, color: statusColor, textTransform: 'capitalize' }}>
              {order.status}
            </span>
          </div>

          <Field label="Type" value={order.purchase_type === 'subscription' ? `Subscription — ${order.plan ?? 'annual'}` : 'Course Purchase'} />
          <Field label="Gateway" value={order.gateway} />
          <Field label="Payment Reference" value={order.payment_ref} mono />
          <Field label="Created" value={new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} />
          <Field label="Source" value={order._source === 'orders' ? 'Orders table (v2)' : 'Purchases table (legacy)'} />
        </div>

        {/* Customer + Product */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="vx-card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>Customer</div>
            <Field label="Name"    value={order.user_name} />
            <Field label="Email"   value={order.user_email} />
            <Field label="User ID" value={order.user_id} mono />
          </div>

          <div className="vx-card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>Product</div>
            <Field label="Quiz ID"    value={order.quiz_id} mono />
            <Field label="Quiz Title" value={order.quiz_title || order.quiz_id} />
            <div style={{ marginTop: 12 }}>
              <button
                onClick={() => router.push(`/dashboard/quiz/${order.quiz_id}`)}
                style={{ height: 32, padding: '0 14px', borderRadius: 8, background: 'var(--primary-light)', border: 'none', color: 'var(--primary-text)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Preview Quiz →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

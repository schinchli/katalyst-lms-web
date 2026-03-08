'use client';
export const dynamic = 'force-dynamic';
/**
 * Admin Dashboard — Katalyst
 *
 * SECURITY: Admin access is verified server-side via /api/admin/check.
 * The user's Supabase JWT is sent to the server and validated there.
 * localStorage is NEVER used to determine admin status.
 * (OWASP A01 Broken Access Control fix)
 */

import { useState, useEffect } from 'react';
import { useRouter }           from 'next/navigation';
import { quizzes }             from '@/data/quizzes';
import { supabase }            from '@/lib/supabase';
import { getPurchases }        from '@/lib/db';
import type { PurchaseRecord } from '@/lib/db';

// ── Upsell config (mirrors quiz page) ────────────────────────────────────────
const ADMIN_MSGS_KEY = 'katalyst-admin-msgs';
interface UpsellConfig {
  freeLimit:      number;
  headline:       string;
  subtext:        string;
  proCtaLabel:    string;
  courseCtaLabel: string;
  skipCtaLabel:   string;
}
const DEFAULT_UPSELL: UpsellConfig = {
  freeLimit:      25,
  headline:       "You've cracked {n}. The exam has {remaining} more waiting.",
  subtext:        "You're scoring {score} in the free zone — not bad. But the questions that decide pass or fail are the ones you haven't touched yet: Security deep-dives, Technology edge cases, full-length stamina. Go all-in and walk into the exam knowing every corner of CLF-C02.",
  proCtaLabel:    '⭐ Unlock All {total} Questions — Pro ₹999/yr',
  courseCtaLabel: '🔓 Finish This Quiz — ₹{price} one-time',
  skipCtaLabel:   '← Browse Other Quizzes',
};
// ─────────────────────────────────────────────────────────────────────────────

function maskEmail(email?: string): string {
  if (!email) return 'anonymous';
  const [u, d] = email.split('@');
  return `${u.slice(0, 2)}***@${d ?? ''}`;
}

type AdminStatus = 'loading' | 'authorized' | 'unauthorized' | 'error';

export default function AdminPage() {
  const router = useRouter();
  const [status,      setStatus]      = useState<AdminStatus>('loading');
  const [purchases,   setPurchases]   = useState<PurchaseRecord[]>([]);
  const [userId,      setUserId]      = useState<string | null>(null);
  const [upsellMsgs,  setUpsellMsgs]  = useState<UpsellConfig>(DEFAULT_UPSELL);
  const [msgsSaved,   setMsgsSaved]   = useState(false);

  // Load saved messaging on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ADMIN_MSGS_KEY);
      if (raw) setUpsellMsgs({ ...DEFAULT_UPSELL, ...JSON.parse(raw) as Partial<UpsellConfig> });
    } catch { /* use defaults */ }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        // 1. Get current session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setStatus('unauthorized'); return; }

        setUserId(session.user.id);

        // 2. Server-side admin check — JWT verified, not localStorage
        const res = await fetch('/api/admin/check', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!res.ok && res.status !== 200) { setStatus('unauthorized'); return; }

        const { isAdmin } = await res.json() as { isAdmin: boolean };
        if (!isAdmin) { setStatus('unauthorized'); return; }

        setStatus('authorized');

        // 3. Load real purchase data from Supabase
        const dbPurchases = await getPurchases(session.user.id);
        setPurchases(dbPurchases);
      } catch {
        setStatus('error');
      }
    })();
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Verifying admin access…</p>
        </div>
      </div>
    );
  }

  // ── Unauthorized ─────────────────────────────────────────────────────────
  if (status === 'unauthorized' || status === 'error') {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
          <h2 style={{ marginBottom: 8, color: 'var(--text)' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            {status === 'error'
              ? 'An error occurred while verifying your access. Please try again.'
              : 'You do not have permission to view this page. Admin access is granted by a server-side administrator.'}
          </p>
          <button className="btn-primary" onClick={() => router.push('/dashboard')}>
            ← Back to Dashboard
          </button>
          {status === 'error' && (
            <button
              onClick={() => { setStatus('loading'); }}
              style={{ display: 'block', margin: '12px auto 0', background: 'none', border: 'none', color: 'var(--primary-text)', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Authorized Admin View ────────────────────────────────────────────────
  const subs    = purchases.filter((p) => p.purchaseType === 'subscription');
  const unlocks = purchases.filter((p) => p.purchaseType === 'course');
  const totalRev = purchases.reduce((s, p) => s + (p.amount ?? 0), 0);
  const recent   = [...purchases].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);

  const statCards = [
    { label: 'Total Revenue',   value: `₹${totalRev.toLocaleString()}`, color: '#28C76F' },
    { label: 'Pro Subscribers', value: String(subs.length),              color: '#FF9F43' },
    { label: 'Course Unlocks',  value: String(unlocks.length),           color: 'var(--primary)' },
    { label: 'Total Sales',     value: String(purchases.length),         color: '#00BAD1' },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">
            Sales and revenue overview
            {userId && (
              <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                · ID: {maskEmail(userId)}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ height: 36, borderRadius: 8, padding: '0 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontFamily: 'inherit' }}
          >
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Security notice */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, background: '#28C76F14', border: '1px solid #28C76F30', marginBottom: 24, fontSize: 13, color: '#1A6B3C' }}>
        <span>🔒</span>
        <span>Admin access verified via server-side JWT authentication. Showing your account data.</span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {statCards.map((s) => (
          <div key={s.label} className="info-card" style={{ margin: 0 }}>
            <div style={{ padding: '20px 20px 4px' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* User Tier Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="info-card">
          <div className="info-card-header">Purchase Type Breakdown</div>
          <div className="info-card-body">
            {[
              { label: 'Pro Subscriptions', count: subs.length,    color: '#FF9F43', pct: purchases.length ? Math.round((subs.length    / purchases.length) * 100) : 0 },
              { label: 'Course Unlocks',    count: unlocks.length, color: 'var(--primary)', pct: purchases.length ? Math.round((unlocks.length / purchases.length) * 100) : 0 },
            ].map((tier) => (
              <div key={tier.label} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>{tier.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: tier.color }}>{tier.count} ({tier.pct}%)</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'var(--border)' }}>
                  <div style={{ height: '100%', borderRadius: 4, background: tier.color, width: `${tier.pct}%`, transition: 'width 0.4s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Course unlock breakdown */}
        <div className="info-card">
          <div className="info-card-header">Course Unlock Breakdown</div>
          <div className="info-card-body">
            {quizzes.filter((q) => q.isPremium).map((quiz) => {
              const count = unlocks.filter((p) => p.courseId === quiz.id).length;
              return (
                <div key={quiz.id} className="info-row">
                  <span className="info-label" style={{ fontSize: 12 }}>{quiz.title.replace('CLF-C02: ', '')}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: count > 0 ? 'var(--primary)' : 'var(--text-secondary)' }}>
                    {count} · ₹{(count * (quiz.price ?? 0)).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Messaging & Upsell Copy Editor ─────────────────────────────────── */}
      <div className="info-card" style={{ marginBottom: 24 }}>
        <div className="info-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Upsell Messaging</span>
          <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-secondary)' }}>
            Shown to free users after {upsellMsgs.freeLimit} questions — edit to A/B test copy
          </span>
        </div>
        <div className="info-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Template variables reference */}
          <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <strong style={{ color: 'var(--text)' }}>Available variables:</strong>{' '}
            <code style={{ background: 'var(--border)', padding: '1px 5px', borderRadius: 3 }}>{'{n}'}</code> questions shown &nbsp;·&nbsp;
            <code style={{ background: 'var(--border)', padding: '1px 5px', borderRadius: 3 }}>{'{remaining}'}</code> locked &nbsp;·&nbsp;
            <code style={{ background: 'var(--border)', padding: '1px 5px', borderRadius: 3 }}>{'{score}'}</code> their % score &nbsp;·&nbsp;
            <code style={{ background: 'var(--border)', padding: '1px 5px', borderRadius: 3 }}>{'{total}'}</code> full quiz size &nbsp;·&nbsp;
            <code style={{ background: 'var(--border)', padding: '1px 5px', borderRadius: 3 }}>{'{price}'}</code> course price
          </div>

          {/* Free limit */}
          <div className="admin-field-row">
            <label className="admin-field-label">Free question limit</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="number"
                min={5}
                max={100}
                value={upsellMsgs.freeLimit}
                onChange={(e) => setUpsellMsgs((p) => ({ ...p, freeLimit: Number(e.target.value) }))}
                className="admin-field-input"
                style={{ width: 80 }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>questions (default 25)</span>
            </div>
          </div>

          {/* Headline */}
          <div className="admin-field-row">
            <label className="admin-field-label">Headline <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(the hook)</span></label>
            <input
              type="text"
              value={upsellMsgs.headline}
              onChange={(e) => setUpsellMsgs((p) => ({ ...p, headline: e.target.value }))}
              className="admin-field-input"
              placeholder="You've cracked {n}. The exam has {remaining} more waiting."
            />
          </div>

          {/* Subtext */}
          <div className="admin-field-row">
            <label className="admin-field-label">Body text <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(the push)</span></label>
            <textarea
              value={upsellMsgs.subtext}
              onChange={(e) => setUpsellMsgs((p) => ({ ...p, subtext: e.target.value }))}
              className="admin-field-input admin-field-textarea"
              rows={3}
            />
          </div>

          {/* Pro CTA */}
          <div className="admin-field-row">
            <label className="admin-field-label">Pro button label</label>
            <input
              type="text"
              value={upsellMsgs.proCtaLabel}
              onChange={(e) => setUpsellMsgs((p) => ({ ...p, proCtaLabel: e.target.value }))}
              className="admin-field-input"
            />
          </div>

          {/* Course CTA */}
          <div className="admin-field-row">
            <label className="admin-field-label">Course unlock button label</label>
            <input
              type="text"
              value={upsellMsgs.courseCtaLabel}
              onChange={(e) => setUpsellMsgs((p) => ({ ...p, courseCtaLabel: e.target.value }))}
              className="admin-field-input"
            />
          </div>

          {/* Skip CTA */}
          <div className="admin-field-row">
            <label className="admin-field-label">Skip / back link label</label>
            <input
              type="text"
              value={upsellMsgs.skipCtaLabel}
              onChange={(e) => setUpsellMsgs((p) => ({ ...p, skipCtaLabel: e.target.value }))}
              className="admin-field-input"
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              style={{ height: 38, padding: '0 20px', borderRadius: 8, background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              onClick={() => {
                localStorage.setItem(ADMIN_MSGS_KEY, JSON.stringify(upsellMsgs));
                setMsgsSaved(true);
                setTimeout(() => setMsgsSaved(false), 2500);
              }}
            >
              Save Messaging
            </button>
            <button
              style={{ height: 38, padding: '0 20px', borderRadius: 8, background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, border: '1.5px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit' }}
              onClick={() => {
                setUpsellMsgs(DEFAULT_UPSELL);
                localStorage.removeItem(ADMIN_MSGS_KEY);
                setMsgsSaved(false);
              }}
            >
              Reset to defaults
            </button>
            {msgsSaved && (
              <span style={{ fontSize: 13, color: '#28C76F', fontWeight: 600 }}>✓ Saved — live for all users</span>
            )}
          </div>
        </div>
      </div>

      {/* Recent Purchases table */}
      <div className="info-card">
        <div className="info-card-header">
          Recent Purchases
          <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 8 }}>
            Last {recent.length} transactions
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {recent.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
              No purchases recorded yet.
              <span style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
                Complete a purchase to see transaction data here.
              </span>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Item', 'Type', 'Amount', 'Date'].map((h) => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => {
                  const quiz      = p.courseId ? quizzes.find((q) => q.id === p.courseId) : null;
                  const itemLabel = p.purchaseType === 'subscription'
                    ? `Pro ${p.plan ?? 'annual'}`
                    : (quiz?.title ?? p.courseId ?? 'Course');
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 16px', color: 'var(--text)', fontWeight: 600 }}>{itemLabel}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                          background: p.purchaseType === 'subscription' ? '#FF9F4318' : 'var(--primary-light)',
                          color:      p.purchaseType === 'subscription' ? '#FF9F43'   : 'var(--primary-text)',
                        }}>
                          {p.purchaseType === 'subscription' ? 'Pro' : 'Course'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', fontWeight: 700, color: '#28C76F' }}>₹{p.amount.toLocaleString()}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>
                        {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

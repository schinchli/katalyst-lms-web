'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { CoinTransaction } from '@/types';

const REASON_LABEL: Record<string, string> = {
  quiz_complete: 'Quiz completed',
  perfect_score: 'Perfect score bonus',
  daily_bonus: 'Daily bonus',
  streak_bonus: 'Streak bonus',
  referral: 'Referral reward',
  contest_entry: 'Contest entry',
  contest_prize: 'Contest prize',
  course_unlock: 'Course unlock',
  purchase: 'Coin purchase',
};

function humanizeReason(reason: string): string {
  return REASON_LABEL[reason] ?? reason.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return iso; }
}

export default function CoinsPage() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { if (active) { setError('Please sign in to view your coins.'); setLoading(false); } return; }
        const res = await fetch('/api/coins', { headers: { Authorization: `Bearer ${session.access_token}` } });
        const body = await res.json() as { ok: boolean; balance?: number; transactions?: CoinTransaction[]; error?: string };
        if (!active) return;
        if (!res.ok || !body.ok) { setError(body.error ?? 'Failed to load coins.'); }
        else { setBalance(body.balance ?? 0); setTransactions(body.transactions ?? []); }
      } catch {
        if (active) setError('Failed to load coins.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <div>
      {/* Balance hero */}
      <div className="vx-card" style={{ marginBottom: 24, padding: '24px 26px', display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="vx-avatar vx-avatar-warning" style={{ fontSize: 26, width: 56, height: 56, borderRadius: 16 }}>🪙</div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Coin balance</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--text)', lineHeight: 1.1 }}>
              {loading ? '—' : balance.toLocaleString()}
            </div>
          </div>
        </div>
        <Link href="/dashboard/coin-store" className="btn-primary" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
          + Buy coins
        </Link>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 12px' }}>Transaction history</h2>

      {loading ? (
        <div className="vx-card" style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>
      ) : error ? (
        <div className="vx-card" style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>{error}</div>
      ) : transactions.length === 0 ? (
        <div className="vx-card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No coin activity yet. Complete quizzes and keep your streak to earn coins.
        </div>
      ) : (
        <div className="vx-card" style={{ padding: 0, overflow: 'hidden' }}>
          {transactions.map((tx, idx) => {
            const positive = tx.amount >= 0;
            return (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 20px', borderBottom: idx === transactions.length - 1 ? 'none' : '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div className={`vx-avatar-sm ${positive ? 'vx-avatar-success' : 'vx-avatar-error'}`} style={{ borderRadius: 9, fontSize: 14 }}>{positive ? '↑' : '↓'}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{humanizeReason(tx.reason)}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(tx.createdAt)}</div>
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: positive ? 'var(--success)' : 'var(--error)', whiteSpace: 'nowrap' }}>
                  {positive ? '+' : ''}{tx.amount.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

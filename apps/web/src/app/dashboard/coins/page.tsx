'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { CoinTransaction } from '@/types';

const COIN_REASON_LABELS: Record<string, string> = {
  quiz_complete:       'Quiz completed',
  perfect_score:       'Perfect score bonus',
  daily_quiz:          'Daily quiz bonus',
  streak_bonus:        'Streak bonus',
  referral_reward:     'Referral reward',
  referral_signup:     'Referral signup',
  coin_purchase:       'Coin purchase',
  contest_prize:       'Contest prize',
  admin_grant:         'Admin grant',
  spend_contest_entry: 'Contest entry',
  spend_course_unlock: 'Course unlock',
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

export default function CoinsPage() {
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [migrationNote, setMigrationNote] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.access_token) return;

      try {
        const res = await fetch('/api/coins', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const body = await res.json() as {
          ok: boolean;
          transactions?: CoinTransaction[];
          balance?: number;
          note?: string;
        };

        if (body.ok) {
          setTransactions(body.transactions ?? []);
          setBalance(body.balance ?? 0);
          if (body.note) setMigrationNote(body.note);
        }
      } catch {
        // non-fatal
      } finally {
        setLoading(false);
      }
    });
  }, []);

  return (
    <div className="page-content dc-shell">
      <section className="dc-hero" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <div style={{ fontSize: 38 }}>⚡</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700 }}>Coin Balance</h1>
            <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Your coin activity and transaction history</div>
          </div>
        </div>

        <div className="dc-card" style={{ display: 'inline-flex', alignItems: 'center', gap: 16, padding: '18px 28px' }}>
          <div style={{ fontSize: 36 }}>⚡</div>
          <div>
            <div style={{ fontSize: 42, fontWeight: 700, color: '#ffd84d', lineHeight: 1 }}>{balance.toLocaleString()}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Total coins</div>
          </div>
        </div>
      </section>

      {migrationNote && (
        <div className="dc-card" style={{ padding: '14px 18px', background: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 18 }}>ℹ️</span>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--primary-text)' }}>Full coin history coming soon</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
              Balance shown from your profile — detailed transaction log will appear after the next platform update.
            </div>
          </div>
        </div>
      )}

      <section className="dc-card" style={{ padding: 24 }}>
        <h2 className="dc-section-title" style={{ fontSize: 22, marginBottom: 18 }}>Transaction History</h2>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)', padding: '24px 0', textAlign: 'center' }}>Loading…</div>
        ) : transactions.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', padding: '32px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>⚡</div>
            <div>Your coin activity will appear here once you start earning coins.</div>
            <div style={{ marginTop: 6, fontSize: 13 }}>Complete quizzes and get a perfect score to earn your first coins!</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {transactions.map((tx) => {
              const isEarn = tx.amount >= 0;
              return (
                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: isEarn ? 'rgba(40,199,111,0.12)' : 'rgba(234,84,85,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    fontSize: 18,
                  }}>
                    {isEarn ? '⚡' : '💸'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
                      {COIN_REASON_LABELS[tx.reason] ?? tx.reason}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {formatDate(tx.createdAt)}
                    </div>
                  </div>
                  <div style={{
                    fontWeight: 700, fontSize: 16,
                    color: isEarn ? '#28C76F' : '#EA5455',
                  }}>
                    {isEarn ? '+' : ''}{tx.amount.toLocaleString()} ⚡
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

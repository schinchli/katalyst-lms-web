'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Contest, ContestStatus } from '@/types';

const TABS: ContestStatus[] = ['live', 'upcoming', 'past'];
const TAB_LABEL: Record<ContestStatus, string> = { live: 'Live', upcoming: 'Upcoming', past: 'Past' };
const STATUS_BADGE: Record<ContestStatus, string> = {
  live: 'vx-badge-success',
  upcoming: 'vx-badge-info',
  past: 'vx-badge-secondary',
};

function timeInfo(contest: Contest): string {
  const now = Date.now();
  const start = new Date(contest.startTime).getTime();
  const end = new Date(contest.endTime).getTime();
  const fmt = (ms: number) => {
    const mins = Math.round(ms / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.round(mins / 60);
    if (hrs < 48) return `${hrs}h`;
    return `${Math.round(hrs / 24)}d`;
  };
  if (contest.status === 'upcoming' && start > now) return `Starts in ${fmt(start - now)}`;
  if (contest.status === 'live' && end > now) return `Ends in ${fmt(end - now)}`;
  try { return new Date(contest.endTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
  catch { return ''; }
}

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ContestStatus>('live');

  useEffect(() => {
    let active = true;
    fetch('/api/contests')
      .then((r) => r.json() as Promise<{ ok: boolean; contests?: Contest[] }>)
      .then((b) => { if (active) setContests(b.contests ?? []); })
      .catch(() => { if (active) setContests([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const byTab = useMemo(() => contests.filter((c) => c.status === tab), [contests, tab]);
  const counts = useMemo(() => {
    const m: Record<ContestStatus, number> = { live: 0, upcoming: 0, past: 0 };
    contests.forEach((c) => { m[c.status] = (m[c.status] ?? 0) + 1; });
    return m;
  }, [contests]);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Contests</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>Compete on timed quizzes for coin prizes.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            style={{ padding: '6px 16px', borderRadius: 20, border: `1px solid ${tab === t ? 'var(--primary)' : 'var(--border)'}`, background: tab === t ? 'var(--primary)' : 'transparent', color: tab === t ? '#fff' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {TAB_LABEL[t]} ({counts[t]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="vx-card" style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>
      ) : byTab.length === 0 ? (
        <div className="vx-card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No {TAB_LABEL[tab].toLowerCase()} contests right now. Check back soon.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {byTab.map((c) => {
            const full = c.maxParticipants > 0 && c.participants >= c.maxParticipants;
            return (
              <div key={c.id} className="vx-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div className="vx-avatar-sm vx-avatar-primary" style={{ borderRadius: 10, fontSize: 22, flexShrink: 0 }}>{c.icon || '🏆'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{c.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                      <span className={`vx-badge ${STATUS_BADGE[c.status]}`} style={{ textTransform: 'capitalize' }}>{c.status}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{timeInfo(c)}</span>
                    </div>
                  </div>
                </div>

                {c.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{c.description}</p>}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="vx-badge vx-badge-warning">🪙 {c.entryFee} entry</span>
                  <span className="vx-badge vx-badge-success">🏆 {c.prizeCoins} prize</span>
                  <span className="vx-badge vx-badge-secondary">👥 {c.participants}{c.maxParticipants > 0 ? `/${c.maxParticipants}` : ''}</span>
                </div>

                {c.status === 'past' ? (
                  <div style={{ marginTop: 'auto', fontSize: 13, color: 'var(--text-secondary)' }}>
                    {c.winner ? <>Winner: <strong style={{ color: 'var(--text)' }}>{c.winner}</strong>{typeof c.topScore === 'number' ? ` · ${c.topScore}%` : ''}</> : 'Results pending'}
                  </div>
                ) : (
                  <Link
                    href={`/dashboard/quiz/${c.quizId}`}
                    className={full || c.status === 'upcoming' ? 'btn-secondary' : 'btn-primary'}
                    style={{ marginTop: 'auto', textAlign: 'center', textDecoration: 'none', pointerEvents: full ? 'none' : undefined, opacity: full ? 0.6 : 1 }}
                  >
                    {full ? 'Contest full' : c.status === 'upcoming' ? 'Preview quiz' : 'Enter contest'}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

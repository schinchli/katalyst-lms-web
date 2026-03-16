'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Contest, ContestStatus } from '@/types';

type Tab = ContestStatus;
const TABS: { key: Tab; label: string }[] = [
  { key: 'live',     label: 'Live' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past',     label: 'Past' },
];

const STATUS_COLOR: Record<ContestStatus, { bg: string; text: string; dot?: boolean }> = {
  live:     { bg: '#EA545518', text: '#EA5455', dot: true },
  upcoming: { bg: '#7367F018', text: '#7367F0' },
  past:     { bg: 'var(--bg)',  text: 'var(--text-secondary)' },
};

const CAT_COLORS: Record<string, string> = {
  bedrock: '#7367F0', rag: '#28C76F', agents: '#FF9F43', guardrails: '#EA5455',
  'prompt-eng': '#7367F0', routing: '#28C76F', security: '#EA5455',
  monitoring: '#FF9F43', orchestration: '#7367F0', evaluation: '#28C76F',
  cost: '#00CFE8', general: '#7367F0',
};

function useCountdown(endTime: string) {
  const calc = useCallback(
    () => Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000)),
    [endTime],
  );
  const [secs, setSecs] = useState(calc);
  useEffect(() => {
    setSecs(calc());
    const id = setInterval(() => setSecs(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function ContestCard({ contest }: { contest: Contest }) {
  const router = useRouter();
  const countdown = useCountdown(contest.endTime);
  const catColor  = CAT_COLORS[contest.category] ?? '#7367F0';
  const badge     = STATUS_COLOR[contest.status];

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
      overflow: 'hidden', boxShadow: 'var(--shadow)',
    }}>
      {/* Accent strip */}
      <div style={{ height: 4, background: catColor }} />

      <div style={{ padding: 20 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: catColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
            🏆
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 3 }}>{contest.title}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{contest.description}</div>
          </div>
          {/* Status badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: badge.bg, flexShrink: 0 }}>
            {badge.dot && <div style={{ width: 6, height: 6, borderRadius: 3, background: badge.text }} />}
            <span style={{ fontSize: 11, fontWeight: 700, color: badge.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {contest.status}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            ⚡ Fee: <strong style={{ color: 'var(--text)' }}>{contest.entryFee} coins</strong>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            🥇 Prize: <strong style={{ color: '#28C76F' }}>{contest.prizeCoins.toLocaleString()} coins</strong>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            👥 {contest.participants}/{contest.maxParticipants}
          </div>
        </div>

        {/* Timer / date row */}
        {contest.status === 'live' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: '#EA545508', border: '1px solid #EA545530', marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: '#EA5455', fontWeight: 600 }}>⏱ Ends in {countdown}</span>
          </div>
        )}
        {contest.status === 'upcoming' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--primary-light)', border: '1px solid var(--primary)30', marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: 'var(--primary-text)', fontWeight: 600 }}>📅 Starts {formatDate(contest.startTime)}</span>
          </div>
        )}
        {contest.status === 'past' && contest.winner && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: '#FF9F4318', border: '1px solid #FF9F4330', marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: '#FF9F43', fontWeight: 600 }}>🏅 Winner: {contest.winner} · {contest.topScore}%</span>
          </div>
        )}

        {/* Rules */}
        {contest.rules && (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14, padding: '8px 12px', background: 'var(--bg)', borderRadius: 8, borderLeft: `3px solid ${catColor}` }}>
            {contest.rules}
          </div>
        )}

        {/* CTA */}
        {contest.status !== 'past' ? (
          <button
            onClick={() => router.push(`/dashboard/quiz/${contest.quizId}`)}
            className="btn-primary"
            style={{ width: '100%', height: 44, borderRadius: 10, background: catColor, border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {contest.status === 'live' ? '▶ Enter Contest' : '🔔 Register Interest'}
          </button>
        ) : (
          <button
            onClick={() => router.push(`/dashboard/quiz/${contest.quizId}`)}
            style={{ width: '100%', height: 44, borderRadius: 10, background: 'var(--primary-light)', border: 'none', color: 'var(--primary-text)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            🔄 Practice Again
          </button>
        )}
      </div>
    </div>
  );
}

export default function ContestPage() {
  const [tab, setTab]           = useState<Tab>('live');
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const fetchedRef              = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetch('/api/contests')
      .then((r) => r.json())
      .then((d: { ok?: boolean; contests?: Contest[] }) => {
        if (d.ok && Array.isArray(d.contests)) setContests(d.contests);
        else setError('Could not load contests.');
      })
      .catch(() => setError('Could not load contests.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = contests.filter((c) => c.status === tab);

  return (
    <div className="page-content" style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(24px, 4vw, 36px)' }}>Contests</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 15 }}>
          Compete in timed quiz events. Win coins and climb the leaderboard.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, marginBottom: 24, width: 'fit-content' }}>
        {TABS.map((t) => {
          const count = contests.filter((c) => c.status === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                background: tab === t.key ? 'var(--primary)' : 'transparent',
                color:      tab === t.key ? '#fff' : 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {t.label}
              {count > 0 && (
                <span style={{
                  minWidth: 18, height: 18, borderRadius: 9, fontSize: 10, fontWeight: 700,
                  background: tab === t.key ? 'rgba(255,255,255,0.25)' : 'var(--primary-light)',
                  color: tab === t.key ? '#fff' : 'var(--primary-text)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Body */}
      {loading && (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40, fontSize: 14 }}>
          Loading contests…
        </div>
      )}
      {!loading && error && (
        <div style={{ color: '#FF4C51', textAlign: 'center', padding: 40, fontSize: 14 }}>{error}</div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
            {tab === 'live' ? 'No live contests right now' : tab === 'upcoming' ? 'No upcoming contests yet' : 'No past contests'}
          </div>
          <div style={{ fontSize: 13 }}>
            {tab === 'live' ? 'Check back soon — new contests are scheduled regularly.' : tab === 'upcoming' ? 'New contests are announced every week.' : 'Completed contests will appear here.'}
          </div>
        </div>
      )}
      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
          {filtered.map((c) => <ContestCard key={c.id} contest={c} />)}
        </div>
      )}
    </div>
  );
}

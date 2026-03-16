'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Contest, ContestStatus } from '@/types';

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function useCountdown(endTime: string) {
  const calc = () => Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000));
  const [secs, setSecs] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setSecs(calc()), 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endTime]);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const STATUS_COLORS: Record<ContestStatus, { accent: string; bg: string; label: string }> = {
  live:     { accent: '#EA5455', bg: '#EA545512', label: 'LIVE' },
  upcoming: { accent: '#7367F0', bg: '#7367F012', label: 'UPCOMING' },
  past:     { accent: 'var(--text-secondary)', bg: 'var(--bg)', label: 'ENDED' },
};

function ContestCard({ contest, onEnter }: { contest: Contest; onEnter: (quizId: string) => void }) {
  const countdown = useCountdown(contest.endTime);
  const sc = STATUS_COLORS[contest.status];
  const isFull = contest.participants >= contest.maxParticipants;
  const disabled = contest.status === 'past' || isFull;

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)',
      overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      {/* Accent bar */}
      <div style={{ height: 4, background: sc.accent }} />

      <div style={{ padding: 20 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: sc.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>
            🏆
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {contest.title}
              </h3>
              <span style={{
                padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                background: sc.bg, color: sc.accent, flexShrink: 0,
              }}>
                {sc.label}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {contest.description || contest.quizTitle}
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'Entry Fee', value: `${contest.entryFee} coins`, color: '#FF9F43' },
            { label: 'Prize', value: `${contest.prizeCoins.toLocaleString()} coins`, color: '#28C76F' },
            { label: 'Players', value: `${contest.participants}/${contest.maxParticipants}`, color: '#7367F0' },
          ].map((stat) => (
            <div key={stat.label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Time info */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
          borderRadius: 8, marginBottom: 14, fontSize: 12, fontWeight: 600,
          background: sc.bg, color: sc.accent,
        }}>
          <span>⏱</span>
          {contest.status === 'live' && <span>Ends in {countdown}</span>}
          {contest.status === 'upcoming' && <span>Starts {formatDateTime(contest.startTime)}</span>}
          {contest.status === 'past' && contest.winner && (
            <span>Winner: {contest.winner}{contest.topScore !== undefined ? ` · ${contest.topScore}%` : ''}</span>
          )}
          {contest.status === 'past' && !contest.winner && (
            <span>Ended {formatDateTime(contest.endTime)}</span>
          )}
        </div>

        {/* CTA */}
        <button
          disabled={disabled}
          onClick={() => !disabled && onEnter(contest.quizId)}
          style={{
            width: '100%', height: 40, borderRadius: 10, border: 'none',
            background: disabled ? 'var(--bg)' : sc.accent,
            color: disabled ? 'var(--text-secondary)' : '#fff',
            fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', transition: 'opacity 0.15s',
          }}
        >
          {contest.status === 'past' ? 'Practice Again' : isFull ? 'Contest Full' : 'Enter Contest'}
        </button>
      </div>
    </div>
  );
}

function EmptySection({ status }: { status: ContestStatus }) {
  const msgs: Record<ContestStatus, string> = {
    live: 'No live contests right now. Check back soon!',
    upcoming: 'No upcoming contests yet. New ones are added every week.',
    past: 'No past contests to show.',
  };
  return (
    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)', fontSize: 14 }}>
      {msgs[status]}
    </div>
  );
}

export default function ContestsPage() {
  const router = useRouter();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/contests')
      .then((r) => r.json())
      .then((d: { ok: boolean; contests?: Contest[] }) => {
        if (d.ok && d.contests) setContests(d.contests);
      })
      .catch(() => { /* show empty state */ })
      .finally(() => setLoading(false));
  }, []);

  const live     = contests.filter((c) => c.status === 'live');
  const upcoming = contests.filter((c) => c.status === 'upcoming');
  const past     = contests.filter((c) => c.status === 'past');

  const handleEnter = (quizId: string) => {
    router.push(`/dashboard/quiz/${quizId}`);
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 900, fontFamily: "'Public Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Contests</h1>
        {live.length > 0 && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 9px', borderRadius: 6,
            background: '#EA545518', color: '#EA5455', fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: '#EA5455', display: 'inline-block' }} />
            {live.length} LIVE
          </span>
        )}
      </div>
      <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--text-secondary)' }}>
        Compete with other learners and win coins
      </p>

      {loading && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)', fontSize: 14 }}>
          Loading contests…
        </div>
      )}

      {!loading && (
        <>
          {/* Live */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#EA5455', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: '#EA5455', display: 'inline-block' }} />
              Live Contests
            </h2>
            {live.length === 0
              ? <EmptySection status="live" />
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {live.map((c) => <ContestCard key={c.id} contest={c} onEnter={handleEnter} />)}
                </div>
            }
          </section>

          {/* Upcoming */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#7367F0', marginBottom: 14 }}>
              Upcoming Contests
            </h2>
            {upcoming.length === 0
              ? <EmptySection status="upcoming" />
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {upcoming.map((c) => <ContestCard key={c.id} contest={c} onEnter={handleEnter} />)}
                </div>
            }
          </section>

          {/* Past */}
          <section>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Past Contests
            </h2>
            {past.length === 0
              ? <EmptySection status="past" />
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {past.map((c) => <ContestCard key={c.id} contest={c} onEnter={handleEnter} />)}
                </div>
            }
          </section>
        </>
      )}

      <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
        Complete contests to earn bonus coins and climb the leaderboard.
      </p>
    </div>
  );
}

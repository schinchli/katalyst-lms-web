'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { LeaderboardEntry } from '@/types';
import type { QuizResult } from '@/types';
import { quizzes } from '@/data/quizzes';
import { getQuizResults } from '@/lib/db';
import { DEFAULT_SYSTEM_FEATURES, resolveDailyQuiz, type SystemFeaturesConfig } from '@/lib/systemFeatures';
import { useManagedQuizContentVersion } from '@/components/ManagedQuizContentProvider';

type Period = 'daily' | 'monthly' | 'alltime';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'daily',   label: 'Today'    },
  { key: 'monthly', label: 'Monthly'  },
  { key: 'alltime', label: 'All Time' },
];

const MEDAL_COLOR = ['#FFD700', '#C0C0C0', '#CD7F32'];
const MEDAL_EMOJI = ['🥇', '🥈', '🥉'];
const PODIUM_H    = [100, 80, 66];

function getLocalResults(): QuizResult[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('quiz-results') || '[]') as QuizResult[];
  } catch {
    return [];
  }
}

function isSameLocalDay(isoDate: string, reference = new Date()) {
  return new Date(isoDate).toDateString() === reference.toDateString();
}

export default function LeaderboardPage() {
  useManagedQuizContentVersion();
  const [period,  setPeriod]  = useState<Period>('alltime');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId,  setUserId]  = useState<string | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [systemFeatures, setSystemFeatures] = useState<SystemFeaturesConfig>(DEFAULT_SYSTEM_FEATURES);

  // Resolve current user
  useEffect(() => {
    setResults(getLocalResults());
    supabase.auth.getUser().then(async ({ data }) => {
      setUserId(data.user?.id ?? null);
      if (!data.user) return;
      const remoteResults = await getQuizResults(data.user.id);
      if (remoteResults.length > 0) setResults(remoteResults);
    });
    fetch('/api/system-features')
      .then((response) => response.json() as Promise<{ config?: SystemFeaturesConfig }>)
      .then((body) => setSystemFeatures(body.config ?? DEFAULT_SYSTEM_FEATURES))
      .catch(() => setSystemFeatures(DEFAULT_SYSTEM_FEATURES));
  }, []);

  // Fetch real leaderboard data whenever period changes
  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?period=${period}`)
      .then((r) => r.json())
      .then((d: { ok: boolean; entries?: LeaderboardEntry[] }) => {
        if (d.ok && d.entries) setEntries(d.entries);
        else setEntries([]);
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [period]);

  // Mark current user's row
  const taggedEntries = entries.map((e) => ({
    ...e,
    isCurrentUser: !!userId && e.userId === userId,
  }));

  const top3 = taggedEntries.slice(0, 3);
  const rest  = taggedEntries.slice(3);
  const dailyQuiz = resolveDailyQuiz(systemFeatures, quizzes.filter((quiz) => quiz.enabled !== false));
  const dailyQuizResult = dailyQuiz
    ? results.find((result) => result.quizId === dailyQuiz.id && isSameLocalDay(result.completedAt))
    : undefined;

  // Podium layout: 2nd place left, 1st centre, 3rd right
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean) as LeaderboardEntry[];

  return (
    <div style={{ padding: '24px 28px', maxWidth: 800, fontFamily: "'Public Sans', sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Leaderboard</h1>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 9px', borderRadius: 6,
          background: '#EA545518', color: '#EA5455', fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: '#EA5455', display: 'inline-block' }} />
          LIVE
        </span>
      </div>
      <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-secondary)' }}>
        Top performers across all tracks
      </p>

      {dailyQuiz ? (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap',
          padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', marginBottom: 20,
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--primary)' }}>
              {systemFeatures.dailyQuizLabel}
            </div>
            <div style={{ marginTop: 6, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{dailyQuiz.title}</div>
          </div>
          <span style={{
            padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
            background: dailyQuizResult ? 'rgba(81, 207, 102, 0.16)' : 'rgba(255, 216, 77, 0.16)',
            color: dailyQuizResult ? 'var(--platform-success-accent)' : '#ffd84d',
          }}>
            {dailyQuizResult ? `Your score: ${Math.round((dailyQuizResult.score / Math.max(1, dailyQuizResult.totalQuestions)) * 100)}%` : 'Complete it to boost your stats'}
          </span>
          <Link href={`/dashboard/quiz/${dailyQuiz.id}`} className="btn-primary" style={{ textDecoration: 'none' }}>
            {dailyQuizResult ? 'Review Daily Quiz' : 'Play Daily Quiz'}
          </Link>
        </div>
      ) : null}

      {/* ── Period tabs ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: 32 }}>
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            style={{
              padding: '10px 24px', border: 'none', background: 'transparent',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
              color: period === p.key ? '#7367F0' : 'var(--text-secondary)',
              borderBottom: `2px solid ${period === p.key ? '#7367F0' : 'transparent'}`,
              marginBottom: -2, transition: 'color 0.15s',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Loading / empty state ──────────────────────────────────────────── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)', fontSize: 14 }}>
          Loading leaderboard…
        </div>
      )}

      {!loading && taggedEntries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)', fontSize: 14 }}>
          No quiz results yet for this period. Complete a quiz to appear here!
        </div>
      )}

      {/* ── Podium — top 3 ─────────────────────────────────────────────────── */}
      {!loading && top3.length > 0 && (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
          gap: 12, marginBottom: 28, padding: '0 12px',
        }}>
          {podiumOrder.map((entry) => {
            const medal = MEDAL_COLOR[entry.rank - 1] ?? '#7367F0';
            const emoji = MEDAL_EMOJI[entry.rank - 1] ?? '🏅';
            const ph    = PODIUM_H[entry.rank - 1] ?? 66;
            const big   = entry.rank === 1;
            return (
              <div key={entry.userId} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {/* Avatar */}
                <div style={{
                  width: big ? 64 : 52, height: big ? 64 : 52, borderRadius: '50%',
                  border: `2px solid ${medal}`, background: medal + '22',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: big ? 22 : 18, fontWeight: 700, color: medal, marginBottom: 4,
                }}>
                  {entry.avatarInitial}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textAlign: 'center', lineHeight: 1.2 }}>
                  {entry.name}{entry.isCurrentUser ? ' (You)' : ''}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#7367F0' }}>
                  {entry.score.toLocaleString()} pts
                </div>
                {/* Podium block */}
                <div style={{
                  width: '100%', height: ph, borderRadius: 10, marginTop: 6,
                  background: medal + '18', border: `1px solid ${medal}40`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                  <span style={{ fontSize: 24 }}>{emoji}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: medal }}>#{entry.rank}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Rank list — 4th place onwards ──────────────────────────────────── */}
      {!loading && rest.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rest.map((entry) => (
          <div
            key={entry.userId}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              background: entry.isCurrentUser ? '#7367F018' : 'var(--surface)',
              border: `1px solid ${entry.isCurrentUser ? '#7367F040' : 'var(--border)'}`,
              borderRadius: 12, transition: 'background 0.1s',
            }}
          >
            {/* Rank number */}
            <span style={{
              width: 30, textAlign: 'center', fontSize: 13, fontWeight: 700,
              color: entry.isCurrentUser ? '#7367F0' : 'var(--text-secondary)', flexShrink: 0,
            }}>
              #{entry.rank}
            </span>

            {/* Avatar circle */}
            <div style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: entry.isCurrentUser ? '#7367F0' : '#7367F018',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700,
              color: entry.isCurrentUser ? '#fff' : '#7367F0',
            }}>
              {entry.avatarInitial}
            </div>

            {/* Name + sub */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                {entry.name}{entry.isCurrentUser ? ' (You)' : ''}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                {entry.quizzesCompleted} quizzes · {entry.streak}🔥 streak
              </div>
            </div>

            {/* Score + coins */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: entry.isCurrentUser ? '#7367F0' : 'var(--text)' }}>
                {entry.score.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                ⚡ {entry.coins.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>}

      {/* ── Footer note ────────────────────────────────────────────────────── */}
      <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
        Scores based on quiz points earned. Complete more quizzes to climb the rankings.
      </p>
    </div>
  );
}

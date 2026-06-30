'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { quizzes } from '@/data/quizzes';
import type { QuizResult } from '@/types';
import { supabase } from '@/lib/supabase';
import { getQuizResults } from '@/lib/db';
import { challengeTarget, cpuName } from '@/data/challenges';

const DIFFICULTIES = ['all', 'beginner', 'intermediate', 'advanced'] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

const DIFF_BADGE: Record<string, string> = {
  beginner: 'vx-badge-success',
  intermediate: 'vx-badge-warning',
  advanced: 'vx-badge-error',
};
const DIFF_COLOR: Record<string, string> = {
  beginner: 'var(--success)',
  intermediate: 'var(--warning)',
  advanced: 'var(--error)',
};

function getLocalResults(): QuizResult[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('quiz-results') || '[]') as QuizResult[]; }
  catch { return []; }
}

function pct(result: QuizResult): number {
  return result.totalQuestions > 0 ? Math.round((result.score / result.totalQuestions) * 100) : 0;
}

export default function SelfChallengePage() {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('all');

  useEffect(() => {
    setResults(getLocalResults());
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const remote = await getQuizResults(user.id);
      if (remote.length > 0) setResults(remote);
    });
  }, []);

  // Best (max) percentage per quiz across all attempts.
  const bestScores = useMemo(() => {
    const best: Record<string, number> = {};
    results.forEach((r) => {
      const p = pct(r);
      if (best[r.quizId] === undefined || p > best[r.quizId]) best[r.quizId] = p;
    });
    return best;
  }, [results]);

  const filtered = useMemo(
    () => quizzes.filter((q) => !q.isPremium && (difficulty === 'all' || q.difficulty === difficulty)),
    [difficulty],
  );

  const beaten = filtered.filter((q) => (bestScores[q.id] ?? 0) >= challengeTarget(q.id));
  const pending = filtered.filter((q) => (bestScores[q.id] ?? 0) < challengeTarget(q.id));

  const renderCard = (quiz: (typeof quizzes)[number]) => {
    const target = challengeTarget(quiz.id);
    const best = bestScores[quiz.id];
    const hasBest = best !== undefined;
    const isBeaten = hasBest && best >= target;
    const accent = DIFF_COLOR[quiz.difficulty] ?? 'var(--primary)';
    const href = hasBest
      ? `/dashboard/quiz/${quiz.id}?challenge=${best}`
      : `/dashboard/quiz/${quiz.id}`;

    return (
      <div key={quiz.id} className="vx-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 4, background: accent }} />
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div className="vx-avatar-sm vx-avatar-primary" style={{ borderRadius: 10, fontSize: 22, flexShrink: 0 }}>{quiz.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3, color: 'var(--text)' }}>{quiz.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <span className={`vx-badge ${DIFF_BADGE[quiz.difficulty] ?? 'vx-badge-secondary'}`} style={{ textTransform: 'capitalize' }}>{quiz.difficulty}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{quiz.questionCount}Q · {quiz.duration}min</span>
              </div>
            </div>
            {isBeaten && <span className="vx-badge vx-badge-success">✓ Beaten</span>}
          </div>

          {/* CPU vs You */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>🤖 {cpuName(quiz.id)}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--error)' }}>{target}%</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 1 }}>VS</div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>🧑 You</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: isBeaten ? 'var(--success)' : 'var(--primary)' }}>{hasBest ? `${best}%` : '—'}</div>
            </div>
          </div>

          <Link
            href={href}
            className={isBeaten ? 'btn-secondary' : 'btn-primary'}
            style={{ marginTop: 'auto', textAlign: 'center', textDecoration: 'none' }}
          >
            {isBeaten ? '↻ Beat Your Score' : '⚡ Accept Challenge'}
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="vx-card" style={{ marginBottom: 24, padding: '18px 22px', display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Challenge Arena</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>Beat the CPU&apos;s target score on each quiz to win.</p>
        </div>
        <span className="vx-badge vx-badge-success" style={{ fontSize: 13 }}>{beaten.length}/{filtered.length} beaten</span>
      </div>

      {/* Difficulty filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDifficulty(d)}
            style={{ padding: '5px 14px', borderRadius: 20, border: `1px solid ${difficulty === d ? 'var(--primary)' : 'var(--border)'}`, background: difficulty === d ? 'var(--primary)' : 'transparent', color: difficulty === d ? '#fff' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize' }}
          >
            {d === 'all' ? 'All' : d}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="vx-card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No challenges found for this difficulty.
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 12px' }}>Challenges ({pending.length})</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginBottom: 28 }}>
                {pending.map(renderCard)}
              </div>
            </>
          )}
          {beaten.length > 0 && (
            <>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 12px' }}>Already Beaten ✓ ({beaten.length})</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {beaten.map(renderCard)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

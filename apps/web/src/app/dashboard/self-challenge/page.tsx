'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { quizzes } from '@/data/quizzes';
import type { QuizResult } from '@/types';
import { useManagedQuizContentVersion } from '@/components/ManagedQuizContentProvider';

interface QuizSummary {
  quizId: string;
  title: string;
  attempts: number;
  bestScore: number;      // percentage 0–100
  lastAttempt: string;    // ISO completedAt
}

function getLocalResults(): QuizResult[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('quiz-results') || '[]') as QuizResult[];
  } catch {
    return [];
  }
}

function buildSummaries(results: QuizResult[]): QuizSummary[] {
  const map = new Map<string, QuizSummary>();
  for (const r of results) {
    const pct = r.totalQuestions > 0 ? Math.round((r.score / r.totalQuestions) * 100) : 0;
    const existing = map.get(r.quizId);
    if (existing) {
      existing.attempts += 1;
      if (pct > existing.bestScore) existing.bestScore = pct;
      if (r.completedAt > existing.lastAttempt) existing.lastAttempt = r.completedAt;
    } else {
      const quiz = quizzes.find((q) => q.id === r.quizId);
      map.set(r.quizId, {
        quizId: r.quizId,
        title: quiz?.title ?? r.quizId,
        attempts: 1,
        bestScore: pct,
        lastAttempt: r.completedAt,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    new Date(b.lastAttempt).getTime() - new Date(a.lastAttempt).getTime(),
  );
}

function ScoreRing({ pct }: { pct: number }) {
  const color = pct >= 70 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--error)';
  return (
    <div style={{
      width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
      border: `3px solid ${color}`, background: color + '12',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: 14, fontWeight: 700, color, lineHeight: 1 }}>{pct}%</span>
      <span style={{ fontSize: 9, color, letterSpacing: 0.3, fontWeight: 600 }}>BEST</span>
    </div>
  );
}

export default function SelfChallengePage() {
  const router = useRouter();
  const quizContentVersion = useManagedQuizContentVersion();
  const [summaries, setSummaries] = useState<QuizSummary[]>([]);

  useEffect(() => {
    setSummaries(buildSummaries(getLocalResults()));
  }, [quizContentVersion]);

  const handleBeatBest = (summary: QuizSummary) => {
    router.push(`/dashboard/quiz/${summary.quizId}?challenge=${summary.bestScore}`);
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 800, fontFamily: "'Public Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Self Challenge</h1>
      </div>
      <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--text-secondary)' }}>
        Compete against your own best scores
      </p>

      {summaries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🎯</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            No quiz history yet. Complete a quiz to start tracking your best scores.
          </p>
          <button
            onClick={() => router.push('/dashboard/quizzes')}
            className="btn-primary"
            style={{ marginTop: 16 }}
          >
            Browse Quizzes
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {summaries.map((summary) => (
            <div key={summary.quizId} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '16px 20px', background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 14,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              <ScoreRing pct={summary.bestScore} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                  {summary.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {summary.attempts} attempt{summary.attempts !== 1 ? 's' : ''} · Last played {new Date(summary.lastAttempt).toLocaleDateString()}
                </div>
              </div>

              <button
                onClick={() => handleBeatBest(summary)}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none',
                  background: '#7367F0', color: '#fff',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                Beat {summary.bestScore}%
              </button>
            </div>
          ))}
        </div>
      )}

      <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
        Scores are based on your local quiz history. Sign in to sync across devices.
      </p>
    </div>
  );
}

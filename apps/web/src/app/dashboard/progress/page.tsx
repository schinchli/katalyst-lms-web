'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { quizzes } from '@/data/quizzes';
import type { QuizResult } from '@/types';
import { supabase } from '@/lib/supabase';
import { getQuizResults } from '@/lib/db';
import { usePlatformExperience } from '@/components/PlatformExperienceProvider';
import { DEFAULT_SYSTEM_FEATURES, resolveDailyQuiz, type SystemFeaturesConfig } from '@/lib/systemFeatures';

function getLocalResults(): QuizResult[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('quiz-results') || '[]') as QuizResult[];
  } catch {
    return [];
  }
}

function percentage(item: QuizResult) {
  return Math.round((item.score / item.totalQuestions) * 100);
}

function isSameLocalDay(isoDate: string, reference = new Date()) {
  return new Date(isoDate).toDateString() === reference.toDateString();
}

export default function ProgressPage() {
  const { config } = usePlatformExperience();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [systemFeatures, setSystemFeatures] = useState<SystemFeaturesConfig>(DEFAULT_SYSTEM_FEATURES);

  useEffect(() => {
    setResults(getLocalResults());
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const remote = await getQuizResults(user.id);
      if (remote.length > 0) setResults(remote);
    });
    fetch('/api/system-features')
      .then((response) => response.json() as Promise<{ config?: SystemFeaturesConfig }>)
      .then((body) => setSystemFeatures(body.config ?? DEFAULT_SYSTEM_FEATURES))
      .catch(() => setSystemFeatures(DEFAULT_SYSTEM_FEATURES));
  }, []);

  const completed = useMemo(() => new Set(results.map((item) => item.quizId)), [results]);
  const completion = quizzes.length ? Math.round((completed.size / quizzes.length) * 100) : 0;
  const average = results.length ? Math.round(results.reduce((sum, item) => sum + percentage(item), 0) / results.length) : 0;
  const best = results.length ? Math.max(...results.map(percentage)) : 0;
  const xp = results.reduce((sum, item) => sum + percentage(item), 0);
  const streak = Math.min(30, results.length);
  const dailyQuiz = useMemo(() => resolveDailyQuiz(systemFeatures, quizzes), [systemFeatures]);
  const dailyQuizResult = useMemo(
    () => (dailyQuiz ? results.find((result) => result.quizId === dailyQuiz.id && isSameLocalDay(result.completedAt)) ?? null : null),
    [dailyQuiz, results],
  );

  return (
    <div className="page-content dc-shell">
      <section className="dc-hero" style={{ padding: 30 }}>
        <span className="dc-chip">Growth</span>
        <h1 style={{ margin: '18px 0 12px', fontSize: 'clamp(34px, 4.5vw, 54px)', lineHeight: 1.03 }}>{config.copy.progressTitle}</h1>
        <p style={{ margin: 0, maxWidth: 760, color: 'var(--text-secondary)', fontSize: 17, lineHeight: 1.8 }}>
          {config.copy.progressSubtitle}
        </p>
        <div className="dc-kpi-grid" style={{ marginTop: 24 }}>
          {[
            { label: 'Completion', value: `${completion}%`, tone: 'var(--primary)' },
            { label: 'Average score', value: `${average}%`, tone: '#ffd84d' },
            { label: 'Best score', value: `${best}%`, tone: 'var(--platform-success-accent)' },
            { label: 'XP earned', value: `${xp}`, tone: 'var(--platform-premium-accent)' },
          ].map((item) => (
            <div key={item.label} className="dc-card" style={{ padding: 20 }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{item.label}</div>
              <div style={{ marginTop: 10, fontSize: 34, fontWeight: 700, color: item.tone }}>{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="dc-grid" style={{ gridTemplateColumns: '0.9fr 1.1fr' }}>
        <div className="dc-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start' }}>
            <div>
              <h2 className="dc-section-title" style={{ fontSize: 30 }}>Streaks</h2>
              <p className="dc-section-subtitle">Build habit loops with a clearer weekly view inspired by the mobile growth screens.</p>
            </div>
            <span className="dc-chip">{streak} days</span>
          </div>
          <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
            {Array.from({ length: 7 }, (_, index) => (
              <div key={index} style={{ padding: '16px 0', borderRadius: 18, border: index < Math.min(streak, 7) ? '1px solid rgba(255,216,77,0.45)' : '1px solid var(--border)', background: index < Math.min(streak, 7) ? 'rgba(255,216,77,0.12)' : 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-secondary)', marginBottom: 10 }}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</div>
                <div style={{ fontSize: 24 }}>{index < Math.min(streak, 7) ? '⚡' : '·'}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="dc-card" style={{ padding: 24 }}>
          {dailyQuiz ? (
            <div style={{ marginBottom: 18, padding: 16, borderRadius: 18, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--primary)' }}>
                    {systemFeatures.dailyQuizLabel}
                  </div>
                  <div style={{ marginTop: 8, fontWeight: 700, color: 'var(--text)' }}>{dailyQuiz.title}</div>
                </div>
                <span className="dc-chip" style={{ background: dailyQuizResult ? 'rgba(81, 207, 102, 0.16)' : 'rgba(255, 216, 77, 0.16)', color: dailyQuizResult ? 'var(--platform-success-accent)' : '#ffd84d' }}>
                  {dailyQuizResult ? `${percentage(dailyQuizResult)}% today` : 'Pending today'}
                </span>
              </div>
              <div style={{ marginTop: 12 }}>
                <Link
                  href={`/dashboard/quiz/${dailyQuiz.id}`}
                  className="btn-primary"
                  style={{ display: 'inline-flex', textDecoration: 'none' }}
                >
                  {dailyQuizResult ? 'Review Daily Quiz' : 'Open Daily Quiz'}
                </Link>
              </div>
            </div>
          ) : null}
          <h2 className="dc-section-title" style={{ fontSize: 30 }}>Recent results</h2>
          <p className="dc-section-subtitle">A more polished history panel with pass/fail tones and immediate context.</p>
          <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
            {results.length === 0 && (
              <div style={{ color: 'var(--text-secondary)' }}>
                No quiz history yet. <Link href="/dashboard/quizzes" style={{ color: 'var(--primary-text)', fontWeight: 700 }}>Start a course</Link>
              </div>
            )}
            {results.slice().reverse().map((result) => {
              const quiz = quizzes.find((item) => item.id === result.quizId);
              const pct = percentage(result);
              const isDailyQuizAttempt = dailyQuiz?.id === result.quizId && isSameLocalDay(result.completedAt);
              return (
                <div key={`${result.quizId}-${result.completedAt}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', padding: 16, borderRadius: 18, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text)' }}>{quiz?.title ?? result.quizId}</div>
                      {isDailyQuizAttempt ? (
                        <span className="dc-chip" style={{ background: 'rgba(255,216,77,0.16)', color: '#ffd84d' }}>
                          {systemFeatures.dailyQuizLabel}
                        </span>
                      ) : null}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
                      {result.score}/{result.totalQuestions} · {new Date(result.completedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: pct >= 70 ? 'var(--platform-success-accent)' : 'var(--platform-danger-accent)', fontSize: 20 }}>{pct}%</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{pct >= 70 ? 'Passed' : 'Keep practicing'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

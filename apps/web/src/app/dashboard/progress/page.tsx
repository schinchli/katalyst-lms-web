'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { quizzes } from '@/data/quizzes';
import type { CoinTransaction, QuizResult } from '@/types';
import { supabase } from '@/lib/supabase';
import { getQuizResults } from '@/lib/db';
import { usePlatformExperience } from '@/components/PlatformExperienceProvider';
import { useManagedQuizContentVersion } from '@/components/ManagedQuizContentProvider';
import { DEFAULT_SYSTEM_FEATURES, resolveDailyQuiz, type SystemFeaturesConfig } from '@/lib/systemFeatures';

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

const DAY_ABBREV = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function computeStreakData(results: QuizResult[]): { streak: number; activeDays: { label: string; active: boolean }[] } {
  const today = new Date();
  const doneDates = new Set(results.map((r) => new Date(r.completedAt).toDateString()));

  let streak = 0;
  for (let i = 0; i < 366; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (doneDates.has(d.toDateString())) {
      streak++;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }

  const activeDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return { label: DAY_ABBREV[d.getDay()], active: doneDates.has(d.toDateString()) };
  });

  return { streak, activeDays };
}

export default function ProgressPage() {
  useManagedQuizContentVersion();
  const { config } = usePlatformExperience();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [systemFeatures, setSystemFeatures] = useState<SystemFeaturesConfig>(DEFAULT_SYSTEM_FEATURES);
  const [coinBalance, setCoinBalance] = useState<number | null>(null);
  const [recentTx, setRecentTx] = useState<CoinTransaction[]>([]);

  useEffect(() => {
    setResults(getLocalResults());
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;
      const user = session.user;
      const remote = await getQuizResults(user.id);
      if (remote.length > 0) setResults(remote);

      // Fetch coin balance + recent transactions
      try {
        const res = await fetch('/api/coins', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const body = await res.json() as { ok: boolean; balance?: number; transactions?: CoinTransaction[] };
        if (body.ok) {
          setCoinBalance(body.balance ?? 0);
          setRecentTx((body.transactions ?? []).slice(0, 5));
        }
      } catch { /* best-effort */ }
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
  const { streak, activeDays } = useMemo(() => computeStreakData(results), [results]);
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
          {coinBalance !== null && (
            <div className="dc-card" style={{ padding: 20 }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Coin Balance</div>
              <div style={{ marginTop: 10, fontSize: 34, fontWeight: 700, color: '#ffd84d' }}>
                ⚡ {coinBalance.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </section>

      {recentTx.length > 0 && (
        <section className="dc-card" style={{ padding: 24 }}>
          <h2 className="dc-section-title" style={{ fontSize: 20, marginBottom: 14 }}>
            Recent Coin Activity
            <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 400, color: 'var(--text-secondary)' }}>
              <a href="/dashboard/coins" style={{ color: 'var(--primary-text)', textDecoration: 'none', fontWeight: 600 }}>View all →</a>
            </span>
          </h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {recentTx.map((tx) => {
              const isEarn = tx.amount >= 0;
              return (
                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: isEarn ? 'rgba(40,199,111,0.12)' : 'rgba(234,84,85,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 16 }}>{isEarn ? '⚡' : '💸'}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                      {COIN_REASON_LABELS[tx.reason] ?? tx.reason}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: isEarn ? '#28C76F' : '#EA5455' }}>
                    {isEarn ? '+' : ''}{tx.amount.toLocaleString()} ⚡
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

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
            {activeDays.map((day, index) => (
              <div key={index} style={{ padding: '16px 0', borderRadius: 18, border: day.active ? '1px solid rgba(255,216,77,0.45)' : '1px solid var(--border)', background: day.active ? 'rgba(255,216,77,0.12)' : 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-secondary)', marginBottom: 10 }}>{day.label}</div>
                <div style={{ fontSize: 24 }}>{day.active ? '⚡' : '·'}</div>
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
              const quizMode = quiz?.mode;
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
                      {quizMode === 'true_false' ? (
                        <span className="dc-chip" style={{ background: 'rgba(115,103,240,0.12)', color: 'var(--primary-text)', fontSize: 11 }}>
                          T/F
                        </span>
                      ) : quizMode === 'exam' ? (
                        <span className="dc-chip" style={{ background: 'rgba(255,76,81,0.12)', color: '#FF4C51', fontSize: 11 }}>
                          EXAM
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

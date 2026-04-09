'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { quizzes } from '@/data/quizzes';
import { useSubscription } from '@/hooks/useSubscription';
import type { QuizResult } from '@/types';
import { supabase } from '@/lib/supabase';
import { getQuizResults } from '@/lib/db';
import { DEFAULT_SYSTEM_FEATURES, resolveDailyQuiz, type SystemFeaturesConfig } from '@/lib/systemFeatures';
import { DailyQuizBadge } from '@/components/DailyQuizBadge';
import { useManagedQuizContentVersion } from '@/components/ManagedQuizContentProvider';

function getLocalResults(): QuizResult[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('quiz-results') || '[]') as QuizResult[]; }
  catch { return []; }
}

function score(result?: QuizResult) {
  return result ? Math.round((result.score / result.totalQuestions) * 100) : 0;
}

function isSameLocalDay(isoDate: string, reference = new Date()) {
  return new Date(isoDate).toDateString() === reference.toDateString();
}

const DIFFICULTIES = ['all', 'beginner', 'intermediate', 'advanced'] as const;
const DIFF_BADGE: Record<string, string> = {
  beginner: 'vx-badge-success',
  intermediate: 'vx-badge-warning',
  advanced: 'vx-badge-error',
};

export default function QuizzesPage() {
  const quizContentVersion = useManagedQuizContentVersion();
  const { canAccess } = useSubscription();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [systemFeatures, setSystemFeatures] = useState<SystemFeaturesConfig>(DEFAULT_SYSTEM_FEATURES);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>('all');
  const [premiumOnly, setPremiumOnly] = useState<'all' | 'free' | 'premium'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    setResults(getLocalResults());
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const remoteResults = await getQuizResults(user.id);
      if (remoteResults.length > 0) setResults(remoteResults);
    });
    fetch('/api/system-features')
      .then((r) => r.json() as Promise<{ config?: SystemFeaturesConfig }>)
      .then((b) => setSystemFeatures(b.config ?? DEFAULT_SYSTEM_FEATURES))
      .catch(() => setSystemFeatures(DEFAULT_SYSTEM_FEATURES));
  }, []);

  const filtered = useMemo(() => {
    return quizzes.filter((quiz) => {
      if (quiz.enabled === false) return false;
      if (difficulty !== 'all' && quiz.difficulty !== difficulty) return false;
      if (premiumOnly === 'free' && quiz.isPremium) return false;
      if (premiumOnly === 'premium' && !quiz.isPremium) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return [quiz.title, quiz.description, quiz.examCode, quiz.category]
          .filter(Boolean).some((f) => String(f).toLowerCase().includes(q));
      }
      return true;
    });
  }, [difficulty, premiumOnly, quizContentVersion, search]);

  const dailyQuiz = useMemo(() => resolveDailyQuiz(systemFeatures, quizzes), [systemFeatures, quizContentVersion]);
  const dailyQuizCompleted = useMemo(
    () => (dailyQuiz ? results.some((r) => r.quizId === dailyQuiz.id && isSameLocalDay(r.completedAt)) : false),
    [dailyQuiz, results],
  );
  const dailyQuizFilteredOut = Boolean(dailyQuiz && !filtered.some((q) => q.id === dailyQuiz.id));

  return (
    <div className="page-content">
      {/* ── Page Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 22, color: 'var(--text)' }}>Course Library</h4>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
          {filtered.length} of {quizzes.length} courses visible
        </p>
      </div>

      {/* ── Filter Bar ── */}
      <div className="vx-card" style={{ marginBottom: 24, padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', background: 'var(--bg)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)', flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses, tracks, or exam codes"
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: 'var(--text)', width: '100%', fontFamily: 'inherit' }}
            />
          </div>

          {/* Difficulty filter */}
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
            style={{ height: 40, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', padding: '0 14px', font: 'inherit', fontSize: 14, cursor: 'pointer' }}>
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{d === 'all' ? 'All Levels' : d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
          </select>

          {/* Premium filter */}
          <select value={premiumOnly} onChange={(e) => setPremiumOnly(e.target.value as typeof premiumOnly)}
            style={{ height: 40, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', padding: '0 14px', font: 'inherit', fontSize: 14, cursor: 'pointer' }}>
            <option value="all">All Access</option>
            <option value="free">Free Only</option>
            <option value="premium">Premium Only</option>
          </select>

          {/* View toggle */}
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {(['grid', 'list'] as const).map((mode) => (
              <button key={mode} type="button" onClick={() => setViewMode(mode)}
                style={{ width: 36, height: 36, borderRadius: 7, border: '1px solid var(--border)', background: viewMode === mode ? 'var(--primary-light)' : 'var(--bg)', color: viewMode === mode ? 'var(--primary)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                {mode === 'grid'
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                }
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty pills */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {DIFFICULTIES.map((d) => (
            <button key={d} type="button" onClick={() => setDifficulty(d)}
              style={{ padding: '5px 14px', borderRadius: 20, border: `1px solid ${difficulty === d ? 'var(--primary)' : 'var(--border)'}`, background: difficulty === d ? 'var(--primary)' : 'transparent', color: difficulty === d ? '#fff' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
              {d === 'all' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Daily quiz pinned if filtered out */}
      {dailyQuiz && dailyQuizFilteredOut && (
        <div className="vx-card" style={{ marginBottom: 24, padding: '18px 22px', display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <span className="vx-badge vx-badge-warning">{systemFeatures.dailyQuizLabel}</span>
              <span className="vx-badge vx-badge-secondary">Pinned above filters</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{dailyQuiz.title}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Your filter hides today&apos;s featured quiz — accessible here.</div>
          </div>
          <Link href={`/dashboard/quiz/${dailyQuiz.id}`} className="btn-primary" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
            {dailyQuizCompleted ? 'Review Daily Quiz' : 'Play Daily Quiz'}
          </Link>
        </div>
      )}

      {/* ── Course Grid / List ── */}
      {filtered.length === 0 ? (
        <div className="vx-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h5 style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--text)' }}>No courses found</h5>
          <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 14 }}>Try adjusting your search or filters.</p>
          <button type="button" onClick={() => { setSearch(''); setDifficulty('all'); setPremiumOnly('all'); }}
            style={{ padding: '10px 20px', borderRadius: 8, background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
            Reset filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {filtered.map((quiz, idx) => {
            const result = results.find((r) => r.quizId === quiz.id);
            const progress = score(result);
            const unlocked = canAccess(quiz.id);
            const isDailyQuiz = dailyQuiz?.id === quiz.id;

            return (
              <Link key={quiz.id} href={`/dashboard/quiz/${quiz.id}`}
                style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
                className="quiz-card">
                {/* Card header with icon */}
                <div style={{ padding: '20px 20px 14px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span className={`vx-badge ${DIFF_BADGE[quiz.difficulty] ?? 'vx-badge-secondary'}`}>{quiz.difficulty}</span>
                      {quiz.isPremium && <span className="vx-badge vx-badge-warning">Premium</span>}
                      {isDailyQuiz && <DailyQuizBadge label={systemFeatures.dailyQuizLabel} completed={dailyQuizCompleted} compact />}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{quiz.duration} min</span>
                  </div>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>{quiz.icon}</div>
                  <h6 style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 15, color: 'var(--text)', lineHeight: 1.4 }}>{quiz.title}</h6>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{quiz.description}</p>
                </div>
                {/* Card footer */}
                <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span>{quiz.questionCount} questions</span>
                    <span>{unlocked ? (progress ? `${progress}%` : 'Free') : `₹${quiz.price ?? 0}`}</span>
                  </div>
                  {progress > 0 && (
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progress}%`, background: 'var(--primary)', borderRadius: 2 }} />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW — Vuexy list card pattern */
        <div className="vx-card">
          {/* Table header */}
          <div style={{ padding: '12px 22px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 100px 80px 120px', gap: 12, alignItems: 'center' }}>
            {['Course', 'Level', 'Duration', 'Progress'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-secondary)' }}>{h}</span>
            ))}
          </div>
          {filtered.map((quiz) => {
            const result = results.find((r) => r.quizId === quiz.id);
            const progress = score(result);
            const unlocked = canAccess(quiz.id);
            const isDailyQuiz = dailyQuiz?.id === quiz.id;

            return (
              <Link key={quiz.id} href={`/dashboard/quiz/${quiz.id}`}
                style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 120px', gap: 12, alignItems: 'center', padding: '14px 22px', borderBottom: '1px solid var(--border)', textDecoration: 'none', transition: 'background 0.12s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                {/* Course name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div className="vx-avatar-sm vx-avatar-primary" style={{ borderRadius: 6, fontSize: 18, flexShrink: 0 }}>{quiz.icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {quiz.title}
                      {isDailyQuiz && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--warning)', fontWeight: 700 }}>{systemFeatures.dailyQuizLabel}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{quiz.questionCount} questions</div>
                  </div>
                </div>
                {/* Level */}
                <span className={`vx-badge ${DIFF_BADGE[quiz.difficulty] ?? 'vx-badge-secondary'}`}>{quiz.difficulty}</span>
                {/* Duration */}
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{quiz.duration} min</span>
                {/* Progress */}
                <div>
                  {progress > 0 ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{unlocked ? 'Score' : 'Locked'}</span>
                        <span style={{ fontWeight: 600, color: progress >= 70 ? '#28C76F' : 'var(--text)' }}>{progress}%</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: progress >= 70 ? '#28C76F' : 'var(--primary)', borderRadius: 2 }} />
                      </div>
                    </div>
                  ) : (
                    <span className={`vx-badge ${quiz.isPremium ? 'vx-badge-warning' : 'vx-badge-secondary'}`}>
                      {quiz.isPremium ? (unlocked ? 'Unlocked' : `₹${quiz.price ?? 0}`) : 'Free'}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

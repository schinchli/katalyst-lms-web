'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { quizzes } from '@/data/quizzes';
import { useSubscription } from '@/hooks/useSubscription';
import type { QuizResult } from '@/types';
import { supabase } from '@/lib/supabase';
import { getQuizResults } from '@/lib/db';
import { usePlatformExperience } from '@/components/PlatformExperienceProvider';
import { useManagedQuizContentVersion } from '@/components/ManagedQuizContentProvider';
import { DEFAULT_SYSTEM_FEATURES, resolveDailyQuiz, type SystemFeaturesConfig } from '@/lib/systemFeatures';

function getLocalResults(): QuizResult[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('quiz-results') || '[]') as QuizResult[];
  } catch {
    return [];
  }
}

function score(result?: QuizResult) {
  return result ? Math.round((result.score / result.totalQuestions) * 100) : 0;
}

function isSameLocalDay(isoDate: string, reference = new Date()) {
  return new Date(isoDate).toDateString() === reference.toDateString();
}

const DIFFICULTIES = ['all', 'beginner', 'intermediate', 'advanced'] as const;

export default function QuizzesPage() {
  const quizContentVersion = useManagedQuizContentVersion();
  const { config } = usePlatformExperience();
  const { canAccess } = useSubscription();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [systemFeatures, setSystemFeatures] = useState<SystemFeaturesConfig>(DEFAULT_SYSTEM_FEATURES);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>('all');
  const [premiumOnly, setPremiumOnly] = useState<'all' | 'free' | 'premium'>('all');

  useEffect(() => {
    setResults(getLocalResults());
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const remoteResults = await getQuizResults(user.id);
      if (remoteResults.length > 0) {
        setResults(remoteResults);
      }
    });
    fetch('/api/system-features')
      .then((response) => response.json() as Promise<{ config?: SystemFeaturesConfig }>)
      .then((body) => setSystemFeatures(body.config ?? DEFAULT_SYSTEM_FEATURES))
      .catch(() => setSystemFeatures(DEFAULT_SYSTEM_FEATURES));
  }, []);

  const filtered = useMemo(() => {
    return quizzes.filter((quiz) => {
      if (difficulty !== 'all' && quiz.difficulty !== difficulty) return false;
      if (premiumOnly === 'free' && quiz.isPremium) return false;
      if (premiumOnly === 'premium' && !quiz.isPremium) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return [quiz.title, quiz.description, quiz.examCode, quiz.category].filter(Boolean).some((field) => String(field).toLowerCase().includes(q));
      }
      return true;
    });
  }, [difficulty, premiumOnly, quizContentVersion, search]);

  const featured = filtered.slice(0, Math.max(4, config.layout.featuredCourseCount));
  const popular = filtered.slice(0, config.layout.popularCourseCount);
  const practice = filtered.filter((quiz) => !quiz.isPremium).slice(0, config.layout.practiceCourseCount);
  const dailyQuiz = useMemo(() => resolveDailyQuiz(systemFeatures, quizzes), [systemFeatures, quizContentVersion]);
  const dailyQuizCompleted = useMemo(
    () => (dailyQuiz ? results.some((entry) => entry.quizId === dailyQuiz.id && isSameLocalDay(entry.completedAt)) : false),
    [dailyQuiz, results],
  );

  return (
    <div className="page-content dc-shell">
      <section className="dc-hero" style={{ padding: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 22, flexWrap: 'wrap' }}>
          <div>
            <span className="dc-chip">{config.copy.quizzesTitle}</span>
            <h1 style={{ margin: '18px 0 12px', fontSize: 'clamp(34px, 4.5vw, 54px)', lineHeight: 1.02 }}>
              Explore the full course library
            </h1>
            <p style={{ margin: 0, maxWidth: 760, color: 'var(--text-secondary)', fontSize: 17, lineHeight: 1.8 }}>
              {config.copy.quizzesSubtitle}
            </p>
          </div>
          <div className="dc-card" style={{ padding: 18, minWidth: 260 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Visible catalog</div>
            <div style={{ marginTop: 10, fontSize: 38, fontWeight: 700 }}>{filtered.length}</div>
            <div style={{ marginTop: 8, color: 'var(--text-secondary)' }}>{quizzes.length} total courses available</div>
          </div>
        </div>

        <div className="dc-grid" style={{ gridTemplateColumns: '1.4fr 1fr 1fr', gap: 14, marginTop: 24 }}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search courses, tracks, or exam codes"
            style={{
              minHeight: 52,
              borderRadius: 18,
              border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text)',
              padding: '0 16px',
              font: 'inherit',
            }}
          />
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as (typeof DIFFICULTIES)[number])}
            style={{ minHeight: 52, borderRadius: 18, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text)', padding: '0 16px', font: 'inherit' }}
          >
            {DIFFICULTIES.map((item) => <option key={item} value={item}>{item === 'all' ? 'All levels' : item}</option>)}
          </select>
          <select
            value={premiumOnly}
            onChange={(event) => setPremiumOnly(event.target.value as 'all' | 'free' | 'premium')}
            style={{ minHeight: 52, borderRadius: 18, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text)', padding: '0 16px', font: 'inherit' }}
          >
            <option value="all">All access types</option>
            <option value="free">Free only</option>
            <option value="premium">Premium only</option>
          </select>
        </div>
      </section>

      {[
        { title: 'Featured tracks', subtitle: 'Horizontal cards match the visual direction from the mobile references.', items: featured, tinted: true },
        { title: 'Popular courses', subtitle: 'Course visibility, counts, and ordering can be controlled through admin settings.', items: popular, tinted: false },
        { title: 'Practice now', subtitle: 'Free-access courses stay easy to scan and compare.', items: practice, tinted: false },
      ].map((section) => (
        <section key={section.title}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'end', marginBottom: 18 }}>
            <div>
              <h2 className="dc-section-title">{section.title}</h2>
              <p className="dc-section-subtitle">{section.subtitle}</p>
            </div>
            <span className="dc-chip">{section.items.length} visible</span>
          </div>
          <div className="dc-rail">
            {section.items.map((quiz, index) => {
              const result = results.find((entry) => entry.quizId === quiz.id);
              const progress = score(result);
              const unlocked = canAccess(quiz.id);
              const isDailyQuiz = dailyQuiz?.id === quiz.id;
              const dailyQuizActionLabel = isDailyQuiz ? (dailyQuizCompleted ? 'Review Daily Quiz' : 'Play Daily Quiz') : null;
              const background = section.tinted
                ? `linear-gradient(180deg, rgba(255,255,255,0.04), transparent), ${index % 2 === 0 ? 'var(--platform-home-hero-course-bg)' : 'var(--platform-rail-card-overlay)'}`
                : 'var(--surface)';

              return (
                <Link
                  key={quiz.id}
                  href={`/dashboard/quiz/${quiz.id}`}
                  className="dc-card"
                  style={{ padding: 20, textDecoration: 'none', minHeight: 320, background }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span className="dc-chip" style={{ background: section.tinted ? 'rgba(0,0,0,0.24)' : undefined, color: section.tinted ? '#fff' : undefined }}>
                        {quiz.isPremium ? 'Premium' : 'Track'}
                      </span>
                      {isDailyQuiz ? (
                        <span className="dc-chip" style={{ background: 'rgba(255,216,77,0.18)', color: section.tinted ? '#fff7bf' : '#ffd84d' }}>
                          {systemFeatures.dailyQuizLabel}
                        </span>
                      ) : null}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: section.tinted ? '#fff' : 'var(--text)', fontWeight: 700 }}>{quiz.examCode ?? quiz.category}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{quiz.duration} min</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 22, fontSize: 52 }}>{quiz.icon}</div>
                  <div style={{ marginTop: 16, fontSize: 28, fontWeight: 700, lineHeight: 1.08, color: section.tinted ? '#fff' : 'var(--text)' }}>
                    {quiz.title}
                  </div>
                  <div style={{ marginTop: 12, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{quiz.description}</div>

                  <div style={{ marginTop: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <span>{quiz.questionCount} questions</span>
                      <span>{unlocked ? (progress ? `${progress}% complete` : 'Open now') : `₹${quiz.price ?? 0}`}</span>
                    </div>
                    <div style={{ height: 12, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--primary), var(--primary-2))' }} />
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ color: progress >= 70 ? 'var(--platform-success-accent)' : 'var(--text-secondary)', fontWeight: progress ? 700 : 500 }}>
                        {progress ? `${progress}% recent score` : quiz.isPremium ? 'Unlock for full access' : 'Start this course'}
                      </div>
                      {dailyQuizActionLabel ? (
                        <span className="dc-chip" style={{ background: dailyQuizCompleted ? 'rgba(81, 207, 102, 0.16)' : 'rgba(255,216,77,0.16)', color: dailyQuizCompleted ? 'var(--platform-success-accent)' : '#ffd84d' }}>
                          {dailyQuizActionLabel}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

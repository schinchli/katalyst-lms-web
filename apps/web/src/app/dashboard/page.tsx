'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { quizzes } from '@/data/quizzes';
import type { QuizResult } from '@/types';
import { supabase } from '@/lib/supabase';
import { getQuizResults } from '@/lib/db';
import { FEATURED_ARTICLES, PLATFORM_TESTIMONIALS } from '@/lib/experienceFixtures';
import { usePlatformExperience } from '@/components/PlatformExperienceProvider';
import { DEFAULT_SYSTEM_FEATURES, resolveDailyQuiz, type SystemFeaturesConfig } from '@/lib/systemFeatures';
import { useManagedQuizContentVersion } from '@/components/ManagedQuizContentProvider';

function getLocalResults(): QuizResult[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('quiz-results') || '[]') as QuizResult[];
  } catch {
    return [];
  }
}

function pct(result: QuizResult) {
  return Math.round((result.score / result.totalQuestions) * 100);
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
    if (doneDates.has(d.toDateString())) { streak++; }
    else if (i === 0) { continue; }
    else { break; }
  }
  const activeDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return { label: DAY_ABBREV[d.getDay()], active: doneDates.has(d.toDateString()) };
  });
  return { streak, activeDays };
}

const AVATAR_COLORS = ['vx-avatar-primary', 'vx-avatar-info', 'vx-avatar-success', 'vx-avatar-warning', 'vx-avatar-error'];

export default function DashboardPage() {
  const quizContentVersion = useManagedQuizContentVersion();
  const { config } = usePlatformExperience();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [name, setName] = useState('Learner');
  const [systemFeatures, setSystemFeatures] = useState<SystemFeaturesConfig>(DEFAULT_SYSTEM_FEATURES);

  useEffect(() => {
    let active = true;
    setResults(getLocalResults());
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!active || !user) return;
      setName((user.user_metadata?.name as string | undefined) || localStorage.getItem('profile-name') || user.email?.split('@')[0] || 'Learner');
      const remoteResults = await getQuizResults(user.id);
      if (active && remoteResults.length > 0) {
        setResults(remoteResults);
        try { localStorage.setItem('quiz-results', JSON.stringify(remoteResults)); } catch { /* best-effort */ }
      }
    });
    fetch('/api/system-features')
      .then((r) => r.json() as Promise<{ config?: SystemFeaturesConfig }>)
      .then((b) => { if (active) setSystemFeatures(b.config ?? DEFAULT_SYSTEM_FEATURES); })
      .catch(() => { if (active) setSystemFeatures(DEFAULT_SYSTEM_FEATURES); });
    return () => { active = false; };
  }, []);

  const visibleQuizzes = useMemo(() => quizzes.filter((q) => q.enabled !== false), [quizContentVersion]);
  const completedIds = useMemo(() => new Set(results.map((r) => r.quizId)), [results]);
  const continueCourse = useMemo(() => visibleQuizzes.find((q) => completedIds.has(q.id)) ?? visibleQuizzes[0], [completedIds, visibleQuizzes]);
  const topCourses = useMemo(() => visibleQuizzes.slice(0, 6), [visibleQuizzes]);
  const articles = useMemo(() => FEATURED_ARTICLES.slice(0, config.layout.resourcesArticleCount), [config.layout.resourcesArticleCount]);
  const completion = visibleQuizzes.length ? Math.round((completedIds.size / visibleQuizzes.length) * 100) : 0;
  const average = results.length ? Math.round(results.reduce((sum, r) => sum + pct(r), 0) / results.length) : 0;
  const { streak: currentStreak, activeDays } = useMemo(() => computeStreakData(results), [results]);
  const dailyQuiz = useMemo(() => resolveDailyQuiz(systemFeatures, visibleQuizzes), [systemFeatures, visibleQuizzes]);
  const dailyQuizCompleted = useMemo(
    () => (dailyQuiz ? results.some((r) => r.quizId === dailyQuiz.id && isSameLocalDay(r.completedAt)) : false),
    [dailyQuiz, results],
  );

  return (
    <div className="page-content">

      {/* ── Welcome hero ── */}
      <div className="vx-card" style={{ marginBottom: 24, overflow: 'hidden' }}>
        <div className="dash-academy-hero" style={{ display: 'flex', gap: 0 }}>
          {/* Left: welcome + stats */}
          <div style={{ flex: 1, padding: '28px 28px 24px', borderRight: '1px solid var(--border)', minWidth: 0 }}>
            <h5 style={{ margin: '0 0 4px', fontWeight: 400, fontSize: 15, color: 'var(--text-secondary)' }}>
              Welcome back,
            </h5>
            <h3 style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 26, color: 'var(--text)' }}>
              {name} 👋
            </h3>
            <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 400 }}>
              {config.copy.homeHeroSubtitle || 'Your progress this week is looking great. Keep it up and earn more points!'}
            </p>

            {/* KPI stats row */}
            <div className="dash-kpi-row" style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {([
                {
                  label: 'Courses Started', value: String(completedIds.size || 0), cls: 'bg-label-primary',
                  icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
                },
                {
                  label: 'Average Score', value: `${average}%`, cls: 'bg-label-info',
                  icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
                },
                {
                  label: 'Current Streak', value: `${currentStreak} days`, cls: 'bg-label-warning',
                  icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
                },
              ] as { label: string; value: string; cls: string; icon: React.ReactNode }[]).map((stat) => (
                <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className={`avatar avatar-lg ${stat.cls}`} style={{ borderRadius: 8 }}>
                    <div className="avatar-initial" style={{ borderRadius: 8 }}>{stat.icon}</div>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: 13, color: 'var(--text-secondary)' }}>{stat.label}</p>
                    <h4 style={{ margin: 0, fontWeight: 700, fontSize: 22, color: 'var(--primary)' }}>{stat.value}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: continue path + progress ring */}
          <div className="dash-academy-hero-right" style={{ width: 280, padding: '28px 24px 24px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6 }}>Continue Path</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, marginBottom: 14 }}>{continueCourse.title}</div>
            </div>
            {/* Circular progress */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: 120, height: 120, borderRadius: '50%', display: 'grid', placeItems: 'center',
                background: `conic-gradient(var(--primary) ${completion}%, var(--border) ${completion}% 100%)`,
              }}>
                <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'var(--surface)', display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
                  {completion}%
                </div>
              </div>
            </div>
            <Link href={`/dashboard/quiz/${continueCourse.id}`} className="btn-primary" style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
              {config.copy.homePrimaryCta || 'Continue Learning'}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Daily Quiz (if configured) ── */}
      {dailyQuiz && (
        <div className="vx-card" style={{ marginBottom: 24, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--primary)' }}>{systemFeatures.dailyQuizLabel}</span>
              <span className={`vx-badge ${dailyQuizCompleted ? 'vx-badge-success' : 'vx-badge-warning'}`}>{dailyQuizCompleted ? 'Completed today' : 'Ready today'}</span>
            </div>
            <h5 style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>{dailyQuiz.title}</h5>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7 }}>
              {dailyQuizCompleted ? "Today's daily quiz is complete. Reopen to review or improve your result." : dailyQuiz.description}
            </p>
          </div>
          <Link href={`/dashboard/quiz/${dailyQuiz.id}`} className="btn-primary" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
            {dailyQuizCompleted ? 'Review Daily Quiz' : 'Start Daily Quiz'}
          </Link>
        </div>
      )}

      {/* ── Main 2-col grid ── */}
      <div className="dash-academy-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Top Courses */}
          {config.widgets.showPopularCourses && (
            <div className="vx-card">
              <div className="vx-card-header">
                <h5 className="vx-card-title">Top Courses</h5>
                <Link href="/dashboard/quizzes" className="vx-card-link">View All</Link>
              </div>
              <div className="vx-list">
                {topCourses.map((quiz, idx) => {
                  const existing = results.find((r) => r.quizId === quiz.id);
                  const score = existing ? pct(existing) : 0;
                  return (
                    <Link key={quiz.id} href={`/dashboard/quiz/${quiz.id}`} className="vx-list-item" style={{ textDecoration: 'none' }}>
                      <div className={`vx-avatar ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                        {quiz.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="vx-list-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{quiz.title}</div>
                        <div className="vx-list-sub">{quiz.questionCount} questions · {quiz.duration} min</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span className={`vx-badge ${score >= 70 ? 'vx-badge-success' : score > 0 ? 'vx-badge-warning' : 'vx-badge-secondary'}`}>
                          {score > 0 ? `${score}%` : quiz.isPremium ? 'Premium' : 'Free'}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Assignment / Quiz Progress */}
          {results.length > 0 && (
            <div className="vx-card">
              <div className="vx-card-header">
                <h5 className="vx-card-title">Quiz Progress</h5>
                <Link href="/dashboard/quizzes" className="vx-card-link">All Courses</Link>
              </div>
              <div style={{ padding: '8px 0' }}>
                {results.slice(-4).reverse().map((item, i) => {
                  const score = pct(item);
                  const quizTitle = quizzes.find((q) => q.id === item.quizId)?.title ?? item.quizId;
                  const progressColors = ['var(--primary)', '#28C76F', '#FF9F43', '#EA5455', '#00CFE8'];
                  const color = progressColors[i % progressColors.length];
                  return (
                    <div key={`${item.quizId}-${item.completedAt}`} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '14px 22px', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                      {/* Mini circular progress */}
                      <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `conic-gradient(${color} ${score * 3.6}deg, var(--border) 0deg)` }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface)', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700, color }}>{score}%</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{quizTitle}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.score}/{item.totalQuestions} correct</div>
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        <button type="button" style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resources — articles */}
          {config.widgets.showPopularCourses && (
            <div className="vx-card">
              <div className="vx-card-header">
                <h5 className="vx-card-title">{config.copy.resourcesTitle || 'Learning Resources'}</h5>
                <Link href="/dashboard/learn" className="vx-card-link">View All</Link>
              </div>
              <div className="vx-list">
                {articles.slice(0, 4).map((article, idx) => (
                  <div key={article.slug} className="vx-list-item">
                    <div className={`vx-avatar ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`} style={{ fontSize: 14, fontWeight: 800 }}>
                      {article.tag.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="vx-list-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{article.title}</div>
                      <div className="vx-list-sub">{article.author} · {article.date}</div>
                    </div>
                    <span className="vx-badge vx-badge-secondary" style={{ flexShrink: 0 }}>{article.tag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Quick Actions */}
          {config.widgets.showHomeActions && (
            <div className="vx-card">
              <div className="vx-card-header">
                <h5 className="vx-card-title">Quick Actions</h5>
              </div>
              {([
                { title: 'Browse Courses', sub: 'Explore the full library', href: '/dashboard/quizzes', cls: 'vx-avatar-primary',
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
                { title: 'Track Progress', sub: 'View scores and history', href: '/dashboard/leaderboard', cls: 'vx-avatar-success',
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
                { title: 'Leaderboard', sub: 'See how you rank', href: '/dashboard/leaderboard', cls: 'vx-avatar-warning',
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg> },
                { title: 'Read & Learn', sub: 'Cheat sheets and guides', href: '/dashboard/learn', cls: 'vx-avatar-info',
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
              ] as { title: string; sub: string; href: string; cls: string; icon: React.ReactNode }[]).map((item) => (
                <Link key={item.title} href={item.href} className="vx-action-card" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className={`vx-avatar-sm ${item.cls}`}>{item.icon}</div>
                  <div className="vx-action-info">
                    <div className="vx-action-title">{item.title}</div>
                    <div className="vx-action-sub">{item.sub}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)', flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
                </Link>
              ))}
            </div>
          )}

          {/* Streak & Activity */}
          {config.widgets.showGrowthWidget && (
            <div className="vx-card">
              <div className="vx-card-header">
                <h5 className="vx-card-title">Streak &amp; Activity</h5>
                <span className="vx-badge vx-badge-warning">{currentStreak} days</span>
              </div>
              <div style={{ padding: '16px 22px' }}>
                <div className="vx-day-grid">
                  {activeDays.map((day, i) => (
                    <div key={i} className={`vx-day${day.active ? ' active' : ''}`}>{day.label}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent Results */}
          {config.widgets.showLeaderboardPreview && (
            <div className="vx-card">
              <div className="vx-card-header">
                <h5 className="vx-card-title">Recent Results</h5>
                <Link href="/dashboard/quizzes" className="vx-card-link">All Courses</Link>
              </div>
              <div className="vx-list">
                {results.length === 0 ? (
                  <div style={{ padding: '16px 22px', color: 'var(--text-secondary)', fontSize: 13 }}>
                    No history yet. <Link href="/dashboard/quizzes" style={{ color: 'var(--primary)' }}>Start a course →</Link>
                  </div>
                ) : results.slice(-4).reverse().map((item) => {
                  const score = pct(item);
                  const quizTitle = quizzes.find((q) => q.id === item.quizId)?.title ?? item.quizId;
                  return (
                    <div key={`${item.quizId}-${item.completedAt}`} className="vx-list-item">
                      <div className={`vx-avatar-sm ${score >= 70 ? 'vx-avatar-success' : 'vx-avatar-error'}`} style={{ borderRadius: 6 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          {score >= 70 ? <polyline points="20 6 9 17 4 12" /> : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="vx-list-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{quizTitle}</div>
                        <div className="vx-list-sub">{new Date(item.completedAt).toLocaleDateString()}</div>
                      </div>
                      <span className={`vx-badge ${score >= 70 ? 'vx-badge-success' : 'vx-badge-error'}`}>{score}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Testimonials */}
          {config.widgets.showTestimonials && (
            <div className="vx-card">
              <div className="vx-card-header">
                <h5 className="vx-card-title">{config.copy.testimonialsTitle || 'From Our Learners'}</h5>
              </div>
              <div className="vx-list">
                {PLATFORM_TESTIMONIALS.slice(0, 3).map((item, idx) => (
                  <div key={item.company} className="vx-list-item" style={{ alignItems: 'flex-start' }}>
                    <div className={`vx-avatar ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`} style={{ fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
                      {item.company.charAt(0)}
                    </div>
                    <div>
                      <div className="vx-list-title">{item.company}</div>
                      <div className="vx-list-sub" style={{ whiteSpace: 'normal', lineHeight: 1.6 }}>{item.quote}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

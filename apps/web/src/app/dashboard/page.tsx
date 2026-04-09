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

const DAY_ABBREV = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // Sun=0 … Sat=6

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
      continue; // today not done yet — look back further before breaking
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
        try {
          localStorage.setItem('quiz-results', JSON.stringify(remoteResults));
        } catch {
          // best-effort
        }
      }
    });

    fetch('/api/system-features')
      .then((response) => response.json() as Promise<{ config?: SystemFeaturesConfig }>)
      .then((body) => { if (active) setSystemFeatures(body.config ?? DEFAULT_SYSTEM_FEATURES); })
      .catch(() => { if (active) setSystemFeatures(DEFAULT_SYSTEM_FEATURES); });

    return () => { active = false; };
  }, []);

  const visibleQuizzes = useMemo(() => quizzes.filter((quiz) => quiz.enabled !== false), [quizContentVersion]);
  const completedIds = useMemo(() => new Set(results.map((item) => item.quizId)), [results]);
  const continueCourse = useMemo(() => visibleQuizzes.find((quiz) => completedIds.has(quiz.id)) ?? visibleQuizzes[0], [completedIds, visibleQuizzes]);
  const featured = useMemo(() => visibleQuizzes.slice(0, config.layout.featuredCourseCount), [config.layout.featuredCourseCount, visibleQuizzes]);
  const popular = useMemo(() => visibleQuizzes.slice(0, config.layout.popularCourseCount), [config.layout.popularCourseCount, visibleQuizzes]);
  const practice = useMemo(() => visibleQuizzes.filter((quiz) => !quiz.isPremium).slice(0, config.layout.practiceCourseCount), [config.layout.practiceCourseCount, visibleQuizzes]);
  const articles = useMemo(() => FEATURED_ARTICLES.slice(0, config.layout.resourcesArticleCount), [config.layout.resourcesArticleCount]);
  const completion = visibleQuizzes.length ? Math.round((completedIds.size / visibleQuizzes.length) * 100) : 0;
  const average = results.length ? Math.round(results.reduce((sum, item) => sum + pct(item), 0) / results.length) : 0;
  const todayXp = results.slice(-3).reduce((sum, item) => sum + pct(item), 0);
  const { streak: currentStreak, activeDays } = useMemo(() => computeStreakData(results), [results]);
  const actionClass = config.layout.homeActionsStyle === 'stack' ? 'dc-actions-stack' : 'dc-actions-grid';
  const dailyQuiz = useMemo(
    () => resolveDailyQuiz(systemFeatures, visibleQuizzes),
    [systemFeatures, visibleQuizzes],
  );
  const dailyQuizCompleted = useMemo(
    () => (dailyQuiz ? results.some((result) => result.quizId === dailyQuiz.id && isSameLocalDay(result.completedAt)) : false),
    [dailyQuiz, results],
  );

  return (
    <div className="page-content dc-shell">
      <section className="dc-hero">
        <div className="dc-hero-grid">
          <div>
            <span className="dc-chip">{config.copy.homeEyebrow}</span>
            <h1 className="dc-hero-title">{config.copy.homeHeroTitle}</h1>
            <p className="dc-hero-sub">{config.copy.homeHeroSubtitle}</p>
            <div className="dc-cta-row">
              <Link href={`/dashboard/quiz/${continueCourse.id}`} className="btn-primary">
                {config.copy.homePrimaryCta}
              </Link>
              <Link href="/dashboard/quizzes" className="dc-secondary-cta">
                {config.copy.homeSecondaryCta}
              </Link>
            </div>
          </div>

          <div className="dc-card" style={{ padding: 22, background: 'var(--platform-home-hero-course-bg)', minHeight: 320 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Continue path
                </div>
                <div style={{ marginTop: 8, fontSize: 34, fontWeight: 700, color: 'var(--text)' }}>{continueCourse.title}</div>
              </div>
              <span className="dc-chip" style={{ background: 'var(--overlay-md)', color: 'var(--text)' }}>
                {completion}%
              </span>
            </div>

            <div style={{ marginTop: 28, display: 'grid', placeItems: 'center' }}>
              <div style={{
                width: 190,
                height: 190,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                background: `conic-gradient(var(--primary) ${completion}%, rgba(255,255,255,0.09) ${completion}% 100%)`,
                boxShadow: '0 0 0 10px rgba(255,255,255,0.04)',
              }}>
                <div style={{
                  width: 146,
                  height: 146,
                  borderRadius: '50%',
                  background: 'var(--bg)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--text)',
                  fontSize: 42,
                  fontWeight: 700,
                }}>
                  {completion}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {config.widgets.showHomeStats && (
          <div className="dc-kpi-grid" style={{ marginTop: 22 }}>
            {([
              { label: 'Courses started', value: String(completedIds.size || 0), avatarCls: 'vx-avatar-primary',
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
              { label: 'Average score',   value: `${average}%`,            avatarCls: 'vx-avatar-info',
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
              { label: 'Today XP',        value: String(todayXp),           avatarCls: 'vx-avatar-warning',
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
              { label: 'Current streak',  value: `${currentStreak} days`,   avatarCls: 'vx-avatar-success',
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
            ] as { label: string; value: string; avatarCls: string; icon: React.ReactNode }[]).map((stat) => (
              <div key={stat.label} className="dc-card" style={{ padding: 18 }}>
                <div className="vx-kpi">
                  <div className={`vx-avatar ${stat.avatarCls}`}>{stat.icon}</div>
                  <div>
                    <div className="vx-kpi-label">{stat.label}</div>
                    <div className="vx-kpi-value">{stat.value}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {dailyQuiz ? (
        <section>
          <div className="dc-card" style={{ padding: 24, display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--primary)' }}>
                  {systemFeatures.dailyQuizLabel}
                </div>
                <span className="dc-chip" style={{ background: dailyQuizCompleted ? 'rgba(81, 207, 102, 0.16)' : 'rgba(255, 216, 77, 0.16)', color: dailyQuizCompleted ? 'var(--platform-success-accent)' : 'var(--color-xp)' }}>
                  {dailyQuizCompleted ? 'Completed today' : 'Ready today'}
                </span>
              </div>
              <div style={{ marginTop: 10, fontSize: 30, fontWeight: 700, color: 'var(--text)' }}>{dailyQuiz.title}</div>
              <div style={{ marginTop: 8, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {dailyQuizCompleted ? 'Today\'s daily quiz is complete. Reopen it to review or improve your result.' : dailyQuiz.description}
              </div>
            </div>
            <Link href={`/dashboard/quiz/${dailyQuiz.id}`} className="btn-primary" style={{ textDecoration: 'none' }}>
              {dailyQuizCompleted ? 'Review Daily Quiz' : 'Start Daily Quiz'}
            </Link>
          </div>
        </section>
      ) : null}

      {config.widgets.showHomeActions && (
        <section>
          <div className={actionClass}>
            {([
              { title: 'Flashcards', subtitle: 'Review concepts with fast recall loops.',         href: '/dashboard/quizzes', avatarCls: 'vx-avatar-primary',
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
              { title: 'Practice',   subtitle: 'Jump into hands-on question sets and drills.',    href: '/dashboard/quizzes', avatarCls: 'vx-avatar-info',
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
              { title: 'Resources',  subtitle: 'Read cheat sheets, guides, and editorials.',      href: '/dashboard/learn',   avatarCls: 'vx-avatar-success',
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
              { title: 'Growth',     subtitle: 'Track streaks, results, and learning momentum.',  href: '/dashboard/progress', avatarCls: 'vx-avatar-warning',
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
            ] as { title: string; subtitle: string; href: string; avatarCls: string; icon: React.ReactNode }[]).map((item) => (
              <Link key={item.title} href={item.href} className="dc-card vx-action-card">
                <div className={`vx-avatar ${item.avatarCls}`}>{item.icon}</div>
                <div className="vx-action-info">
                  <div className="vx-action-title">{item.title}</div>
                  <div className="vx-action-sub">{item.subtitle}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)', flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'end', marginBottom: 18 }}>
          <div>
            <h2 className="dc-section-title">Featured courses</h2>
            <p className="dc-section-subtitle">Horizontal discovery rails like the mobile redesign, but tuned for wider screens.</p>
          </div>
          <Link href="/dashboard/quizzes" style={{ color: 'var(--text)', fontWeight: 700 }}>See all</Link>
        </div>
        <div className="dc-rail">
          {featured.map((quiz, index) => (
            <Link
              key={quiz.id}
              href={`/dashboard/quiz/${quiz.id}`}
              className="dc-card"
              style={{
                textDecoration: 'none',
                overflow: 'hidden',
                background: `linear-gradient(180deg, rgba(255,255,255,0.03), transparent), ${index % 2 === 0 ? 'var(--platform-home-hero-course-bg)' : 'var(--platform-rail-card-overlay)'}`,
              }}
            >
              <div style={{ padding: 18, minHeight: 162, display: 'grid', alignContent: 'space-between', gap: 16 }}>
                <span className="dc-chip" style={{ width: 'fit-content', background: 'rgba(0,0,0,0.26)', color: '#fff' }}>{quiz.examCode ?? quiz.category}</span>
                <div>
                  <div style={{ fontSize: 28 }}>{quiz.icon}</div>
                  <div style={{ marginTop: 14, fontSize: 28, fontWeight: 700, lineHeight: 1.1, color: '#fff' }}>{quiz.title}</div>
                </div>
              </div>
              <div style={{ padding: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: 13 }}>
                  <span>{quiz.questionCount} questions</span>
                  <span>{quiz.duration} min</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {config.widgets.showPopularCourses && (
        <section>
          <div className="dc-card">
            <div className="vx-card-header">
              <h5 className="vx-card-title">Popular courses</h5>
              <Link href="/dashboard/quizzes" className="vx-card-link">View all</Link>
            </div>
            <div className="vx-card-body vx-list">
              {popular.map((quiz, idx) => {
                const existing = results.find((item) => item.quizId === quiz.id);
                const score = existing ? pct(existing) : 0;
                const avatarColors = ['vx-avatar-primary','vx-avatar-info','vx-avatar-success','vx-avatar-warning','vx-avatar-error'];
                const avatarCls = avatarColors[idx % avatarColors.length];
                return (
                  <Link key={quiz.id} href={`/dashboard/quiz/${quiz.id}`} className="vx-list-item" style={{ textDecoration: 'none' }}>
                    <div className={`vx-avatar ${avatarCls}`} style={{ fontSize: 20 }}>{quiz.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="vx-list-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{quiz.title}</div>
                      <div className="vx-list-sub">{quiz.questionCount} questions · {quiz.duration} min</div>
                    </div>
                    <span className={`vx-badge ${score >= 70 ? 'vx-badge-success' : score > 0 ? 'vx-badge-warning' : 'vx-badge-muted'}`}>
                      {score > 0 ? `${score}%` : 'New'}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {config.widgets.showFlashcards && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'end', marginBottom: 18 }}>
            <div>
              <h2 className="dc-section-title">Practice rails</h2>
              <p className="dc-section-subtitle">Keep practice lists horizontal so the experience matches the reference direction across web and mobile.</p>
            </div>
            <Link href="/dashboard/quizzes" style={{ color: 'var(--text)', fontWeight: 700 }}>Open library</Link>
          </div>
          <div className="dc-rail">
            {practice.map((quiz) => (
              <Link key={quiz.id} href={`/dashboard/quiz/${quiz.id}`} className="dc-card" style={{ padding: 18, textDecoration: 'none' }}>
                <div className="dc-chip" style={{ width: 'fit-content' }}>{quiz.difficulty}</div>
                <div style={{ marginTop: 18, fontSize: 48 }}>{quiz.icon}</div>
                <div style={{ marginTop: 12, fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>{quiz.title}</div>
                <div style={{ marginTop: 10, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{quiz.questionCount} questions · {quiz.duration} minutes</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="dc-grid" style={{ gridTemplateColumns: '1.15fr 0.85fr' }}>
        <div className="dc-card">
          <div className="vx-card-header">
            <h5 className="vx-card-title">{config.copy.resourcesTitle}</h5>
            <Link href="/dashboard/learn" className="vx-card-link">View all</Link>
          </div>
          <div className="dc-resource-list" style={{ padding: '20px 20px' }}>
            {articles.map((article) => (
              <article key={article.slug} className="dc-resource-card">
                <span className="dc-chip" style={{ background: 'rgba(0,237,100,0.12)', color: 'inherit' }}>{article.tag}</span>
                <h3 style={{ margin: '18px 0 14px', fontSize: 42, lineHeight: 1.06 }}>{article.title}</h3>
                <p style={{ margin: 0, fontSize: 18, lineHeight: 1.75, color: 'inherit', opacity: 0.72 }}>{article.description}</p>
                <div style={{ marginTop: 24, fontSize: 15, opacity: 0.68 }}>{article.author} · {article.date}</div>
              </article>
            ))}
          </div>
        </div>

        <div className="dc-grid" style={{ gap: 18 }}>
          {config.widgets.showGrowthWidget && (
            <div className="dc-card">
              <div className="vx-card-header">
                <h5 className="vx-card-title">Streak &amp; activity</h5>
                <span className="vx-badge vx-badge-warning">{currentStreak} days</span>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div className="vx-day-grid">
                  {activeDays.map((day, index) => (
                    <div key={index} className={`vx-day${day.active ? ' active' : ''}`}>{day.label}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {config.widgets.showLeaderboardPreview && (
            <div className="dc-card">
              <div className="vx-card-header">
                <h5 className="vx-card-title">Recent results</h5>
                <Link href="/dashboard/progress" className="vx-card-link">See all</Link>
              </div>
              <div className="vx-card-body vx-list">
                {results.length === 0 ? (
                  <div style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: 13 }}>
                    No quiz history yet. <Link href="/dashboard/quizzes" style={{ color: 'var(--primary)' }}>Start a course</Link>
                  </div>
                ) : results.slice(-4).reverse().map((item) => {
                  const score = pct(item);
                  const quizTitle = quizzes.find((q) => q.id === item.quizId)?.title ?? item.quizId;
                  return (
                    <div key={`${item.quizId}-${item.completedAt}`} className="vx-list-item">
                      <div className={`vx-avatar ${score >= 70 ? 'vx-avatar-success' : 'vx-avatar-error'}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

          {config.widgets.showTestimonials && (
            <div className="dc-card">
              <div className="vx-card-header">
                <h5 className="vx-card-title">{config.copy.testimonialsTitle}</h5>
              </div>
              <div className="vx-card-body vx-list">
                {PLATFORM_TESTIMONIALS.map((item, idx) => {
                  const avatarColors = ['vx-avatar-primary','vx-avatar-info','vx-avatar-success','vx-avatar-warning'];
                  return (
                    <div key={item.company} className="vx-list-item" style={{ alignItems: 'flex-start' }}>
                      <div className={`vx-avatar ${avatarColors[idx % avatarColors.length]}`} style={{ fontSize: 14, fontWeight: 800 }}>
                        {item.company.charAt(0)}
                      </div>
                      <div>
                        <div className="vx-list-title">{item.company}</div>
                        <div className="vx-list-sub" style={{ whiteSpace: 'normal', lineHeight: 1.6 }}>{item.quote}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {config.widgets.showProfileOffer && (
        <section className="dc-card" style={{ padding: 26, borderColor: 'color-mix(in srgb, var(--platform-profile-offer-accent) 35%, var(--border))' }}>
          <div className="dc-grid" style={{ gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 46, fontWeight: 700, color: 'var(--text)' }}>{config.copy.profileOfferTitle}</div>
              <div style={{ marginTop: 8, fontSize: 18, color: 'var(--platform-profile-offer-accent)', fontWeight: 700 }}>
                {config.copy.profileOfferSubtitle}
              </div>
            </div>
            <Link href="/dashboard/profile" className="btn-primary" style={{ textDecoration: 'none' }}>
              Open profile
            </Link>
          </div>
          <div style={{ marginTop: 16, color: 'var(--text-secondary)' }}>Welcome back, {name}. The home experience, rails, copy, and section counts are now coming from platform settings instead of page constants.</div>
        </section>
      )}
    </div>
  );
}

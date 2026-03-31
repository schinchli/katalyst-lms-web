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
      <section className="dc-hero" style={{ padding: '34px 34px 30px' }}>
        <div className="dc-grid" style={{ gridTemplateColumns: '1.2fr 0.9fr', gap: 24, alignItems: 'stretch' }}>
          <div>
            <span className="dc-chip">{config.copy.homeEyebrow}</span>
            <h1 style={{ margin: '18px 0 12px', fontSize: 'clamp(36px, 5vw, 58px)', lineHeight: 1.03, color: 'var(--text)' }}>
              {config.copy.homeHeroTitle}
            </h1>
            <p style={{ margin: 0, maxWidth: 680, fontSize: 17, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
              {config.copy.homeHeroSubtitle}
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 28 }}>
              <Link href={`/dashboard/quiz/${continueCourse.id}`} className="btn-primary" style={{ textDecoration: 'none' }}>
                {config.copy.homePrimaryCta}
              </Link>
              <Link
                href="/dashboard/quizzes"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 46,
                  padding: '0 22px',
                  borderRadius: 'var(--button-radius)',
                  border: '1px solid color-mix(in srgb, var(--primary) 36%, var(--border))',
                  color: 'var(--text)',
                  fontWeight: 700,
                  textDecoration: 'none',
                  background: 'rgba(255,255,255,0.03)',
                }}
              >
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
              <span className="dc-chip" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text)' }}>
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
                  background: 'rgba(8, 18, 38, 0.92)',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#fff',
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
            {[
              { label: 'Courses started', value: String(completedIds.size || 0), tone: 'var(--text)' },
              { label: 'Average score', value: `${average}%`, tone: 'var(--primary)' },
              { label: 'Today XP', value: `${todayXp}`, tone: '#ffd84d' },
              { label: 'Current streak', value: `${currentStreak} days`, tone: 'var(--platform-premium-accent)' },
            ].map((stat) => (
              <div key={stat.label} className="dc-card" style={{ padding: 20 }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{stat.label}</div>
                <div style={{ marginTop: 10, fontSize: 30, fontWeight: 700, color: stat.tone }}>{stat.value}</div>
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
                <span className="dc-chip" style={{ background: dailyQuizCompleted ? 'rgba(81, 207, 102, 0.16)' : 'rgba(255, 216, 77, 0.16)', color: dailyQuizCompleted ? 'var(--platform-success-accent)' : '#ffd84d' }}>
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
            {[
              { title: 'Flashcards', subtitle: 'Review concepts with fast recall loops.', href: '/dashboard/quizzes', emoji: '🗂' },
              { title: 'Practice', subtitle: 'Jump into hands-on question sets and drills.', href: '/dashboard/quizzes', emoji: '🏋️' },
              { title: 'Resources', subtitle: 'Read cheat sheets, guides, and editorials.', href: '/dashboard/learn', emoji: '📚' },
              { title: 'Growth', subtitle: 'Track streaks, results, and learning momentum.', href: '/dashboard/progress', emoji: '📈' },
            ].map((item) => (
              <Link key={item.title} href={item.href} className="dc-card" style={{ padding: 22, textDecoration: 'none' }}>
                <div style={{ fontSize: 32 }}>{item.emoji}</div>
                <div style={{ marginTop: 18, fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>{item.title}</div>
                <div style={{ marginTop: 10, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{item.subtitle}</div>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'end', marginBottom: 18 }}>
            <div>
              <h2 className="dc-section-title">Popular courses</h2>
              <p className="dc-section-subtitle">A cleaner course carousel for scrolling through tracks, levels, and cert prep quickly.</p>
            </div>
            <Link href="/dashboard/quizzes" style={{ color: 'var(--text)', fontWeight: 700 }}>See all</Link>
          </div>
          <div className="dc-rail">
            {popular.map((quiz) => {
              const existing = results.find((item) => item.quizId === quiz.id);
              const score = existing ? pct(existing) : 0;
              return (
                <Link key={quiz.id} href={`/dashboard/quiz/${quiz.id}`} className="dc-card" style={{ padding: 18, textDecoration: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span className="dc-chip">{quiz.isPremium ? 'Premium' : 'Track'}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{quiz.duration} min</span>
                  </div>
                  <div style={{ marginTop: 18, fontSize: 48 }}>{quiz.icon}</div>
                  <div style={{ marginTop: 14, fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>{quiz.title}</div>
                  <p style={{ margin: '12px 0 18px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{quiz.description}</p>
                  <div style={{ height: 12, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${score}%`, background: 'linear-gradient(90deg, var(--primary), var(--primary-2))' }} />
                  </div>
                  <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-secondary)' }}>{score ? `${score}% complete` : 'Not started yet'}</div>
                </Link>
              );
            })}
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
        <div className="dc-card" style={{ padding: 26 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start' }}>
            <div>
              <h2 className="dc-section-title" style={{ fontSize: 30 }}>{config.copy.resourcesTitle}</h2>
              <p className="dc-section-subtitle" style={{ maxWidth: 'unset' }}>Dynamic article counts are now admin-controlled instead of hardcoded into the page.</p>
            </div>
            <span className="dc-chip">{config.layout.resourcesArticleCount} visible</span>
          </div>
          <div className="dc-resource-list" style={{ marginTop: 22 }}>
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
            <div className="dc-card" style={{ padding: 24 }}>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Streak and activity</div>
              <div style={{ marginTop: 10, fontSize: 42, fontWeight: 700, color: 'var(--text)' }}>{currentStreak} days</div>
              <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                {activeDays.map((day, index) => (
                  <div
                    key={index}
                    style={{
                      height: 56,
                      borderRadius: 18,
                      border: day.active ? '1px solid rgba(255,216,77,0.5)' : '1px solid var(--border)',
                      background: day.active ? 'rgba(255,216,77,0.12)' : 'rgba(255,255,255,0.02)',
                      display: 'grid',
                      placeItems: 'center',
                      color: day.active ? '#ffd84d' : 'var(--text-secondary)',
                      fontWeight: 700,
                    }}
                  >
                    {day.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {config.widgets.showLeaderboardPreview && (
            <div className="dc-card" style={{ padding: 24 }}>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Momentum snapshot</div>
              <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                {results.slice(-4).reverse().map((item) => (
                  <div key={`${item.quizId}-${item.completedAt}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text)' }}>{quizzes.find((quiz) => quiz.id === item.quizId)?.title ?? item.quizId}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(item.completedAt).toLocaleDateString()}</div>
                    </div>
                    <div style={{ color: pct(item) >= 70 ? 'var(--platform-success-accent)' : 'var(--platform-danger-accent)', fontWeight: 700 }}>
                      {pct(item)}%
                    </div>
                  </div>
                ))}
                {results.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>Take your first quiz to start filling this dashboard.</div>}
              </div>
            </div>
          )}

          {config.widgets.showTestimonials && (
            <div className="dc-card" style={{ padding: 24 }}>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{config.copy.testimonialsTitle}</div>
              <div style={{ marginTop: 8, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{config.copy.testimonialsSubtitle}</div>
              <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
                {PLATFORM_TESTIMONIALS.map((item) => (
                  <div key={item.company} style={{ padding: 16, borderRadius: 18, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{item.company}</div>
                    <div style={{ marginTop: 8, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item.quote}</div>
                  </div>
                ))}
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

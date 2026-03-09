'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { quizzes } from '@/data/quizzes';
import type { Quiz, QuizResult } from '@/types';
import { supabase } from '@/lib/supabase';
import { getQuizResults } from '@/lib/db';

const DIFF_COLOR: Record<string, string> = { beginner: '#28C76F', intermediate: '#FF9F43', advanced: '#FF4C51' };
const CERT_COLOR: Record<string, string> = {
  foundational: '#28C76F', associate: '#00BAD1', professional: '#FF9F43', specialty: '#7367F0',
};

// ── Milestone types ───────────────────────────────────────────────────────────
interface Milestone {
  certFilter: string;
  certLabel:  string;
  targetDate: string; // YYYY-MM-DD
  startDate:  string; // YYYY-MM-DD
}

interface MilestoneStats {
  daysLeft:               number;
  daysTotal:              number;
  targetPct:              number;
  actualPct:              number;
  status:                 'ahead' | 'ontrack' | 'behind';
  milestoneQuizCount:     number;
  milestoneCompletedCount: number;
}

const CERT_OPTIONS = [
  { value: 'all',          label: 'All AWS Quizzes'            },
  { value: 'clf-c02',      label: 'CLF-C02 Cloud Practitioner' },
  { value: 'foundational', label: 'Foundational Tier'          },
  { value: 'associate',    label: 'Associate Tier'             },
  { value: 'professional', label: 'Professional Tier'          },
  { value: 'specialty',    label: 'Specialty Tier'             },
];

const STATUS_META = {
  ahead:   { label: '🚀 Ahead of Schedule', color: '#28C76F', bg: '#28C76F18' },
  ontrack: { label: '✅ On Track',           color: '#FF9F43', bg: '#FF9F4318' },
  behind:  { label: '⚠️ Behind Schedule',    color: '#FF4C51', bg: '#FF4C5118' },
};

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const QUOTES = [
  { text: 'Every expert was once a beginner. Keep going.', author: 'Helen Hayes' },
  { text: 'Small daily improvements lead to stunning long-term results.', author: 'Robin Sharma' },
  { text: 'The more that you read, the more things you will know.', author: 'Dr. Seuss' },
  { text: 'Consistency is the key to achieving and maintaining momentum.', author: '' },
  { text: 'Learning is not attained by chance; it must be sought with ardor.', author: 'Abigail Adams' },
  { text: 'Push yourself, because no one else is going to do it for you.', author: '' },
  { text: 'Great things never come from comfort zones.', author: '' },
  { text: 'Success is the sum of small efforts repeated day in and day out.', author: 'Robert Collier' },
  { text: 'Do not wait to be ready. Start before you feel ready.', author: '' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'You do not have to be great to start, but you have to start to be great.', author: 'Zig Ziglar' },
  { text: 'It does not matter how slowly you go, as long as you do not stop.', author: 'Confucius' },
  { text: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin' },
  { text: 'The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.', author: 'Brian Herbert' },
  { text: 'Discipline is the bridge between goals and accomplishment.', author: 'Jim Rohn' },
  { text: 'Knowledge is power. Sharing knowledge is the beginning of wisdom.', author: '' },
  { text: 'A year from now you will wish you had started today.', author: 'Karen Lamb' },
  { text: 'The expert in anything was once a beginner.', author: '' },
  { text: 'Your future self is watching you right now through your memories.', author: 'Aubrey De Grey' },
  { text: 'Winners are not people who never fail, but people who never quit.', author: '' },
];

function filterForMilestone(all: Quiz[], certFilter: string): Quiz[] {
  if (certFilter === 'all') return all;
  if (certFilter === 'clf-c02') return all.filter((q) => q.category === 'clf-c02');
  return all.filter((q) => q.certLevel === certFilter);
}

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / 86400000);
}

function getLocalResults(): QuizResult[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('quiz-results') || '[]'); } catch { return []; }
}

// ── SVG icons ─────────────────────────────────────────────────────────────────
const ClockSvg = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const BookSvg = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const TrendSvg = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
);
const AwardSvg = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

const TargetSvg = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const EditSvg = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

export default function DashboardPage() {
  const [results, setResults]             = useState<QuizResult[]>([]);
  const [name, setName]                   = useState('Learner');
  const [milestone, setMilestone]         = useState<Milestone | null>(null);
  const [showGoalForm, setShowGoalForm]   = useState(false);
  const [goalCert, setGoalCert]           = useState('clf-c02');
  const [goalDate, setGoalDate]           = useState('');
  const [userTimezone, setUserTimezone]   = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  useEffect(() => {
    setResults(getLocalResults());

    try {
      const raw = localStorage.getItem('katalyst-milestone');
      if (raw) setMilestone(JSON.parse(raw) as Milestone);
    } catch { /* ignore */ }

    try {
      const themeRaw = localStorage.getItem('katalyst-theme');
      if (themeRaw) {
        const t = JSON.parse(themeRaw) as { timezone?: string };
        if (t.timezone) setUserTimezone(t.timezone);
      }
    } catch { /* ignore */ }

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      const supabaseName =
        (user?.user_metadata?.name as string | undefined) ||
        user?.email ||
        'Learner';
      setName(localStorage.getItem('profile-name') || supabaseName);

      if (user) {
        const supabaseResults = await getQuizResults(user.id);
        if (supabaseResults.length > 0) {
          setResults(supabaseResults);
          try { localStorage.setItem('quiz-results', JSON.stringify(supabaseResults)); } catch { /* best-effort */ }
        }
      }
    });
  }, []);

  // Date string in user's configured timezone (avoids UTC midnight offset bugs)
  function toLocalDate(d: Date): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: userTimezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(d);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }

  function saveMilestone() {
    if (!goalDate) return;
    const option = CERT_OPTIONS.find((o) => o.value === goalCert) ?? CERT_OPTIONS[0];
    const m: Milestone = {
      certFilter: goalCert,
      certLabel:  option.label,
      targetDate: goalDate,
      startDate:  toLocalDate(new Date()),
    };
    localStorage.setItem('katalyst-milestone', JSON.stringify(m));
    setMilestone(m);
    setShowGoalForm(false);
  }

  function clearMilestone() {
    localStorage.removeItem('katalyst-milestone');
    setMilestone(null);
    setShowGoalForm(false);
  }

  // ── Core stats ────────────────────────────────────────────────────────────
  const completed = new Set(results.map((r) => r.quizId));
  const avgScore  = results.length
    ? Math.round(results.reduce((s, r) => s + Math.round((r.score / r.totalQuestions) * 100), 0) / results.length)
    : 0;
  const totalSecs = results.reduce((s, r) => s + (r.timeTaken ?? 0), 0);
  const totalHrs  = Math.floor(totalSecs / 3600);
  const totalMins = Math.floor((totalSecs % 3600) / 60);
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const quote = QUOTES[new Date().getDate() % QUOTES.length]!;

  // ── Milestone stats ───────────────────────────────────────────────────────
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  let milestoneStats: MilestoneStats | null = null;
  if (milestone) {
    const target      = new Date(milestone.targetDate + 'T00:00:00');
    const start       = new Date(milestone.startDate  + 'T00:00:00');
    const daysLeft    = Math.max(0, daysBetween(todayDate, target));
    const daysTotal   = Math.max(1, daysBetween(start, target));
    const elapsedDays = Math.max(0, daysTotal - daysLeft);

    const mQuizzes        = filterForMilestone(quizzes, milestone.certFilter);
    const mCompletedCount = mQuizzes.filter((q) => completed.has(q.id)).length;
    const mQuizCount      = mQuizzes.length;

    const actualPct = mQuizCount > 0 ? Math.round((mCompletedCount / mQuizCount) * 100) : 0;
    const targetPct = Math.min(100, Math.round((elapsedDays / daysTotal) * 100));
    const gap       = actualPct - targetPct;
    const status    = gap >= 5 ? 'ahead' : gap >= -15 ? 'ontrack' : 'behind';

    milestoneStats = { daysLeft, daysTotal, targetPct, actualPct, status, milestoneQuizCount: mQuizCount, milestoneCompletedCount: mCompletedCount };
  }

  // ── Daily activity — last 7 days ──────────────────────────────────────────
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - (6 - i));
    return toLocalDate(d);
  });
  // completedAt is an ISO string — convert to local date before comparing
  const studiedDays  = new Set(
    results
      .map((r) => r.completedAt ? toLocalDate(new Date(r.completedAt)) : null)
      .filter((d): d is string => d !== null)
  );
  const studiedCount = last7Days.filter((d) => studiedDays.has(d)).length;
  const todayStudied = studiedDays.has(last7Days[6] as string);

  // ── Quiz lists ────────────────────────────────────────────────────────────
  const takingQuizzes    = quizzes.filter((q) => completed.has(q.id));
  const suggestedQuizzes = quizzes.filter((q) => !q.certLevel && !completed.has(q.id)).slice(0, 4);

  const minDateStr = (() => {
    const d = new Date(todayDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  const stats = [
    { icon: <ClockSvg color="#7367F0" />, label: 'Time Spendings',    value: totalSecs > 0 ? `${totalHrs}h ${totalMins}m` : '0h', sub: `${results.length} sessions`,       color: '#7367F0', bg: '#7367F018' },
    { icon: <BookSvg  color="#28C76F" />, label: 'Hours Spent',       value: results.length > 0 ? `${Math.max(1, totalHrs)}h` : '0h', sub: 'total study time',             color: '#28C76F', bg: '#28C76F18' },
    { icon: <TrendSvg color="#FF9F43" />, label: 'Test Results',      value: `${avgScore}%`,                                          sub: 'average score',                 color: '#FF9F43', bg: '#FF9F4318' },
    { icon: <AwardSvg color="#FF4C51" />, label: 'Courses Completed', value: String(completed.size),                                  sub: `of ${quizzes.length} total`,    color: '#FF4C51', bg: '#FF4C5118' },
  ];

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Welcome back, {name}! 👋</h1>
        <p className="page-subtitle">
          <span className="dashboard-quote-mark">"</span>
          {quote.text}
          {quote.author && <span className="dashboard-quote-author"> — {quote.author}</span>}
        </p>
      </div>

      {/* Stat cards — all dynamically computed from quiz results */}
      <div className="dash-stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="dash-stat-card">
            <div className="dash-stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div>
              <div className="dash-stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="dash-stat-label">{s.label}</div>
              <div className="dash-stat-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="dash-main-grid">
        {/* ── Left column ── */}
        <div>

          {/* Daily activity strip */}
          <div className="activity-strip-card">
            <div className="activity-strip-header">
              <span className="activity-strip-title">Daily Activity</span>
              <span className="activity-strip-sub">
                {studiedCount === 0
                  ? 'No activity this week'
                  : `${studiedCount} of 7 days studied`}
              </span>
            </div>
            <div className="activity-strip">
              {last7Days.map((day, i) => {
                const active  = studiedDays.has(day);
                const isToday = i === 6;
                return (
                  <div key={day} className="activity-dot-col">
                    <div
                      className={['activity-dot', active ? 'active' : '', isToday ? 'today' : ''].filter(Boolean).join(' ')}
                      title={day}
                    />
                    <span className="activity-day-label">
                      {DAY_LABELS[new Date(day + 'T12:00:00').getDay()]}
                    </span>
                  </div>
                );
              })}
              <div className="activity-today-pill-wrap">
                <span className={['activity-today-pill', todayStudied ? 'done' : ''].filter(Boolean).join(' ')}>
                  {todayStudied ? '✓ Done today' : '● Study today'}
                </span>
              </div>
            </div>
          </div>

          {/* Courses You Are Taking */}
          {takingQuizzes.length > 0 && (
            <>
              <div className="section-header">
                <h2 className="section-title">Courses You Are Taking</h2>
                <Link href="/dashboard/quizzes" className="section-link">View All →</Link>
              </div>
              <div className="course-list">
                {takingQuizzes.map((quiz) => {
                  const res    = results.find((r) => r.quizId === quiz.id);
                  const score  = res ? Math.round((res.score / res.totalQuestions) * 100) : null;
                  const pct    = score ?? 0;
                  const accent = quiz.certLevel ? CERT_COLOR[quiz.certLevel] : (DIFF_COLOR[quiz.difficulty] ?? '#7367F0');
                  return (
                    <Link key={quiz.id} href={`/dashboard/quiz/${quiz.id}`} className="course-item">
                      <div className="course-item-icon" style={{ background: accent + '18' }}>📖</div>
                      <div className="course-item-info">
                        <div className="course-item-title">{quiz.title}</div>
                        <div className="course-item-meta">{quiz.questionCount} questions · {quiz.duration}m</div>
                        <div className="course-progress-bar">
                          <div className="course-progress-fill" style={{ width: `${pct}%`, background: accent }} />
                        </div>
                      </div>
                      <div className="course-item-right">
                        {score !== null && (
                          <div className="course-score" style={{ color: score >= 70 ? '#28C76F' : '#FF4C51' }}>{score}%</div>
                        )}
                        <div className="course-item-btn" style={{ background: '#28C76F18', color: '#28C76F' }}>✓ Done</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          {/* Courses You Can Explore */}
          {takingQuizzes.length === 0 && (
            <>
              <div className="section-header">
                <h2 className="section-title">Courses You Can Explore</h2>
                <Link href="/dashboard/quizzes" className="section-link">View All →</Link>
              </div>
              <div className="course-list">
                {quizzes.map((quiz) => {
                  const accent = quiz.certLevel ? CERT_COLOR[quiz.certLevel] : (DIFF_COLOR[quiz.difficulty] ?? '#7367F0');
                  return (
                    <Link key={quiz.id} href={`/dashboard/quiz/${quiz.id}`} className="course-item">
                      <div className="course-item-icon" style={{ background: accent + '18' }}>📖</div>
                      <div className="course-item-info">
                        <div className="course-item-title">{quiz.title}</div>
                        <div className="course-item-meta">{quiz.questionCount} questions · {quiz.duration}m · {quiz.difficulty}</div>
                        <div className="course-progress-bar">
                          <div className="course-progress-fill" style={{ width: '0%', background: accent }} />
                        </div>
                      </div>
                      <div className="course-item-right">
                        <div className="course-item-btn" style={{ background: 'var(--primary-light)', color: 'var(--primary-text)' }}>Start</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          {/* Suggested — only when user has started some courses */}
          {takingQuizzes.length > 0 && suggestedQuizzes.length > 0 && (
            <>
              <div className="section-header" style={{ marginTop: 28 }}>
                <h2 className="section-title">Suggested For You</h2>
              </div>
              <div className="course-list">
                {suggestedQuizzes.map((quiz) => {
                  const accent = DIFF_COLOR[quiz.difficulty] ?? '#7367F0';
                  return (
                    <Link key={quiz.id} href={`/dashboard/quiz/${quiz.id}`} className="course-item">
                      <div className="course-item-icon" style={{ background: accent + '18' }}>📖</div>
                      <div className="course-item-info">
                        <div className="course-item-title">{quiz.title}</div>
                        <div className="course-item-meta">{quiz.questionCount} questions · {quiz.duration}m · {quiz.difficulty}</div>
                        <div className="course-progress-bar">
                          <div className="course-progress-fill" style={{ width: '0%', background: accent }} />
                        </div>
                      </div>
                      <div className="course-item-right">
                        <div className="course-item-btn" style={{ background: 'var(--primary-light)', color: 'var(--primary-text)' }}>Start</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="dash-right-col">

          {/* Course completion — dynamic: updates as quizzes are finished */}
          <div className="completion-card">
            <div className="completion-header">
              <h3 className="completion-title">Course Completion</h3>
              <span className="completion-pct" style={{ color: 'var(--primary)' }}>
                {Math.round((completed.size / quizzes.length) * 100)}%
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.round((completed.size / quizzes.length) * 100)}%`, background: 'var(--primary)' }} />
            </div>
            <div className="completion-sub">{completed.size} of {quizzes.length} courses done</div>
          </div>

          {/* ── Milestone / Goal card ── */}
          <div className="milestone-card">
            <div className="milestone-card-header">
              <div className="milestone-card-title">
                <TargetSvg />
                <span>My Certification Goal</span>
              </div>
              {milestone && !showGoalForm && (
                <button
                  className="milestone-edit-btn"
                  onClick={() => {
                    setGoalCert(milestone.certFilter);
                    setGoalDate(milestone.targetDate);
                    setShowGoalForm(true);
                  }}
                >
                  <EditSvg /> Edit
                </button>
              )}
            </div>

            {/* Empty state */}
            {!milestone && !showGoalForm && (
              <div className="milestone-empty">
                <p className="milestone-empty-text">
                  Set a target date for your certification and we will tell you if you are on track, ahead, or behind.
                </p>
                <button className="milestone-set-btn" onClick={() => setShowGoalForm(true)}>
                  🎯 Set a Goal
                </button>
              </div>
            )}

            {/* Goal form */}
            {showGoalForm && (
              <div className="goal-form">
                <label className="goal-label">Target Certification</label>
                <select
                  className="goal-select"
                  value={goalCert}
                  onChange={(e) => setGoalCert(e.target.value)}
                >
                  {CERT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                <label className="goal-label">Target Date</label>
                <input
                  type="date"
                  className="goal-date-input"
                  value={goalDate}
                  min={minDateStr}
                  onChange={(e) => setGoalDate(e.target.value)}
                />

                <div className="goal-form-actions">
                  <button className="goal-save-btn" onClick={saveMilestone} disabled={!goalDate}>
                    Save Goal
                  </button>
                  <button className="goal-cancel-btn" onClick={() => setShowGoalForm(false)}>
                    Cancel
                  </button>
                  {milestone && (
                    <button className="goal-clear-btn" onClick={clearMilestone}>Clear</button>
                  )}
                </div>
              </div>
            )}

            {/* Milestone display */}
            {milestone && milestoneStats && !showGoalForm && (
              <div className="milestone-body">
                <div className="milestone-cert-label">{milestone.certLabel}</div>

                {/* Counters row */}
                <div className="milestone-counters">
                  <div className="milestone-counter">
                    <div
                      className="milestone-counter-num"
                      style={{ color: milestoneStats.daysLeft <= 7 ? '#FF4C51' : milestoneStats.daysLeft <= 30 ? '#FF9F43' : '#7367F0' }}
                    >
                      {milestoneStats.daysLeft}
                    </div>
                    <div className="milestone-counter-sub">days to go</div>
                  </div>
                  <div className="milestone-counter-divider" />
                  <div className="milestone-counter">
                    <div className="milestone-counter-num" style={{ color: '#28C76F' }}>
                      {milestoneStats.milestoneCompletedCount}
                      <span className="milestone-counter-of">/{milestoneStats.milestoneQuizCount}</span>
                    </div>
                    <div className="milestone-counter-sub">quizzes done</div>
                  </div>
                </div>

                {/* Status badge */}
                <div
                  className="milestone-status-badge"
                  style={{
                    background: STATUS_META[milestoneStats.status].bg,
                    color:      STATUS_META[milestoneStats.status].color,
                  }}
                >
                  {STATUS_META[milestoneStats.status].label}
                </div>

                {/* Progress vs expected bars */}
                <div className="milestone-bars">
                  <div className="milestone-bar-row">
                    <span className="milestone-bar-label">Your progress</span>
                    <div className="milestone-bar-track">
                      <div
                        className="milestone-bar-fill"
                        style={{ width: `${milestoneStats.actualPct}%`, background: '#7367F0' }}
                      />
                    </div>
                    <span className="milestone-bar-pct" style={{ color: '#7367F0' }}>
                      {milestoneStats.actualPct}%
                    </span>
                  </div>
                  <div className="milestone-bar-row">
                    <span className="milestone-bar-label">Needed by now</span>
                    <div className="milestone-bar-track">
                      <div
                        className="milestone-bar-fill"
                        style={{ width: `${milestoneStats.targetPct}%`, background: '#DBDADE' }}
                      />
                    </div>
                    <span className="milestone-bar-pct" style={{ color: 'var(--text-secondary)' }}>
                      {milestoneStats.targetPct}%
                    </span>
                  </div>
                </div>

                <div className="milestone-target-date">
                  📅 Target: {new Date(milestone.targetDate + 'T12:00:00').toLocaleDateString('en-US', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

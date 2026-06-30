'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getQuizResults } from '@/lib/db';
import { LEARNING_PATHS } from '@/data/learningPaths';
import type { QuizResult } from '@/types';
import {
  calculateExamReadiness,
  isValidExamDate,
  localDateKey,
  studyStreak,
  type ExamHabitPlan,
  type StudyEffort,
  type StudySession,
} from '@/lib/examHabit';

const MINUTE_OPTIONS = [15, 30, 45, 60, 90];
const EFFORT_OPTIONS: Array<{ id: StudyEffort; label: string; emoji: string }> = [
  { id: 'light', label: 'Light', emoji: '☕' },
  { id: 'focused', label: 'Focused', emoji: '🎯' },
  { id: 'deep', label: 'Deep', emoji: '⚡' },
];

const STATUS_BADGE: Record<string, string> = {
  ready: 'vx-badge-success',
  on_track: 'vx-badge-info',
  at_risk: 'vx-badge-warning',
  needs_data: 'vx-badge-secondary',
};

function futureDateKey(days = 60) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return localDateKey(d);
}
function displayDate(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
function planKey(userId: string) { return `exam-habit-plan:${userId}`; }
function loadPlan(userId: string): ExamHabitPlan | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(planKey(userId));
    return raw ? (JSON.parse(raw) as ExamHabitPlan) : null;
  } catch { return null; }
}
function savePlan(userId: string, plan: ExamHabitPlan | null) {
  try {
    if (plan) localStorage.setItem(planKey(userId), JSON.stringify(plan));
    else localStorage.removeItem(planKey(userId));
  } catch { /* best-effort */ }
}
function getLocalResults(): QuizResult[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('quiz-results') || '[]') as QuizResult[]; }
  catch { return []; }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: '1 1 120px', minWidth: 110 }}>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
    </div>
  );
}

export default function ExamCoachPage() {
  const [userId, setUserId] = useState('guest');
  const [plan, setPlan] = useState<ExamHabitPlan | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [ready, setReady] = useState(false);

  // Form state
  const [editing, setEditing] = useState(false);
  const [selectedPathId, setSelectedPathId] = useState(LEARNING_PATHS[0].id);
  const [examDate, setExamDate] = useState(futureDateKey());
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [dateError, setDateError] = useState('');

  // Logger state
  const [sessionMinutes, setSessionMinutes] = useState(30);
  const [effort, setEffort] = useState<StudyEffort>('focused');
  const [note, setNote] = useState('');

  const todayKey = useMemo(() => localDateKey(), []);

  useEffect(() => {
    setResults(getLocalResults());
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      const uid = user?.id ?? 'guest';
      setUserId(uid);
      const existing = loadPlan(uid);
      setPlan(existing);
      if (existing) {
        setSelectedPathId(existing.pathId);
        setExamDate(existing.examDate);
        setDailyMinutes(existing.dailyMinutes);
        setSessionMinutes(existing.dailyMinutes);
      } else {
        setEditing(true);
      }
      setReady(true);
      if (user) {
        const remote = await getQuizResults(user.id);
        if (remote.length > 0) setResults(remote);
      }
    });
  }, []);

  const path = LEARNING_PATHS.find((p) => p.id === plan?.pathId)
    ?? LEARNING_PATHS.find((p) => p.id === selectedPathId)
    ?? LEARNING_PATHS[0];

  const readiness = useMemo(() => {
    if (!plan) return null;
    return calculateExamReadiness({ plan, path, completedStepIds: [], results, referenceDateKey: todayKey });
  }, [plan, path, results, todayKey]);

  const streak = plan ? studyStreak(plan.sessions, todayKey) : 0;
  const loggedToday = plan?.sessions.some((s) => s.dateKey === todayKey) ?? false;

  function handleSavePlan() {
    if (!isValidExamDate(examDate)) { setDateError('Pick a valid future date.'); return; }
    setDateError('');
    const minutes = Math.max(5, Math.min(360, dailyMinutes));
    setPlan((prev) => {
      const next: ExamHabitPlan = prev
        ? { ...prev, pathId: selectedPathId, examDate, dailyMinutes: minutes }
        : { pathId: selectedPathId, examDate, dailyMinutes: minutes, startedAt: new Date().toISOString(), sessions: [] };
      savePlan(userId, next);
      return next;
    });
    setEditing(false);
  }

  function handleLogSession() {
    if (!plan) return;
    const session: StudySession = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      dateKey: todayKey,
      minutes: Math.max(1, Math.min(720, sessionMinutes)),
      effort,
      note: note.trim() || undefined,
      loggedAt: new Date().toISOString(),
    };
    setPlan((prev) => {
      if (!prev) return prev;
      const next = { ...prev, sessions: [session, ...prev.sessions].slice(0, 500) };
      savePlan(userId, next);
      return next;
    });
    setNote('');
  }

  if (!ready) {
    return <div className="vx-card" style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Exam Coach</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>Plan your exam date, log study sessions, and track readiness.</p>
      </div>

      {/* Plan setup / edit */}
      {editing ? (
        <div className="vx-card" style={{ padding: 22, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 8 }}>Certification path</label>
            <select value={selectedPathId} onChange={(e) => setSelectedPathId(e.target.value)}
              style={{ width: '100%', height: 42, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', padding: '0 12px', font: 'inherit', fontSize: 14 }}>
              {LEARNING_PATHS.map((p) => <option key={p.id} value={p.id}>{p.certName}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 8 }}>Exam date</label>
            <input type="date" value={examDate} min={localDateKey()} onChange={(e) => setExamDate(e.target.value)}
              style={{ width: '100%', height: 42, borderRadius: 8, border: `1px solid ${dateError ? 'var(--error)' : 'var(--border)'}`, background: 'var(--bg)', color: 'var(--text)', padding: '0 12px', font: 'inherit', fontSize: 14 }} />
            {dateError && <div style={{ fontSize: 12, color: 'var(--error)', marginTop: 6 }}>{dateError}</div>}
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 8 }}>Daily study target</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {MINUTE_OPTIONS.map((m) => (
                <button key={m} type="button" onClick={() => setDailyMinutes(m)}
                  style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${dailyMinutes === m ? 'var(--primary)' : 'var(--border)'}`, background: dailyMinutes === m ? 'var(--primary)' : 'transparent', color: dailyMinutes === m ? '#fff' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {m} min
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={handleSavePlan} className="btn-primary">{plan ? 'Update plan' : 'Start plan'}</button>
            {plan && <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>}
          </div>
        </div>
      ) : readiness && plan ? (
        <>
          {/* Readiness card */}
          <div className="vx-card" style={{ padding: 22, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 34, fontWeight: 700, color: 'var(--primary)' }}>{readiness.score}%</span>
                  <span className={`vx-badge ${STATUS_BADGE[readiness.status] ?? 'vx-badge-secondary'}`}>{readiness.statusLabel}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, maxWidth: 460 }}>{readiness.summary}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
                  {path.certName} · exam {displayDate(plan.examDate)} · 🔥 {streak}-day streak
                </div>
              </div>
              <button type="button" onClick={() => setEditing(true)} className="btn-secondary">Edit plan</button>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <Stat label="Days left" value={`${readiness.daysUntilExam}`} />
              <Stat label="Path complete" value={`${Math.round(readiness.pathCompletion * 100)}%`} />
              <Stat label="Adherence" value={`${Math.round(readiness.adherence * 100)}%`} />
              <Stat label="Consistency" value={`${Math.round(readiness.consistency * 100)}%`} />
              <Stat label="Avg quiz" value={readiness.averageQuizScore === null ? '—' : `${readiness.averageQuizScore}%`} />
              <Stat label="Avg/day" value={`${readiness.averageDailyMinutes} min`} />
            </div>
            {readiness.suggestedExamDate && (
              <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)' }}>
                💡 Suggested exam date: <strong style={{ color: 'var(--text)' }}>{displayDate(readiness.suggestedExamDate)}</strong>
              </div>
            )}
          </div>

          {/* Session logger */}
          <div className="vx-card" style={{ padding: 22, marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' }}>Log study session</h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 14px' }}>
              {loggedToday ? 'You already logged today — add another session if you studied more.' : 'Log today\'s study to keep your streak and improve the forecast.'}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {MINUTE_OPTIONS.map((m) => (
                <button key={m} type="button" onClick={() => setSessionMinutes(m)}
                  style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${sessionMinutes === m ? 'var(--primary)' : 'var(--border)'}`, background: sessionMinutes === m ? 'var(--primary)' : 'transparent', color: sessionMinutes === m ? '#fff' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {m} min
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {EFFORT_OPTIONS.map((e) => (
                <button key={e.id} type="button" onClick={() => setEffort(e.id)}
                  style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${effort === e.id ? 'var(--primary)' : 'var(--border)'}`, background: effort === e.id ? 'var(--primary-light)' : 'transparent', color: effort === e.id ? 'var(--primary)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {e.emoji} {e.label}
                </button>
              ))}
            </div>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)"
              style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', padding: '0 12px', font: 'inherit', fontSize: 14, marginBottom: 12 }} />
            <button type="button" onClick={handleLogSession} className="btn-primary">+ Log session</button>
          </div>

          {/* Recent sessions */}
          {plan.sessions.length > 0 && (
            <>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 12px' }}>Recent sessions</h2>
              <div className="vx-card" style={{ padding: 0, overflow: 'hidden' }}>
                {plan.sessions.slice(0, 20).map((s, idx) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 18px', borderBottom: idx === Math.min(plan.sessions.length, 20) - 1 ? 'none' : '1px solid var(--border)' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>
                        {EFFORT_OPTIONS.find((e) => e.id === s.effort)?.emoji} {s.effort}
                        {s.note ? <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}> — {s.note}</span> : null}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{displayDate(s.dateKey)}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>{s.minutes} min</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}

'use client';
export const dynamic = 'force-dynamic';

/**
 * Admin Quiz Builder — LearnKloud
 * Create and manage quizzes + questions stored in Supabase (managed_quiz_content).
 * Built-in quizzes (from quizzes.ts) show as read-only metadata with edit capability.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/LoadingSpinner';

// ── Types ─────────────────────────────────────────────────────────────────────
interface QuizEntry {
  id: string;
  title: string;
  description?: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  isPremium: boolean;
  price: number;
  icon: string;
  questionCount: number;
  enabled: boolean;
  examCode?: string;
  certLevel?: string;
  mode?: string;
  correctScore?: number;
  wrongScore?: number;
  _source: 'builtin' | 'managed';
}

interface QuestionOption { id: string; text: string; }
interface Question {
  id?: string;
  text: string;
  options: QuestionOption[];
  correctOptionId: string;
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  hint?: string;
}

type PageStatus = 'loading' | 'authorized' | 'unauthorized' | 'error';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const DIFF_COLORS: Record<string, string> = {
  beginner: 'var(--success)', intermediate: 'var(--warning)', advanced: 'var(--error)',
};

function blankQuestion(quizId: string, index: number): Question {
  return {
    text: '',
    options: [
      { id: 'a', text: '' },
      { id: 'b', text: '' },
      { id: 'c', text: '' },
      { id: 'd', text: '' },
    ],
    correctOptionId: 'a',
    explanation: '',
    difficulty: 'beginner',
    id: `${quizId}-q${index + 1}`,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function QuizBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [pageStatus,       setPageStatus]       = useState<PageStatus>('loading');
  const [token,            setToken]             = useState('');
  const [quizzes,          setQuizzes]           = useState<QuizEntry[]>([]);
  const [selectedId,       setSelectedId]        = useState<string | null>(null);
  const [quizDraft,        setQuizDraft]         = useState<Partial<QuizEntry> | null>(null);
  const [questions,        setQuestions]         = useState<Question[]>([]);
  const [quizSaveState,    setQuizSaveState]     = useState<SaveState>('idle');
  const [qSaveState,       setQSaveState]        = useState<SaveState>('idle');
  const [deleteConfirm,    setDeleteConfirm]     = useState<string | null>(null);
  const [isCreating,       setIsCreating]        = useState(false);
  const [loadingQuestions, setLoadingQuestions]  = useState(false);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setPageStatus('unauthorized'); return; }
        const res = await fetch('/api/admin/check', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) { setPageStatus('unauthorized'); return; }
        const { isAdmin } = await res.json() as { isAdmin: boolean };
        if (!isAdmin) { setPageStatus('unauthorized'); return; }
        setToken(session.access_token);
        setPageStatus('authorized');
        await loadCatalog(session.access_token);

        // Pre-select quiz from URL param ?quiz=<id>
        const preselect = searchParams.get('quiz');
        if (preselect) selectQuiz(preselect);
      } catch { setPageStatus('error'); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCatalog = useCallback(async (tok: string) => {
    const res = await fetch('/api/admin/quiz-builder', {
      headers: { Authorization: `Bearer ${tok}` },
    });
    if (res.ok) {
      const body = await res.json() as { ok: boolean; quizzes: QuizEntry[] };
      if (body.ok) setQuizzes(body.quizzes);
    }
  }, []);

  const selectQuiz = useCallback((id: string) => {
    setSelectedId(id);
    setQuizDraft(null);
    setQuestions([]);
    setQuizSaveState('idle');
    setQSaveState('idle');
    setDeleteConfirm(null);
    setIsCreating(false);
  }, []);

  // Load quiz draft + questions when selectedId changes
  useEffect(() => {
    if (!selectedId || !token) return;
    const quiz = quizzes.find((q) => q.id === selectedId);
    if (quiz) setQuizDraft({ ...quiz });

    setLoadingQuestions(true);
    fetch(`/api/admin/quiz-builder/${selectedId}/questions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((body: { ok: boolean; questions: Question[] }) => {
        if (body.ok) setQuestions(body.questions ?? []);
      })
      .catch(() => {})
      .finally(() => setLoadingQuestions(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, token]);

  // ── Save quiz metadata ──────────────────────────────────────────────────────
  async function saveQuiz() {
    if (!quizDraft || !token) return;
    setQuizSaveState('saving');
    try {
      const isNew = isCreating && !selectedId;
      const url = isNew
        ? '/api/admin/quiz-builder'
        : `/api/admin/quiz-builder/${selectedId}`;
      const method = isNew ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(quizDraft),
      });
      const body = await res.json() as { ok: boolean; quiz?: QuizEntry; error?: unknown };
      if (body.ok && body.quiz) {
        setQuizSaveState('saved');
        await loadCatalog(token);
        setSelectedId(body.quiz.id);
        setIsCreating(false);
        setTimeout(() => setQuizSaveState('idle'), 2500);
      } else {
        setQuizSaveState('error');
      }
    } catch { setQuizSaveState('error'); }
  }

  // ── Save questions ──────────────────────────────────────────────────────────
  async function saveQuestions() {
    if (!selectedId || !token) return;
    setQSaveState('saving');
    try {
      const res = await fetch(`/api/admin/quiz-builder/${selectedId}/questions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ questions }),
      });
      const body = await res.json() as { ok: boolean; count?: number };
      if (body.ok) {
        setQSaveState('saved');
        await loadCatalog(token);
        setTimeout(() => setQSaveState('idle'), 2500);
      } else { setQSaveState('error'); }
    } catch { setQSaveState('error'); }
  }

  // ── Delete quiz ─────────────────────────────────────────────────────────────
  async function deleteQuiz(quizId: string) {
    if (!token) return;
    const res = await fetch(`/api/admin/quiz-builder/${quizId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json() as { ok: boolean; error?: string };
    if (body.ok) {
      setSelectedId(null);
      setQuizDraft(null);
      setQuestions([]);
      setDeleteConfirm(null);
      await loadCatalog(token);
    } else {
      alert(typeof body.error === 'string' ? body.error : 'Failed to delete quiz.');
    }
  }

  // ── Question helpers ────────────────────────────────────────────────────────
  function addQuestion() {
    setQuestions((prev) => [...prev, blankQuestion(selectedId ?? 'new', prev.length)]);
  }

  function removeQuestion(idx: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  function moveQuestion(idx: number, dir: -1 | 1) {
    setQuestions((prev) => {
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }

  function patchQuestion(idx: number, patch: Partial<Question>) {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, ...patch } : q));
  }

  function patchOption(qIdx: number, optId: string, text: string) {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx) return q;
      return { ...q, options: q.options.map((o) => o.id === optId ? { ...o, text } : o) };
    }));
  }

  // ── Start new quiz ──────────────────────────────────────────────────────────
  function startNewQuiz() {
    setSelectedId(null);
    setIsCreating(true);
    setQuizDraft({
      title: '', description: '', category: 'general', difficulty: 'beginner',
      duration: 10, isPremium: false, price: 0, icon: '📚', enabled: true,
    });
    setQuestions([]);
    setQuizSaveState('idle');
    setQSaveState('idle');
    setDeleteConfirm(null);
  }

  // ── Render guards ───────────────────────────────────────────────────────────
  if (pageStatus === 'loading') return <LoadingSpinner label="Verifying admin access…" />;
  if (pageStatus !== 'authorized') {
    return (
      <div className="page-error" role="alert">
        <div className="page-error-icon">🔐</div>
        <p style={{ margin: 0, fontWeight: 700 }}>Access Denied</p>
        <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  const selectedQuiz = selectedId ? quizzes.find((q) => q.id === selectedId) : null;
  const isBuiltIn = selectedQuiz?._source === 'builtin';

  const SaveFeedback = ({ state, label = 'Save' }: { state: SaveState; label?: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button
        className="btn-primary"
        style={{ height: 34, padding: '0 20px', fontSize: 13 }}
        disabled={state === 'saving'}
        onClick={state === 'saving' ? undefined : (label.includes('Quiz') ? saveQuiz : saveQuestions)}
      >
        {state === 'saving' ? 'Saving…' : label}
      </button>
      {state === 'saved'  && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>✓ Saved</span>}
      {state === 'error'  && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--error)' }}>✗ Error</span>}
    </div>
  );

  // ── Main Layout ─────────────────────────────────────────────────────────────
  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quiz Builder</h1>
          <p className="page-subtitle">{quizzes.length} quizzes · {quizzes.filter(q => q._source === 'managed').length} managed</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-primary"
            style={{ height: 36, padding: '0 16px', fontSize: 13 }}
            onClick={startNewQuiz}
          >
            + New Quiz
          </button>
          <button
            style={{ height: 36, borderRadius: 8, padding: '0 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontFamily: 'inherit' }}
            onClick={() => router.push('/dashboard/admin')}
          >
            Admin Home
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'start' }}>

        {/* ── Quiz List ─────────────────────────────────────────────────────── */}
        <div className="vx-card" style={{ padding: 0, maxHeight: '80vh', overflowY: 'auto' }}>
          {quizzes.map((q) => (
            <div
              key={q.id}
              onClick={() => selectQuiz(q.id)}
              style={{
                padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                background: selectedId === q.id ? 'var(--primary-light)' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 16 }}>{q.icon}</span>
                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.title}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: DIFF_COLORS[q.difficulty], textTransform: 'uppercase' }}>{q.difficulty}</span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>·</span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{q.questionCount}Q</span>
                {q._source === 'managed' && (
                  <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'rgba(115,103,240,0.12)', color: 'var(--primary)', fontWeight: 700, marginLeft: 'auto' }}>MANAGED</span>
                )}
                {!q.enabled && (
                  <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'rgba(255,76,81,0.1)', color: 'var(--error)', fontWeight: 700 }}>OFF</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Right Panel ───────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Quiz Metadata Editor */}
          {(quizDraft || isCreating) ? (
            <div className="vx-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {isCreating ? 'New Quiz' : selectedQuiz?.title}
                  </div>
                  {!isCreating && (
                    <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{selectedId}</div>
                  )}
                </div>
                {isBuiltIn && (
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(115,103,240,0.1)', color: 'var(--primary)', fontWeight: 700 }}>BUILT-IN</span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                {/* Title */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Title *</label>
                  <input className="admin-field-input" value={quizDraft?.title ?? ''} onChange={(e) => setQuizDraft((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. AWS Security Deep Dive" />
                </div>

                {/* Description */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Description</label>
                  <textarea className="admin-field-input" rows={2} style={{ resize: 'vertical' }} value={quizDraft?.description ?? ''} onChange={(e) => setQuizDraft((p) => ({ ...p, description: e.target.value }))} placeholder="Short description shown to learners" />
                </div>

                {/* Category */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Category *</label>
                  <input className="admin-field-input" value={quizDraft?.category ?? ''} onChange={(e) => setQuizDraft((p) => ({ ...p, category: e.target.value }))} placeholder="e.g. clf-c02" />
                </div>

                {/* Difficulty */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Difficulty *</label>
                  <select className="admin-field-input" value={quizDraft?.difficulty ?? 'beginner'} onChange={(e) => setQuizDraft((p) => ({ ...p, difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced' }))}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Duration (min)</label>
                  <input className="admin-field-input" type="number" min={1} max={300} value={quizDraft?.duration ?? 10} onChange={(e) => setQuizDraft((p) => ({ ...p, duration: parseInt(e.target.value, 10) || 10 }))} />
                </div>

                {/* Icon */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Icon (emoji)</label>
                  <input className="admin-field-input" value={quizDraft?.icon ?? '📚'} onChange={(e) => setQuizDraft((p) => ({ ...p, icon: e.target.value }))} placeholder="📚" maxLength={4} />
                </div>

                {/* Exam Code */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Exam Code</label>
                  <input className="admin-field-input" value={quizDraft?.examCode ?? ''} onChange={(e) => setQuizDraft((p) => ({ ...p, examCode: e.target.value }))} placeholder="e.g. CLF-C02" />
                </div>

                {/* Cert Level */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Cert Level</label>
                  <select className="admin-field-input" value={quizDraft?.certLevel ?? ''} onChange={(e) => setQuizDraft((p) => ({ ...p, certLevel: e.target.value || undefined }))}>
                    <option value="">None</option>
                    <option value="foundational">Foundational</option>
                    <option value="associate">Associate</option>
                    <option value="professional">Professional</option>
                    <option value="specialty">Specialty</option>
                  </select>
                </div>

                {/* Enabled toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    <input type="checkbox" checked={quizDraft?.enabled ?? true} onChange={(e) => setQuizDraft((p) => ({ ...p, enabled: e.target.checked }))} style={{ width: 16, height: 16 }} />
                    Enabled (visible in catalog)
                  </label>
                </div>

                {/* Premium toggle + price */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, gridColumn: '1 / -1', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    <input type="checkbox" checked={quizDraft?.isPremium ?? false} onChange={(e) => setQuizDraft((p) => ({ ...p, isPremium: e.target.checked, price: e.target.checked ? (p?.price ?? 149) : 0 }))} style={{ width: 16, height: 16 }} />
                    Premium (requires purchase)
                  </label>
                  {quizDraft?.isPremium && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>₹</span>
                      <input className="admin-field-input" type="number" min={0} value={quizDraft?.price ?? 149} onChange={(e) => setQuizDraft((p) => ({ ...p, price: parseInt(e.target.value, 10) || 0 }))} style={{ width: 100 }} placeholder="149" />
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <SaveFeedback state={quizSaveState} label="Save Quiz" />
                {!isCreating && !isBuiltIn && (
                  deleteConfirm === selectedId ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--error)' }}>Delete permanently?</span>
                      <button onClick={() => deleteQuiz(selectedId!)} style={{ height: 30, padding: '0 12px', borderRadius: 6, background: 'var(--error)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Confirm</button>
                      <button onClick={() => setDeleteConfirm(null)} style={{ height: 30, padding: '0 12px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(selectedId)} style={{ height: 30, padding: '0 12px', borderRadius: 6, background: 'rgba(255,76,81,0.08)', border: '1px solid rgba(255,76,81,0.4)', color: 'var(--error)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Delete Quiz</button>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="vx-card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: 14 }}>Select a quiz from the list to edit, or create a new one.</p>
              <button className="btn-primary" onClick={startNewQuiz}>+ New Quiz</button>
            </div>
          )}

          {/* Questions Editor — only shown when a quiz is selected (not creating) */}
          {selectedId && !isCreating && (
            <div className="vx-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>
                  Questions
                  <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--text-secondary)', marginLeft: 8 }}>({questions.length})</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <SaveFeedback state={qSaveState} label="Save Questions" />
                  <button
                    onClick={addQuestion}
                    style={{ height: 32, padding: '0 14px', borderRadius: 8, background: 'rgba(115,103,240,0.1)', border: '1px solid var(--primary)', color: 'var(--primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    + Add Question
                  </button>
                </div>
              </div>

              {loadingQuestions ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>Loading questions…</div>
              ) : questions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>
                  No questions yet. Click &quot;+ Add Question&quot; to get started.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {questions.map((q, qi) => (
                    <div key={qi} style={{ padding: 16, background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Q{qi + 1}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => moveQuestion(qi, -1)} disabled={qi === 0} style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'inherit' }}>↑</button>
                          <button onClick={() => moveQuestion(qi, 1)} disabled={qi === questions.length - 1} style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'inherit' }}>↓</button>
                          <button onClick={() => removeQuestion(qi)} style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(255,76,81,0.08)', border: '1px solid rgba(255,76,81,0.3)', cursor: 'pointer', fontSize: 12, color: 'var(--error)', fontFamily: 'inherit' }}>✕</button>
                        </div>
                      </div>

                      {/* Question text */}
                      <textarea
                        className="admin-field-input"
                        rows={2}
                        style={{ resize: 'vertical', marginBottom: 10, width: '100%', boxSizing: 'border-box' }}
                        value={q.text}
                        onChange={(e) => patchQuestion(qi, { text: e.target.value })}
                        placeholder="Question text *"
                      />

                      {/* Options */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                        {q.options.map((opt) => (
                          <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input
                              type="radio"
                              name={`correct-${qi}`}
                              checked={q.correctOptionId === opt.id}
                              onChange={() => patchQuestion(qi, { correctOptionId: opt.id })}
                              style={{ width: 14, height: 14, cursor: 'pointer', accentColor: 'var(--success)' }}
                              title="Mark as correct"
                            />
                            <span style={{ fontSize: 11, fontWeight: 700, color: q.correctOptionId === opt.id ? 'var(--success)' : 'var(--text-secondary)', width: 14 }}>{opt.id.toUpperCase()}</span>
                            <input
                              className="admin-field-input"
                              style={{ flex: 1 }}
                              value={opt.text}
                              onChange={(e) => patchOption(qi, opt.id, e.target.value)}
                              placeholder={`Option ${opt.id.toUpperCase()}`}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Explanation + difficulty */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'start' }}>
                        <input
                          className="admin-field-input"
                          value={q.explanation}
                          onChange={(e) => patchQuestion(qi, { explanation: e.target.value })}
                          placeholder="Explanation (shown after answering)"
                        />
                        <select
                          className="admin-field-input"
                          style={{ width: 130 }}
                          value={q.difficulty}
                          onChange={(e) => patchQuestion(qi, { difficulty: e.target.value as Question['difficulty'] })}
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

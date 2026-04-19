'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { quizQuestions, quizzes } from '@/data/quizzes';
import type { Question, Quiz } from '@/types';
import { useManagedQuizContentVersion } from '@/components/ManagedQuizContentProvider';
import { supabase } from '@/lib/supabase';

interface BookmarkEntry {
  question: Question;
  quiz: Quiz;
}

function buildQuestionIndex(): Map<string, BookmarkEntry> {
  const index = new Map<string, BookmarkEntry>();
  quizzes.forEach((quiz) => {
    const qs = quizQuestions[quiz.id] ?? [];
    qs.forEach((q) => index.set(q.id, { question: q, quiz }));
  });
  return index;
}

// ── localStorage helpers (local cache) ───────────────────────────────────────

function localLoad(): string[] {
  try {
    const raw = localStorage.getItem('web-bookmarks');
    const parsed: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function localSave(ids: string[]) {
  try { localStorage.setItem('web-bookmarks', JSON.stringify(ids)); } catch { /* best-effort */ }
}

// ── DB sync helpers ───────────────────────────────────────────────────────────

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function fetchDbBookmarks(): Promise<string[] | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    const res = await fetch('/api/bookmarks', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json = await res.json() as { ok: boolean; bookmarks: string[] };
    return json.ok ? json.bookmarks : null;
  } catch { return null; }
}

async function dbAdd(questionId: string): Promise<void> {
  const token = await getToken();
  if (!token) return;
  fetch('/api/bookmarks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionId }),
  }).catch(() => { /* fire-and-forget */ });
}

async function dbRemove(questionId: string): Promise<void> {
  const token = await getToken();
  if (!token) return;
  fetch('/api/bookmarks', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionId }),
  }).catch(() => { /* fire-and-forget */ });
}

// ── Page component ────────────────────────────────────────────────────────────

export default function BookmarksPage() {
  const router = useRouter();
  const quizContentVersion = useManagedQuizContentVersion();
  const questionIndex = useMemo(() => buildQuestionIndex(), [quizContentVersion]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // 1. Paint immediately from localStorage (no flicker).
    const local = localLoad();
    setBookmarkedIds(local);
    setLoaded(true);

    // 2. Hydrate from DB in background; DB wins if it has data.
    fetchDbBookmarks().then((dbIds) => {
      if (dbIds !== null) {
        setBookmarkedIds(dbIds);
        localSave(dbIds);
      }
    });
  }, []);

  const removeBookmark = (questionId: string) => {
    const next = bookmarkedIds.filter((id) => id !== questionId);
    setBookmarkedIds(next);
    localSave(next);
    dbRemove(questionId);
  };

  const entries: BookmarkEntry[] = bookmarkedIds
    .map((id) => questionIndex.get(id))
    .filter((entry): entry is BookmarkEntry => Boolean(entry));

  const handleStartReview = () => {
    if (bookmarkedIds.length === 0) return;
    router.push(`/dashboard/quiz/${entries[0]?.quiz.id ?? 'review'}?review=bookmarks`);
  };

  if (!loaded) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>;
  }

  return (
    <div className="page-content">
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, marginBottom: 4 }}>Bookmarks</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
            {entries.length > 0
              ? `${entries.length} bookmarked question${entries.length !== 1 ? 's' : ''}`
              : 'Bookmark questions during a quiz to review them here'}
          </p>
        </div>
        {entries.length > 0 && (
          <button
            onClick={handleStartReview}
            style={{ height: 44, paddingInline: 24, borderRadius: 10, background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            ▶ Start Review
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 60, paddingBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔖</div>
          <h3 style={{ marginBottom: 8 }}>No bookmarks yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
            While taking a quiz, click the ★ icon next to a question to bookmark it for later review.
          </p>
          <button
            onClick={() => router.push('/dashboard/quizzes')}
            style={{ height: 44, paddingInline: 24, borderRadius: 10, background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Browse Quizzes
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entries.map(({ question, quiz }) => (
            <div
              key={question.id}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    {quiz.title}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: quiz.difficulty === 'beginner' ? 'var(--success)' : quiz.difficulty === 'intermediate' ? 'var(--warning)' : 'var(--error)' }}>
                    {quiz.difficulty}
                  </span>
                </div>
                <p style={{ margin: '0 0 0', fontSize: 14, color: 'var(--text)', lineHeight: 1.6, fontWeight: 500 }}>
                  {question.text}
                </p>
              </div>
              <button
                onClick={() => removeBookmark(question.id)}
                title="Remove bookmark"
                aria-label="Remove bookmark"
                style={{ flexShrink: 0, background: 'rgba(255,76,81,0.07)', border: '1px solid rgba(255,76,81,0.2)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--error)', fontFamily: 'inherit' }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

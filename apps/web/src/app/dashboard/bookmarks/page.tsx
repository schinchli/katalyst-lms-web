'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { quizQuestions, quizzes } from '@/data/quizzes';
import type { Question, Quiz } from '@/types';
import { useManagedQuizContentVersion } from '@/components/ManagedQuizContentProvider';

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

export default function BookmarksPage() {
  const router = useRouter();
  const quizContentVersion = useManagedQuizContentVersion();
  const questionIndex = useMemo(() => buildQuestionIndex(), [quizContentVersion]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('web-bookmarks');
      const parsed: string[] = stored ? (JSON.parse(stored) as string[]) : [];
      setBookmarkedIds(Array.isArray(parsed) ? parsed : []);
    } catch { /* best-effort */ }
    setLoaded(true);
  }, []);

  const removeBookmark = (questionId: string) => {
    const next = bookmarkedIds.filter((id) => id !== questionId);
    setBookmarkedIds(next);
    try { localStorage.setItem('web-bookmarks', JSON.stringify(next)); } catch { /* best-effort */ }
  };

  const entries: BookmarkEntry[] = bookmarkedIds
    .map((id) => questionIndex.get(id))
    .filter((entry): entry is BookmarkEntry => Boolean(entry));

  const handleStartReview = () => {
    if (bookmarkedIds.length === 0) return;
    // Navigate to quiz player with review=bookmarks param.
    // We use the first bookmarked quiz's id as context, but pass review flag.
    router.push(`/dashboard/quiz/${entries[0]?.quiz.id ?? 'review'}?review=bookmarks`);
  };

  if (!loaded) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>;
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 760, margin: '0 auto' }}>
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
                  <span style={{ fontSize: 11, fontWeight: 600, color: quiz.difficulty === 'beginner' ? '#28C76F' : quiz.difficulty === 'intermediate' ? '#FF9F43' : '#FF4C51' }}>
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
                style={{ flexShrink: 0, background: 'rgba(255,76,81,0.07)', border: '1px solid rgba(255,76,81,0.2)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#FF4C51', fontFamily: 'inherit' }}
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

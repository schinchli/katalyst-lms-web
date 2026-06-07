'use client';
export const dynamic = 'force-dynamic';

/**
 * /dashboard/learning-paths/[id]
 *
 * Step-by-step certification path view. Each step links to its quiz
 * (/dashboard/quiz/<resourceId>) or flashcard deck
 * (/dashboard/flashcards/<resourceId>). Quiz completion is read from
 * quiz_results (Supabase) / localStorage so progress reflects real work.
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getLearningPath, type LearningStep } from '@/data/learningPaths';
import { quizzes } from '@/data/quizzes';
import { flashcardDecks } from '@/data/flashcards';
import { supabase } from '@/lib/supabase';
import { getQuizResults } from '@/lib/db';
import type { QuizResult } from '@/types';

function getLocalResults(): QuizResult[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('quiz-results') || '[]') as QuizResult[]; }
  catch { return []; }
}

const FLASH_KEY = (deckId: string) => `flashcards-known-${deckId}`;

function stepHref(step: LearningStep): string | null {
  if (step.type === 'quiz') {
    const quiz = quizzes.find((q) => q.id === step.resourceId && q.enabled !== false);
    return quiz ? `/dashboard/quiz/${step.resourceId}` : null;
  }
  if (step.type === 'flashcard') {
    const deck = flashcardDecks.find((d) => d.id === step.resourceId);
    return deck ? `/dashboard/flashcards/${step.resourceId}` : null;
  }
  return null;
}

export default function LearningPathDetailPage() {
  const params = useParams();
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? '';
  const path = getLearningPath(id);

  const [results, setResults] = useState<QuizResult[]>([]);
  const [flashDone, setFlashDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    setResults(getLocalResults());
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const remote = await getQuizResults(user.id);
      if (remote.length > 0) setResults(remote);
    });

    // Flashcard decks are "done" once at least one card is marked known
    if (typeof window !== 'undefined' && path) {
      const done = new Set<string>();
      for (const step of path.steps) {
        if (step.type === 'flashcard') {
          try {
            const raw = localStorage.getItem(FLASH_KEY(step.resourceId));
            if (raw && (JSON.parse(raw) as string[]).length > 0) done.add(step.id);
          } catch { /* ignore */ }
        }
      }
      setFlashDone(done);
    }
  }, [id]);

  const completedSteps = useMemo(() => {
    if (!path) return new Set<string>();
    const done = new Set<string>();
    for (const step of path.steps) {
      if (step.type === 'quiz' && results.some((r) => r.quizId === step.resourceId)) done.add(step.id);
      if (step.type === 'flashcard' && flashDone.has(step.id)) done.add(step.id);
    }
    return done;
  }, [path, results, flashDone]);

  if (!path) {
    return (
      <div className="page-content">
        <div className="vx-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
          <h5 style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--text)' }}>Path not found</h5>
          <Link href="/dashboard/learning-paths" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: 12 }}>
            Back to Learning Paths
          </Link>
        </div>
      </div>
    );
  }

  const totalMin = path.steps.reduce((s, st) => s + st.estimatedMinutes, 0);
  const progressPct = Math.round((completedSteps.size / path.steps.length) * 100);
  const firstIncomplete = path.steps.find((s) => !completedSteps.has(s.id));

  return (
    <div className="page-content">
      {/* ── Breadcrumb ── */}
      <Link href="/dashboard/learning-paths" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        ← All Learning Paths
      </Link>

      {/* ── Path Header ── */}
      <div className="vx-card" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
        <div style={{ height: 5, background: path.color }} />
        <div style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <span className="vx-badge" style={{ background: `${path.color}20`, color: path.color, fontWeight: 700, marginBottom: 10, display: 'inline-block' }}>
                {path.certCode}
              </span>
              <h4 style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 24, color: 'var(--text)' }}>{path.certName}</h4>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 640 }}>{path.tagline}</p>
              <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 13, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                <span>📚 {path.steps.length} steps</span>
                <span>⏱ {(totalMin / 60).toFixed(1)} hours</span>
                <span>🎯 {path.difficulty}</span>
              </div>
            </div>

            {/* Progress ring */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', width: 84, height: 84 }}>
                <svg width="84" height="84" viewBox="0 0 84 84" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="42" cy="42" r="36" fill="none" stroke="var(--border)" strokeWidth="7" />
                  <circle cx="42" cy="42" r="36" fill="none" stroke={path.color} strokeWidth="7" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 36}
                    strokeDashoffset={2 * Math.PI * 36 * (1 - progressPct / 100)} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>
                  {progressPct}%
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>{completedSteps.size}/{path.steps.length} done</div>
            </div>
          </div>

          {firstIncomplete && stepHref(firstIncomplete) && (
            <Link href={stepHref(firstIncomplete)!} className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: 18 }}>
              {completedSteps.size === 0 ? 'Start Path' : 'Continue'} → {firstIncomplete.title}
            </Link>
          )}
        </div>
      </div>

      {/* ── Steps ── */}
      <div className="vx-card" style={{ padding: 0 }}>
        {path.steps.map((step, idx) => {
          const done = completedSteps.has(step.id);
          const href = stepHref(step);
          const isNext = firstIncomplete?.id === step.id;
          const inner = (
            <div
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 22px',
                borderBottom: idx < path.steps.length - 1 ? '1px solid var(--border)' : 'none',
                background: isNext ? `${path.color}0C` : 'transparent',
                transition: 'background 0.12s',
                cursor: href ? 'pointer' : 'default',
                opacity: href ? 1 : 0.55,
              }}
            >
              {/* Step number / check */}
              <div style={{
                flexShrink: 0, width: 30, height: 30, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                background: done ? path.color : 'var(--bg)',
                color: done ? '#fff' : 'var(--text-secondary)',
                border: done ? 'none' : `2px solid var(--border)`,
              }}>
                {done ? '✓' : idx + 1}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{step.title}</span>
                  <span className="vx-badge vx-badge-secondary" style={{ fontSize: 10 }}>
                    {step.type === 'flashcard' ? '🃏 Flashcards' : '📝 Quiz'}
                  </span>
                  {isNext && <span className="vx-badge" style={{ fontSize: 10, background: `${path.color}20`, color: path.color }}>Up next</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{step.subtitle}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>{step.why}</div>
              </div>

              <span style={{ flexShrink: 0, fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{step.estimatedMinutes}m</span>
            </div>
          );

          return href ? (
            <Link key={step.id} href={href} style={{ textDecoration: 'none', display: 'block' }}
              onMouseEnter={(e) => (e.currentTarget.firstElementChild as HTMLElement).style.background = isNext ? `${path.color}18` : 'var(--bg)'}
              onMouseLeave={(e) => (e.currentTarget.firstElementChild as HTMLElement).style.background = isNext ? `${path.color}0C` : 'transparent'}>
              {inner}
            </Link>
          ) : (
            <div key={step.id} title="Content coming soon">{inner}</div>
          );
        })}
      </div>
    </div>
  );
}

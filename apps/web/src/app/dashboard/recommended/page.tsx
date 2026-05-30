'use client';
export const dynamic = 'force-dynamic';

/**
 * /dashboard/recommended
 *
 * Personalized study path derived from the caller's quiz history.
 * Calls /api/learning-paths/from-quiz-history which:
 *   1. Loads recent quiz_results for the user
 *   2. Identifies wrong-answered questions
 *   3. Embeds each wrong question, aggregates top-k matches across
 *      all corpora in knowledge_chunks
 *   4. Returns a ranked recommendation list
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Recommendation {
  id:          string;
  corpus:      string;
  source_type: string;
  title:       string | null;
  content:     string;
  metadata:    Record<string, unknown>;
  similarity:  number;
  matched:     number;
}

interface WrongQ {
  id:       string;
  quiz_id:  string;
  category: string;
  text:     string;
}

interface Response {
  ok:               true;
  empty_reason?:    'no_history' | 'all_correct';
  message?:         string;
  wrong_questions:  WrongQ[];
  recommendations:  Recommendation[];
}

const CORPUS_COLORS: Record<string, string> = {
  'eks-coreks':            '#4A90E2',
  'clf-c02':               '#27AE60',
  'aip-c01':               '#F39C12',
  'flashcards':            '#9B59B6',
  'eks-coreks-questions':  '#1ABC9C',
  'generated-flashcards':  '#E74C3C',
};

export default function RecommendedPage() {
  const [status,   setStatus]   = useState<'loading' | 'ok' | 'unauth' | 'error'>('loading');
  const [data,     setData]     = useState<Response | null>(null);
  const [errMsg,   setErrMsg]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          if (!cancelled) setStatus('unauth');
          return;
        }
        const res = await fetch('/api/learning-paths/from-quiz-history?limit=10&recentResults=20&maxWrong=10', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.ok) {
          setErrMsg(typeof json.error === 'string' ? json.error : 'request failed');
          setStatus('error');
          return;
        }
        setData(json as Response);
        setStatus('ok');
      } catch (e) {
        if (cancelled) return;
        setErrMsg(e instanceof Error ? e.message : 'unknown error');
        setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="page-content" style={{ maxWidth: 880 }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(115,103,240,0.12), rgba(74,144,226,0.08))',
        border: '1px solid rgba(115,103,240,0.25)',
        borderRadius: 14,
        padding: '24px 28px',
        marginBottom: 20,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #7367F0, #4A90E2)' }} />
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>
          Personalised · RAG
        </div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
          🧭 Study these next
        </h2>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--muted)', lineHeight: 1.55, maxWidth: 640 }}>
          We look at your recent quiz answers, find the concepts you got wrong, and surface the
          most relevant chunks from the LearnKloud knowledge base. Ranked by how many of your gaps
          each chunk addresses.
        </p>
      </div>

      {/* States */}
      {status === 'loading' && <LoadingSpinner />}
      {status === 'unauth' && (
        <div style={{ padding: 20, background: 'var(--card-bg, #fff)',
          border: '1px solid var(--border)', borderRadius: 12 }}>
          <p style={{ margin: '0 0 12px', color: 'var(--muted)' }}>
            Sign in to see recommendations based on your quiz history.
          </p>
          <Link href="/login" className="vx-btn vx-btn-primary vx-btn-sm">Sign in</Link>
        </div>
      )}
      {status === 'error' && (
        <div style={{
          background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.3)',
          borderRadius: 10, padding: '12px 16px', color: '#c0392b', fontSize: 13,
        }}>
          ⚠ Couldn&apos;t compute recommendations: {errMsg}
        </div>
      )}

      {status === 'ok' && data && (
        <>
          {data.empty_reason && (
            <div style={{
              background: 'var(--card-bg, #fff)',
              border: '1px solid var(--border)',
              borderRadius: 12, padding: 24, textAlign: 'center',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>
                {data.empty_reason === 'no_history' ? '📝' : '🎯'}
              </div>
              <p style={{ margin: '0 0 14px', color: 'var(--text)', fontSize: 14, lineHeight: 1.6 }}>
                {data.message}
              </p>
              <Link href="/dashboard/quizzes" className="vx-btn vx-btn-primary vx-btn-sm">
                Browse quizzes
              </Link>
            </div>
          )}

          {data.wrong_questions.length > 0 && (
            <div style={{
              background: 'var(--card-bg, #fff)',
              border: '1px solid var(--border)',
              borderRadius: 12, padding: '14px 18px', marginBottom: 14,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
                Based on {data.wrong_questions.length} question{data.wrong_questions.length === 1 ? '' : 's'} you got wrong recently
              </div>
              <details>
                <summary style={{ cursor: 'pointer', fontSize: 12, color: 'var(--primary)' }}>
                  Show the questions
                </summary>
                <ul style={{ margin: '10px 0 0', paddingLeft: 20, display: 'grid', gap: 6 }}>
                  {data.wrong_questions.map((q) => (
                    <li key={q.id} style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--muted)' }}>{q.category}</strong> · {q.text}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          )}

          {data.recommendations.length > 0 && (
            <div style={{ display: 'grid', gap: 10 }}>
              {data.recommendations.map((rec, i) => {
                const color = CORPUS_COLORS[rec.corpus] ?? '#7367F0';
                const meta = rec.metadata as { module?: string; topic?: string; deck_id?: string };
                return (
                  <div key={rec.id} style={{
                    background: 'var(--card-bg, #fff)',
                    border: '1px solid var(--border)',
                    borderLeft: `3px solid ${color}`,
                    borderRadius: 10, padding: '14px 16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)',
                        letterSpacing: '0.06em' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
                        background: `${color}20`, color, padding: '2px 8px', borderRadius: 10,
                      }}>
                        {rec.corpus}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {meta?.module ? `M${meta.module} · ` : ''}{rec.source_type}
                        {meta?.topic ? ` · ${meta.topic}` : ''}
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--muted)' }}>
                        Matches {rec.matched} gap{rec.matched === 1 ? '' : 's'} · {Math.round(rec.similarity * 100)}%
                      </span>
                    </div>
                    {rec.title && (
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                        {rec.title}
                      </div>
                    )}
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', lineHeight: 1.6,
                      whiteSpace: 'pre-wrap' }}>
                      {rec.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

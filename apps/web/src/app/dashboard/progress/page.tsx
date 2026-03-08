'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { quizzes } from '@/data/quizzes';
import type { QuizResult } from '@/types';
import { supabase } from '@/lib/supabase';
import { getQuizResults } from '@/lib/db';

function getLocalResults(): QuizResult[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('quiz-results') || '[]'); } catch { return []; }
}

export default function ProgressPage() {
  const [results, setResults] = useState<QuizResult[]>([]);

  useEffect(() => {
    // Start with localStorage for immediate display
    setResults(getLocalResults());

    // Then load from Supabase if authenticated
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const supabaseResults = await getQuizResults(user.id);
      if (supabaseResults.length > 0) {
        setResults(supabaseResults);
        // Keep localStorage in sync
        try { localStorage.setItem('quiz-results', JSON.stringify(supabaseResults)); } catch { /* best-effort */ }
      }
    });
  }, []);

  const completed = new Set(results.map((r) => r.quizId));
  const avgScore  = results.length ? Math.round(results.reduce((s, r) => s + Math.round((r.score / r.totalQuestions) * 100), 0) / results.length) : 0;
  const bestScore = results.length ? Math.max(...results.map((r) => Math.round((r.score / r.totalQuestions) * 100))) : 0;
  const pct       = Math.round((completed.size / quizzes.length) * 100);

  const stats = [
    { val: `${pct}%`,       label: 'Completion',    color: 'var(--primary)',   bg: 'var(--primary-light)' },
    { val: `${avgScore}%`,  label: 'Average Score', color: '#FF9F43',          bg: '#FF9F4318' },
    { val: `${bestScore}%`, label: 'Best Score',    color: '#28C76F',          bg: '#28C76F18' },
    { val: results.length,  label: 'Quizzes Taken', color: '#FF4C51',          bg: '#FF4C5118' },
  ];

  return (
    <div className="page-content" style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">My Progress</h1>
        <p className="page-subtitle">Track your Katalyst learning journey</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Overall progress bar */}
      <div className="completion-card" style={{ marginBottom: 24 }}>
        <div className="completion-header">
          <h3 className="completion-title">Overall Completion</h3>
          <span className="completion-pct" style={{ color: 'var(--primary)' }}>{pct}%</span>
        </div>
        <div className="progress-bar" style={{ height: 10 }}>
          <div className="progress-fill" style={{ width: `${pct}%`, background: 'var(--primary)' }} />
        </div>
        <div className="completion-sub" style={{ marginTop: 10 }}>
          {completed.size} of {quizzes.length} quizzes completed
        </div>
      </div>

      {/* History table */}
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Quiz History</h3>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{results.length} entries</span>
        </div>

        {results.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No quizzes completed yet.{' '}
            <Link href="/dashboard/quizzes" style={{ color: 'var(--primary-text)', fontWeight: 600 }}>Start your first quiz →</Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                {['Quiz', 'Score', 'Questions', 'Date', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.6 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.slice().reverse().map((r, i) => {
                const q    = quizzes.find((q) => q.id === r.quizId);
                const pct  = Math.round((r.score / r.totalQuestions) * 100);
                const pass = pct >= 70;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 24px', fontWeight: 500, fontSize: 14 }}>{q?.title ?? r.quizId}</td>
                    <td style={{ padding: '14px 24px' }}>
                      <span style={{ fontWeight: 700, color: pass ? '#28C76F' : '#FF4C51', fontSize: 15 }}>{pct}%</span>
                    </td>
                    <td style={{ padding: '14px 24px', fontSize: 13, color: 'var(--text-secondary)' }}>{r.score}/{r.totalQuestions}</td>
                    <td style={{ padding: '14px 24px', fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(r.completedAt).toLocaleDateString()}</td>
                    <td style={{ padding: '14px 24px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: pass ? '#28C76F18' : '#FF4C5118', color: pass ? '#28C76F' : '#FF4C51' }}>
                        {pass ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

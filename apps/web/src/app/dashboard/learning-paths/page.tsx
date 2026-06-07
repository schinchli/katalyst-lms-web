'use client';
export const dynamic = 'force-dynamic';

/**
 * /dashboard/learning-paths
 *
 * Lists all structured certification learning paths (CLF-C02, AIP-C01,
 * GenAI Foundations, AWS Fundamentals A–Z). Each path is a sequenced
 * set of flashcard + quiz steps. Mirrors the mobile My Track experience.
 */
import Link from 'next/link';
import { LEARNING_PATHS } from '@/data/learningPaths';

function totalMinutes(steps: { estimatedMinutes: number }[]) {
  return steps.reduce((sum, s) => sum + s.estimatedMinutes, 0);
}

export default function LearningPathsPage() {
  return (
    <div className="page-content">
      {/* ── Page Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 22, color: 'var(--text)' }}>Learning Paths</h4>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
          Structured, step-by-step certification tracks — flashcards and quizzes in exam-ready order.
        </p>
      </div>

      {/* ── Path Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {LEARNING_PATHS.map((path) => {
          const mins = totalMinutes(path.steps);
          const hours = (mins / 60).toFixed(1);
          const quizCount = path.steps.filter((s) => s.type === 'quiz').length;
          const flashCount = path.steps.filter((s) => s.type === 'flashcard').length;

          return (
            <Link
              key={path.id}
              href={`/dashboard/learning-paths/${path.id}`}
              className="quiz-card"
              style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
            >
              {/* Accent bar */}
              <div style={{ height: 4, background: path.color, borderRadius: '8px 8px 0 0' }} />

              <div style={{ padding: '20px 20px 14px', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span
                    className="vx-badge"
                    style={{ background: `${path.color}20`, color: path.color, fontWeight: 700 }}
                  >
                    {path.certCode}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{hours}h · {path.difficulty}</span>
                </div>

                <h6 style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 17, color: 'var(--text)', lineHeight: 1.3 }}>
                  {path.certName}
                </h6>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {path.tagline}
                </p>
              </div>

              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <span>{path.steps.length} steps</span>
                  <span>{flashCount} 🃏</span>
                  <span>{quizCount} 📝</span>
                </div>
                <span style={{ color: path.color, fontWeight: 700, fontSize: 13 }}>Start →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

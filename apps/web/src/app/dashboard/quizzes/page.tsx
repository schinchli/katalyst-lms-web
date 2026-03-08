'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { quizzes } from '@/data/quizzes';
import { useSubscription } from '@/hooks/useSubscription';
import { AdBanner } from '@/components/AdBanner';
import type { Quiz, QuizResult } from '@/types';
import { supabase } from '@/lib/supabase';
import { getQuizResults } from '@/lib/db';

// ── Cloud providers ───────────────────────────────────────────────────────────
const PROVIDERS = [
  { key: 'all',        label: 'All',          emoji: '🌐', color: '#7367F0', available: true  },
  { key: 'aws',        label: 'AWS',          emoji: '☁️',  color: '#FF9900', available: true  },
  { key: 'azure',      label: 'Azure',        emoji: '🔷', color: '#0078D4', available: false },
  { key: 'gcp',        label: 'Google Cloud', emoji: '🔵', color: '#4285F4', available: false },
  { key: 'nvidia',     label: 'Nvidia',       emoji: '🟢', color: '#76B900', available: false },
  { key: 'kubernetes', label: 'Kubernetes',   emoji: '⚙️',  color: '#326CE5', available: false },
] as const;
type ProviderKey = (typeof PROVIDERS)[number]['key'];

// ── All AWS certifications grouped by level ───────────────────────────────────
const AWS_CERT_GROUPS = [
  {
    level: 'Foundational', color: '#28C76F', emoji: '🟢',
    certs: [
      { code: 'CLF-C02', label: 'Cloud Practitioner'         },
    ],
  },
  {
    level: 'Associate', color: '#00BAD1', emoji: '🔵',
    certs: [
      { code: 'SAA-C03', label: 'Solutions Architect'        },
      { code: 'DVA-C02', label: 'Developer'                  },
      { code: 'SOA-C02', label: 'SysOps Administrator'       },
    ],
  },
  {
    level: 'Professional', color: '#FF9F43', emoji: '🟡',
    certs: [
      { code: 'SAP-C02', label: 'Solutions Architect Pro'    },
      { code: 'DOP-C02', label: 'DevOps Engineer'            },
    ],
  },
  {
    level: 'Specialty', color: '#FF4C51', emoji: '🔴',
    certs: [
      { code: 'ANS-C01', label: 'Advanced Networking'        },
      { code: 'SCS-C02', label: 'Security'                   },
      { code: 'MLS-C01', label: 'Machine Learning'           },
      { code: 'DBS-C01', label: 'Database'                   },
      { code: 'DAS-C01', label: 'Data Analytics'             },
      { code: 'PAS-C01', label: 'SAP on AWS'                 },
    ],
  },
  {
    level: 'AI & ML', color: '#7367F0', emoji: '🤖',
    certs: [
      { code: 'AIF-C01', label: 'AI Practitioner'            },
      { code: 'MLA-C01', label: 'ML Engineer Associate'      },
      { code: 'DEA-C01', label: 'Data Engineer Associate'    },
    ],
  },
] as const;

const DIFFICULTIES = [
  { key: 'all',          label: 'All Levels'    },
  { key: 'beginner',     label: 'Beginner'      },
  { key: 'intermediate', label: 'Intermediate'  },
  { key: 'advanced',     label: 'Advanced'      },
] as const;

// Derive provider from quiz fields
function quizProvider(q: Quiz): string {
  if (q.provider) return q.provider;
  const cat = q.category as string;
  if (cat.startsWith('az-'))  return 'azure';
  if (cat.startsWith('gcp-')) return 'gcp';
  if (cat.startsWith('nv-'))  return 'nvidia';
  if (cat.startsWith('k8s-')) return 'kubernetes';
  return 'aws';
}

const DIFF_COLOR: Record<string, string> = { beginner: '#28C76F', intermediate: '#FF9F43', advanced: '#FF4C51' };
const DIFF_STARS: Record<string, number>  = { beginner: 1, intermediate: 2, advanced: 3 };

function getLocalResults(): QuizResult[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('quiz-results') || '[]'); } catch { return []; }
}

// Inline search match highlighter
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: '#FF9F4340', color: 'inherit', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function QuizzesPage() {
  const [selectedProvider,   setSelectedProvider]   = useState<ProviderKey>('all');
  const [selectedCert,       setSelectedCert]       = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [search,             setSearch]             = useState('');
  const [results,            setResults]            = useState<QuizResult[]>([]);
  const { canAccess } = useSubscription();

  useEffect(() => {
    setResults(getLocalResults());
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const supabaseResults = await getQuizResults(user.id);
      if (supabaseResults.length > 0) {
        setResults(supabaseResults);
        try { localStorage.setItem('quiz-results', JSON.stringify(supabaseResults)); } catch { /* best-effort */ }
      }
    });
  }, []);

  // Counts per exam code (used for cert filter badges)
  const certCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    quizzes.forEach((q) => {
      if (q.examCode) counts[q.examCode] = (counts[q.examCode] ?? 0) + 1;
    });
    return counts;
  }, []);

  const handleProviderSelect = (key: ProviderKey) => {
    setSelectedProvider(key);
    setSelectedCert('all');
    setSelectedDifficulty('all');
  };

  const clearAll = () => {
    setSelectedProvider('all');
    setSelectedCert('all');
    setSelectedDifficulty('all');
    setSearch('');
  };

  const hasActiveFilters =
    (selectedProvider as string) !== 'all' ||
    selectedCert       !== 'all' ||
    selectedDifficulty !== 'all' ||
    search.trim() !== '';

  // Composable filter: provider + cert + difficulty + search all stack
  const filtered = useMemo(() => {
    return quizzes.filter((q) => {
      if ((selectedProvider as string) !== 'all' && quizProvider(q) !== selectedProvider) return false;
      if (selectedCert !== 'all' && (q.examCode ?? '').toUpperCase() !== selectedCert) return false;
      if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        return (
          q.title.toLowerCase().includes(s) ||
          q.description.toLowerCase().includes(s) ||
          (q.examCode ?? '').toLowerCase().includes(s) ||
          q.category.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [selectedProvider, selectedCert, selectedDifficulty, search]);

  const completed   = new Set(results.map((r) => r.quizId));
  const providerCfg = PROVIDERS.find((p) => p.key === selectedProvider);
  const comingSoon  = (selectedProvider as string) !== 'all' && providerCfg && !providerCfg.available;
  const showCerts   = (selectedProvider as string) === 'all' || selectedProvider === 'aws';

  // Provider quiz counts for filter badges
  const providerCount = (key: string) =>
    key === 'all' ? quizzes.length : quizzes.filter((q) => quizProvider(q) === key).length;

  return (
    <div className="page-content">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Certification Library</h1>
          <p className="page-subtitle">
            {quizzes.length} quizzes · {quizzes.reduce((s, q) => s + q.questionCount, 0).toLocaleString()} questions
          </p>
        </div>
        <div className="stat-badges">
          {[
            { val: quizzes.length,  label: 'Quizzes',  color: 'var(--primary-text)', bg: 'var(--primary-light)' },
            { val: quizzes.reduce((s, q) => s + q.questionCount, 0), label: 'Questions', color: '#FF9F43', bg: '#FF9F4318' },
            { val: completed.size,  label: 'Done',     color: '#28C76F',              bg: '#28C76F18' },
          ].map((s) => (
            <div key={s.label} className="stat-badge" style={{ background: s.bg }}>
              <div className="stat-value" style={{ color: s.color }}>{s.val}</div>
              <div className="stat-label"  style={{ color: s.color }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Two-column layout ────────────────────────────────────────────────── */}
      <div className="quizzes-layout">

        {/* ═══ LEFT: Filter panel ════════════════════════════════════════════ */}
        <aside className="filter-panel">

          {/* Header */}
          <div className="fp-header">
            <span className="fp-title">Filters</span>
            {hasActiveFilters && (
              <button className="fp-clear-btn" onClick={clearAll}>Clear all</button>
            )}
          </div>

          {/* ── Cloud Provider ── */}
          <div className="fp-section">
            <div className="fp-section-label">Cloud Provider</div>
            {PROVIDERS.map((p) => {
              const active = selectedProvider === p.key;
              const count  = providerCount(p.key);
              return (
                <button
                  key={p.key}
                  className={`fp-option${active ? ' active' : ''}`}
                  onClick={() => handleProviderSelect(p.key as ProviderKey)}
                >
                  <span className="fp-radio-dot">{active ? '●' : '○'}</span>
                  <span className="fp-opt-emoji">{p.emoji}</span>
                  <span className="fp-opt-label">{p.label}</span>
                  {p.available
                    ? <span className="fp-opt-count">{count}</span>
                    : <span className="fp-opt-soon">Soon</span>
                  }
                </button>
              );
            })}
          </div>

          {/* ── AWS Certifications (visible when All or AWS selected) ── */}
          {showCerts && !comingSoon && (
            <div className="fp-section">
              <div className="fp-section-label">AWS Certifications</div>

              {/* All certs option */}
              <button
                className={`fp-option${selectedCert === 'all' ? ' active' : ''}`}
                onClick={() => setSelectedCert('all')}
              >
                <span className="fp-radio-dot">{selectedCert === 'all' ? '●' : '○'}</span>
                <span className="fp-opt-label">All Certifications</span>
                <span className="fp-opt-count">{quizzes.filter((q) => quizProvider(q) === 'aws').length}</span>
              </button>

              {AWS_CERT_GROUPS.map((group) => (
                <div key={group.level} className="fp-cert-group">
                  <div className="fp-cert-level-hd" style={{ color: group.color }}>
                    {group.emoji} {group.level}
                  </div>
                  {group.certs.map((cert) => {
                    const count  = certCounts[cert.code] ?? 0;
                    const active = selectedCert === cert.code;
                    return (
                      <button
                        key={cert.code}
                        className={`fp-option fp-cert-item${active ? ' active' : ''}${count === 0 ? ' fp-cert-none' : ''}`}
                        onClick={() => setSelectedCert(cert.code)}
                      >
                        <span className="fp-radio-dot">{active ? '●' : '○'}</span>
                        <span className="fp-opt-label">{cert.label}</span>
                        <span className="fp-cert-code">{cert.code}</span>
                        {count > 0
                          ? <span className="fp-opt-count">{count}</span>
                          : <span className="fp-opt-soon">Soon</span>
                        }
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* ── Difficulty ── */}
          <div className="fp-section" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
            <div className="fp-section-label">Difficulty</div>
            {DIFFICULTIES.map((d) => {
              const active = selectedDifficulty === d.key;
              return (
                <button
                  key={d.key}
                  className={`fp-option${active ? ' active' : ''}`}
                  onClick={() => setSelectedDifficulty(d.key)}
                >
                  <span className="fp-radio-dot">{active ? '●' : '○'}</span>
                  <span className="fp-opt-label">{d.label}</span>
                  {d.key !== 'all' && (
                    <span className="fp-opt-count">
                      {quizzes.filter((q) => q.difficulty === d.key).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

        </aside>

        {/* ═══ RIGHT: Search + results ═══════════════════════════════════════ */}
        <div className="quizzes-results">

          {/* Search bar */}
          <div className="quiz-search-bar" style={{ marginBottom: 12 }}>
            <svg className="quiz-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="quiz-search-input"
              type="text"
              placeholder="Search quizzes, topics, exam codes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
            {search && (
              <button className="quiz-search-clear" onClick={() => setSearch('')} aria-label="Clear">✕</button>
            )}
          </div>

          {/* Result count */}
          {!comingSoon && (
            <p className="courses-count" style={{ marginBottom: 12 }}>
              {filtered.length} {filtered.length === 1 ? 'quiz' : 'quizzes'}
              {search.trim() && <span style={{ color: 'var(--text-secondary)' }}> matching &ldquo;{search}&rdquo;</span>}
              {selectedCert !== 'all' && <span style={{ color: 'var(--text-secondary)' }}> · {selectedCert}</span>}
            </p>
          )}

          <AdBanner format="horizontal" />

          {/* ── Coming soon (non-available provider) ── */}
          {comingSoon ? (
            <div className="coming-soon-state">
              <div className="coming-soon-emoji">{providerCfg?.emoji}</div>
              <h2 className="coming-soon-title">{providerCfg?.label} content is coming</h2>
              <p className="coming-soon-text">
                We&apos;re building {providerCfg?.label} certification practice questions.
                Start with AWS Cloud Practitioner while you wait — it&apos;s free to begin.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn-primary" onClick={() => handleProviderSelect('aws')}>
                  ☁️ Browse AWS Quizzes
                </button>
                <button
                  onClick={clearAll}
                  style={{ height: 40, padding: '0 20px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  View All
                </button>
              </div>
            </div>

          ) : filtered.length === 0 ? (

            /* ── Empty search / cert state ── */
            <div className="coming-soon-state">
              {selectedCert !== 'all' && certCounts[selectedCert] === undefined ? (
                <>
                  <div className="coming-soon-emoji">🏗️</div>
                  <h2 className="coming-soon-title">{selectedCert} practice is coming</h2>
                  <p className="coming-soon-text">
                    We&apos;re writing expertly crafted questions for {selectedCert}.
                    While you wait, sharpen your fundamentals with CLF-C02 — free to begin.
                  </p>
                  <button className="btn-primary" onClick={() => setSelectedCert('CLF-C02')}>
                    Start CLF-C02 →
                  </button>
                </>
              ) : (
                <>
                  <div className="coming-soon-emoji">🔍</div>
                  <h2 className="coming-soon-title">No quizzes match your filters</h2>
                  <p className="coming-soon-text">Try a different keyword, cert, or difficulty level.</p>
                  <button className="btn-primary" onClick={clearAll}>Clear all filters</button>
                </>
              )}
            </div>

          ) : (

            /* ── Quiz grid ── */
            <div className="quiz-grid">
              {filtered.map((quiz) => {
                const accent   = DIFF_COLOR[quiz.difficulty] ?? '#28C76F';
                const stars    = DIFF_STARS[quiz.difficulty] ?? 1;
                const done     = completed.has(quiz.id);
                const res      = results.find((r) => r.quizId === quiz.id);
                const scorePct = res ? Math.round((res.score / res.totalQuestions) * 100) : null;
                const locked   = quiz.isPremium && !canAccess(quiz.id);
                const prov     = PROVIDERS.find((p) => p.key === quizProvider(quiz));

                return (
                  <Link key={quiz.id} href={`/dashboard/quiz/${quiz.id}`} className="quiz-card">
                    <div className="card-body">
                      {/* Provider + cert tags */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                        {prov && (prov.key as string) !== 'all' && (
                          <span className="card-provider-tag" style={{ background: prov.color + '18', color: prov.color }}>
                            {prov.emoji} {prov.label}
                          </span>
                        )}
                        <span className="card-cat" style={{ background: accent + '14', color: accent, margin: 0 }}>
                          {quiz.examCode ?? quiz.category.toUpperCase()}
                        </span>
                      </div>

                      <div className="card-title">
                        <Highlight text={quiz.title} query={search} />
                      </div>
                      <div className="card-desc">
                        <Highlight
                          text={quiz.description.slice(0, 90) + (quiz.description.length > 90 ? '…' : '')}
                          query={search}
                        />
                      </div>

                      <div className="card-stars">
                        {[1, 2, 3].map((n) => (
                          <span key={n} style={{ color: n <= stars ? accent : 'var(--border)', fontSize: 13 }}>★</span>
                        ))}
                        <span className="card-stars-label" style={{ color: accent }}>
                          {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                        </span>
                        {done && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#28C76F' }}>✓ Done</span>}
                      </div>

                      <hr className="card-divider" />

                      <div className="card-footer">
                        <div className="card-meta">
                          {quiz.questionCount} questions · {quiz.duration}m
                          {scorePct !== null && (
                            <span className={scorePct >= 70 ? 'score-pass' : 'score-fail'}> · {scorePct}%</span>
                          )}
                        </div>
                        <div className="btn-start" style={locked ? { background: '#FF9F4318', color: '#FF9F43' } : undefined}>
                          {locked ? `🔒 ₹${quiz.price}` : 'Start →'}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <AdBanner format="horizontal" />
        </div>
      </div>
    </div>
  );
}

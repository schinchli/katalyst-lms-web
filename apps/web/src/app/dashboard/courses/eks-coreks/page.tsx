'use client';
export const dynamic = 'force-dynamic';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { quizzes } from '@/data/quizzes';
import { eksCoreksFlashcardDecks } from '@/data/eks-coreks-flashcards';
import {
  content_graph,
  conceptsInModule,
  getConcept,
  getModule,
  nextPages,
  pathToConcept,
  topologicalConcepts,
  type EksConcept,
  type EksModule,
} from '@/data/eks-coreks-graph';

const LABS_BASE_URL = process.env.NEXT_PUBLIC_LABS_BASE_URL ?? 'https://labs.learnkloud.today';
const RAG_CHUNK_COUNT = 1021;

interface AskSource {
  corpus:      string;
  source_type: string;
  title:       string | null;
  metadata: {
    module?:       string;
    module_title?: string;
    topic?:        string | null;
  } & Record<string, unknown>;
  similarity:  number;
}

// ═══════════════════════════════════════════════════════════════════════
// Learning Path — uses the content_graph to render concepts in topological
// order (prerequisite-aware). A target concept picker narrows the path to
// just the prerequisite closure of the chosen concept.
// ═══════════════════════════════════════════════════════════════════════
function ConceptCard({ concept, color, position }: {
  concept:  EksConcept;
  color:    string;
  position: number;
}) {
  const prereqs = concept.prerequisites
    .map((id) => getConcept(id))
    .filter((c): c is EksConcept => Boolean(c));
  const next = nextPages(concept.id, 3);
  return (
    <div style={{
      background: 'var(--card-bg, #fff)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${color}`,
      borderRadius: 8,
      padding: '12px 14px 12px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)',
          letterSpacing: '0.06em', minWidth: 24 }}>
          {String(position).padStart(2, '0')}
        </span>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
          {concept.title}
        </span>
      </div>
      <p style={{ margin: '4px 0 8px 32px', fontSize: 12, color: 'var(--muted)', lineHeight: 1.55 }}>
        {concept.summary}
      </p>
      {prereqs.length > 0 && (
        <div style={{ marginLeft: 32, marginBottom: next.length ? 6 : 0,
          display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600,
            letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Requires
          </span>
          {prereqs.map((p) => (
            <span key={p.id} style={{
              background: 'rgba(115,103,240,0.08)',
              border: '1px solid rgba(115,103,240,0.2)',
              borderRadius: 12, padding: '1px 8px', fontSize: 10,
              color: 'var(--primary)',
            }}>
              {p.title}
            </span>
          ))}
        </div>
      )}
      {next.length > 0 && (
        <div style={{ marginLeft: 32, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600,
            letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Read next
          </span>
          {next.map((p) => (
            <a key={p.id} href={`${LABS_BASE_URL}/${p.url}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                fontSize: 11, color: color, textDecoration: 'none',
                borderBottom: `1px dashed ${color}55`,
              }}>
              ↗ {p.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function ModuleSection({ module, concepts, startIndex }: {
  module:     EksModule;
  concepts:   EksConcept[];
  startIndex: number;
}) {
  if (!concepts.length) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
        paddingBottom: 8, borderBottom: `1px solid ${module.color}33`,
      }}>
        <span style={{ fontSize: 20 }}>{module.icon}</span>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)',
            letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {module.badge}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
            {module.title}
          </div>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>
          {concepts.length} concept{concepts.length === 1 ? '' : 's'}
        </span>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {concepts.map((c, i) => (
          <ConceptCard key={c.id} concept={c} color={module.color} position={startIndex + i + 1} />
        ))}
      </div>
    </div>
  );
}

function LearningPath() {
  const [targetId, setTargetId] = useState<string>('');

  const allConcepts = useMemo(() => topologicalConcepts(), []);
  const targetedConcepts = useMemo(
    () => (targetId ? pathToConcept(targetId) : null),
    [targetId],
  );

  const concepts = targetedConcepts ?? allConcepts;

  // Group concepts by module, keeping topological order within each module.
  const groups = useMemo(() => {
    const byModule = new Map<string, EksConcept[]>();
    concepts.forEach((c) => {
      const arr = byModule.get(c.module) ?? [];
      arr.push(c);
      byModule.set(c.module, arr);
    });
    let runningIndex = 0;
    return content_graph.modules
      .filter((m) => byModule.has(m.id))
      .map((m) => {
        const list = byModule.get(m.id) ?? [];
        const startIndex = runningIndex;
        runningIndex += list.length;
        return { module: m, concepts: list, startIndex };
      });
  }, [concepts]);

  const targetConcept = targetId ? getConcept(targetId) : null;
  const targetModule  = targetConcept ? getModule(targetConcept.module) : null;

  return (
    <div>
      <div style={{
        background: 'var(--card-bg, #fff)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 20,
      }}>
        <label htmlFor="lp-target" style={{
          display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
          textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6,
        }}>
          I want to learn about
        </label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            id="lp-target"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            style={{
              flex: '1 1 280px', padding: '8px 10px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--card-bg, #fff)',
              color: 'var(--text)', fontFamily: 'inherit', fontSize: 13,
            }}
          >
            <option value="">— Full path (all {allConcepts.length} concepts) —</option>
            {content_graph.modules.map((m) => (
              <optgroup key={m.id} label={`${m.badge} — ${m.title}`}>
                {conceptsInModule(m.id).map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </optgroup>
            ))}
          </select>
          {targetId && (
            <button onClick={() => setTargetId('')} className="vx-btn vx-btn-outline-secondary vx-btn-sm">
              Clear
            </button>
          )}
        </div>
        {targetConcept && targetModule && (
          <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--muted)', lineHeight: 1.55 }}>
            To learn <strong style={{ color: targetModule.color }}>{targetConcept.title}</strong>,
            you&apos;ll cover {concepts.length} concept{concepts.length === 1 ? '' : 's'} in topological order.
            Each concept&apos;s prerequisites are shown beneath its title — work through them in order.
          </p>
        )}
        {!targetConcept && (
          <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--muted)', lineHeight: 1.55 }}>
            Default view walks all {allConcepts.length} concepts in prerequisite-aware order.
            Pick a target concept above to narrow to just the path leading to it.
          </p>
        )}
      </div>

      {groups.map(({ module, concepts: list, startIndex }) => (
        <ModuleSection key={module.id} module={module} concepts={list} startIndex={startIndex} />
      ))}
    </div>
  );
}

function EksAskChat() {
  const [question,  setQuestion]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [answer,    setAnswer]    = useState<string | null>(null);
  const [sources,   setSources]   = useState<AskSource[]>([]);
  const [error,     setError]     = useState<string | null>(null);
  const [lastAsked, setLastAsked] = useState<string | null>(null);

  async function ask(q: string) {
    const trimmed = q.trim();
    if (!trimmed || loading) return;
    setLoading(true); setError(null); setAnswer(null); setSources([]); setLastAsked(trimmed);
    try {
      const res = await fetch('/api/rag/ask', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ question: trimmed, corpus: ['eks-coreks'] }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(typeof data.error === 'string' ? data.error : 'request failed');
      setAnswer(data.answer);
      setSources((data.sources ?? []) as AskSource[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); ask(question); }
        }}
        placeholder="Ask anything about the EKS course — e.g. How does IRSA differ from instance roles?"
        rows={3}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 8,
          border: '1px solid var(--border)', background: 'var(--card-bg, #fff)',
          color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.5,
          resize: 'vertical',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>
          ⌘/Ctrl + Enter to send · grounded in {RAG_CHUNK_COUNT} course chunks
        </span>
        <button
          onClick={() => ask(question)}
          disabled={loading || !question.trim()}
          className="vx-btn vx-btn-primary vx-btn-sm"
          style={{ opacity: loading || !question.trim() ? 0.6 : 1 }}
        >
          {loading ? 'Thinking…' : 'Ask'}
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {[
          'What is the difference between control plane and data plane in EKS?',
          'When should I use Fargate vs managed node groups?',
          'How does IRSA work and why is it better than node IAM roles?',
          'Explain HPA vs VPA vs Karpenter',
          'What are the 4Cs of cloud-native security?',
          'How does VPC CNI assign IP addresses to pods?',
        ].map((q) => (
          <button
            key={q}
            onClick={() => { setQuestion(q); ask(q); }}
            disabled={loading}
            style={{
              background: 'rgba(74,144,226,0.08)', border: '1px solid rgba(74,144,226,0.25)',
              borderRadius: 20, padding: '4px 11px', fontSize: 11,
              color: 'var(--primary)', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', opacity: loading ? 0.5 : 1,
            }}
          >
            {q.length > 60 ? q.slice(0, 58) + '…' : q}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.3)',
          borderRadius: 8, padding: '10px 14px', color: '#c0392b', fontSize: 13, marginBottom: 12 }}>
          ⚠ {error}
        </div>
      )}

      {answer && (
        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)',
          borderRadius: 10, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: 'var(--muted)', marginBottom: 8 }}>
            ✦ Answer {lastAsked ? `· "${lastAsked.length > 60 ? lastAsked.slice(0, 58) + '…' : lastAsked}"` : ''}
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
            {answer}
          </div>
        </div>
      )}

      {sources.length > 0 && (
        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)',
          borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: 'var(--muted)', marginBottom: 10 }}>
            Sources
          </div>
          <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6 }}>
            {sources.map((s, i) => (
              <li key={i} style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>
                {s.metadata?.module ? <strong>M{s.metadata.module}</strong> : <strong>{s.corpus}</strong>}
                {' · '}{s.source_type}
                {s.metadata?.topic ? ` · ${s.metadata.topic}` : ''}
                {s.title ? ` — ${s.title}` : ''}
                <span style={{ color: 'var(--muted)', marginLeft: 6 }}>
                  ({Math.round(s.similarity * 100)}%)
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

const MODULE_COLORS: Record<string, string> = {
  'eks-coreks-m01': '#4A90E2',
  'eks-coreks-m02': '#F39C12',
  'eks-coreks-m03': '#38bdf8',
  'eks-coreks-m04': '#27AE60',
  'eks-coreks-m05': '#9B59B6',
  'eks-coreks-m06': '#818cf8',
  'eks-coreks-m07': '#1ABC9C',
  'eks-coreks-m08': '#E67E22',
  'eks-coreks-m09': '#E74C3C',
};

const EKS_MODULES = quizzes.filter(
  (q) => q.category === 'eks-coreks' && q.id !== 'eks-coreks-full-exam',
);

export default function EKSCourseOverviewPage() {
  const [activeTab, setActiveTab] = useState<'modules' | 'path' | 'flashcards' | 'ask'>('modules');

  return (
    <div className="page-content">

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(74,144,226,0.15), rgba(155,89,182,0.12))',
        border: '1px solid rgba(74,144,226,0.25)',
        borderRadius: 14,
        padding: '28px 32px',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #4A90E2, #9B59B6)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <span style={{ fontSize: 32 }}>☸️</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 2 }}>
              AWS Course · 200-COREKS
            </div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
              Running Containers on Amazon EKS
            </h2>
          </div>
        </div>
        <p style={{ margin: '8px 0 16px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, maxWidth: 720 }}>
          9 modules covering Kubernetes fundamentals through production-grade EKS — networking,
          storage, security, observability, and scaling. Includes animated labs, flashcards,
          RAG-powered AI tutor, and interactive visual references.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span className="vx-badge vx-badge-primary">9 Modules</span>
          <span className="vx-badge vx-badge-info">365 Flashcards</span>
          <span className="vx-badge vx-badge-success">{RAG_CHUNK_COUNT} RAG chunks</span>
          <span className="vx-badge vx-badge-warning">Associate Level</span>
          <a
            href={`${LABS_BASE_URL}/lab-1-deploying-pods/index.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="vx-badge vx-badge-secondary"
            style={{ textDecoration: 'none', cursor: 'pointer' }}
          >
            ↗ Interactive Labs
          </a>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20,
        borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {(['modules', 'path', 'flashcards', 'ask'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 16px', fontSize: 13, fontWeight: 600,
              color: activeTab === tab ? 'var(--primary)' : 'var(--muted)',
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -1, fontFamily: 'inherit',
              transition: 'color 0.15s',
            }}
          >
            {tab === 'modules'    ? '📚 Modules'
             : tab === 'path'     ? '🧭 Learning Path'
             : tab === 'flashcards' ? '🃏 Flashcards'
             : '✦ Ask AI'}
          </button>
        ))}
      </div>

      {/* ══════════ MODULES TAB ══════════ */}
      {activeTab === 'modules' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {EKS_MODULES.map((mod) => {
            const deck = eksCoreksFlashcardDecks.find((d) => d.id === mod.id);
            const color = MODULE_COLORS[mod.id] ?? '#4A90E2';
            const hasQuestions = mod.questionCount > 0;
            return (
              <div key={mod.id} style={{
                background: 'var(--card-bg, #fff)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '18px 20px',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: color }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 22 }}>{mod.icon}</span>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700,
                      letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {mod.examCode} · {mod.difficulty}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginTop: 1 }}>
                      {mod.title}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 14px', lineHeight: 1.55 }}>
                  {mod.description}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {hasQuestions ? (
                    <Link href={`/dashboard/quiz/${mod.id}`} className="vx-btn vx-btn-primary vx-btn-sm">
                      Take Quiz ({mod.questionCount}q)
                    </Link>
                  ) : (
                    <span className="vx-badge vx-badge-warning" style={{ fontSize: 11 }}>
                      Questions generating…
                    </span>
                  )}
                  {deck && (
                    <button
                      onClick={() => setActiveTab('flashcards')}
                      className="vx-btn vx-btn-outline-secondary vx-btn-sm"
                    >
                      🃏 {deck.cardCount} cards
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Full exam card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(74,144,226,0.08), rgba(155,89,182,0.08))',
            border: '1px solid rgba(74,144,226,0.3)',
            borderRadius: 12,
            padding: '18px 20px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
              background: 'linear-gradient(90deg, #4A90E2, #9B59B6)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>🏆</span>
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase' }}>Premium · Full Course</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginTop: 1 }}>
                  Full Practice Exam
                </div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 14px', lineHeight: 1.55 }}>
              All modules combined. Complete coverage of 200-COREKS exam topics.
            </p>
            <Link href="/dashboard/quiz/eks-coreks-full-exam" className="vx-btn vx-btn-primary vx-btn-sm">
              Start Full Exam
            </Link>
          </div>
        </div>
      )}

      {/* ══════════ LEARNING PATH TAB ══════════ */}
      {activeTab === 'path' && <LearningPath />}

      {/* ══════════ FLASHCARDS TAB ══════════ */}
      {activeTab === 'flashcards' && (
        <div>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
            365 cards across all 9 modules. Click a deck to start — cards track your progress automatically.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {eksCoreksFlashcardDecks.map((deck) => (
              <Link
                key={deck.id}
                href={`/dashboard/flashcards?deck=${deck.id}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div style={{
                  background: 'var(--card-bg, #fff)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '16px 18px',
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = '';
                    (e.currentTarget as HTMLElement).style.boxShadow = '';
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    background: deck.color }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}>{deck.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                        {deck.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        {deck.cardCount} cards
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                    {deck.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ══════════ ASK AI TAB ══════════ */}
      {activeTab === 'ask' && (
        <div style={{ maxWidth: 720 }}>
          <div style={{
            background: 'var(--card-bg, #fff)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 24,
            marginBottom: 16,
          }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--text)',
              display: 'flex', alignItems: 'center', gap: 8 }}>
              ✦ Ask AI about the EKS Course
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
              Powered by OpenAI + RAG over {RAG_CHUNK_COUNT} chunks of EKS course content (slides, notes,
              flashcards, reference pages, lab steps, lab notes). Answers are grounded in course material only.
            </p>
            <EksAskChat />
          </div>

          {/* Knowledge graph preview — real concepts from content_graph */}
          <div style={{
            background: 'var(--card-bg, #fff)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 24,
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
              🔗 Concept Map · {content_graph.concepts.length} concepts · {content_graph.edges.length} edges
            </h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 14px', lineHeight: 1.6 }}>
              The platform knows which concepts are prerequisites for others.
              When you ask a question, it boosts retrieval for related prerequisite concepts automatically.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { from: 'Container', to: 'Pod → ReplicaSet → Deployment', color: '#4A90E2' },
                { from: 'Pod', to: 'Service → Ingress', color: '#1ABC9C' },
                { from: 'EKS Architecture', to: 'Managed Node Groups → Karpenter', color: '#F39C12' },
                { from: 'IAM for EKS', to: 'RBAC → IRSA → ASCP', color: '#E74C3C' },
                { from: 'PV/PVC', to: 'EBS CSI → EFS CSI → StatefulSet', color: '#E67E22' },
                { from: 'Probes', to: 'Rolling Update → HPA → GitOps', color: '#9B59B6' },
              ].map(({ from, to, color }) => (
                <div key={from} style={{
                  background: `${color}10`,
                  border: `1px solid ${color}30`,
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 12,
                }}>
                  <span style={{ fontWeight: 700, color }}>{from}</span>
                  <span style={{ color: 'var(--muted)' }}> → </span>
                  <span style={{ color: 'var(--text)' }}>{to}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

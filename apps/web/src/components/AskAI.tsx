'use client';

import { useState } from 'react';

type RagResourceType = 'learning-path' | 'notes' | 'video' | 'quiz' | 'flashcard';
interface RagResource { type: RagResourceType; id: string; title: string; subtitle?: string; url?: string }
interface AskResponse {
  ok: boolean;
  answer?: string;
  resources?: RagResource[];
  error?: string;
  code?: string;
}

const RESOURCE_META: Record<RagResourceType, { icon: string; label: string }> = {
  'learning-path': { icon: '🗺️', label: 'Learning path' },
  notes:           { icon: '📖', label: 'Article' },
  video:           { icon: '▶️', label: 'Recommended video' },
  quiz:            { icon: '📝', label: 'Quiz' },
  flashcard:       { icon: '🃏', label: 'Flashcards' },
};

/** Map a resource to its in-app web route. */
function resourceHref(r: RagResource): string {
  switch (r.type) {
    case 'quiz':          return `/dashboard/quiz/${r.id}`;
    case 'flashcard':     return `/dashboard/flashcards/${r.id}`;
    case 'notes':         return `/dashboard/learning-paths/notes/${r.id}`;
    case 'learning-path': return `/dashboard/learning-paths/${r.id}`;
    case 'video':         return '/dashboard/learn';
  }
}

/**
 * Global "Ask AI" — floating button + modal that queries the RAG endpoint
 * (POST /api/rag/ask). Parity with the mobile AskAISheet.
 */
export default function AskAI() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [resources, setResources] = useState<RagResource[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    const q = question.trim();
    if (q.length < 3) { setError('Ask a question (at least 3 characters).'); return; }
    setLoading(true); setError(null); setAnswer(null); setResources([]);
    try {
      const res = await fetch('/api/rag/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
        signal: AbortSignal.timeout(30_000),
      });
      const body = await res.json().catch(() => ({ ok: false })) as AskResponse;
      if (res.status === 429) { setError(body.error ?? 'Rate limited — wait a moment and try again.'); return; }
      if (!res.ok || !body.ok) { setError(body.error ?? 'Ask AI failed. Try again.'); return; }
      setAnswer(body.answer ?? 'No answer returned.');
      setResources(body.resources ?? []);
    } catch (e) {
      setError(e instanceof Error && e.name === 'TimeoutError' ? 'Ask AI timed out. Try again.' : 'Ask AI is unavailable right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask AI"
        style={{
          position: 'fixed', right: 24, bottom: 24, zIndex: 50,
          height: 54, paddingInline: 20, borderRadius: 28, border: 'none', cursor: 'pointer',
          background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: 14,
          display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
        }}
      >
        ✨ Ask AI
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 640, maxHeight: '85vh', overflowY: 'auto',
              background: 'var(--card-bg, var(--bg))', borderTopLeftRadius: 18, borderTopRightRadius: 18,
              border: '1px solid var(--border)', padding: 22,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>✨ Ask AI</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close"
                style={{ border: 'none', background: 'transparent', fontSize: 22, lineHeight: 1, color: 'var(--text-secondary)', cursor: 'pointer' }}>×</button>
            </div>

            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything about AWS, cloud, or your certification…"
              rows={3}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) ask(); }}
              style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', padding: 12, font: 'inherit', fontSize: 14, resize: 'vertical' }}
            />
            <button type="button" onClick={ask} disabled={loading} className="btn-primary" style={{ marginTop: 10, opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Thinking…' : 'Ask'}
            </button>

            {error && <p style={{ color: 'var(--error)', fontSize: 13, marginTop: 12 }}>{error}</p>}

            {answer && (
              <div style={{ marginTop: 18 }}>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{answer}</div>

                {resources.length > 0 && (
                  <div style={{ marginTop: 18 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-secondary)', marginBottom: 8 }}>Study next</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {resources.map((r, i) => {
                        const meta = RESOURCE_META[r.type];
                        return (
                          <a
                            key={`${r.type}-${r.id}-${i}`}
                            href={resourceHref(r)}
                            onClick={() => setOpen(false)}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: '1px solid var(--border)', borderRadius: 12, textDecoration: 'none', background: 'var(--bg)' }}
                          >
                            <span style={{ fontSize: 20 }}>{meta.icon}</span>
                            <span style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>{meta.label}</span>
                              <span style={{ display: 'block', fontSize: 13, color: 'var(--text)' }}>{r.title}</span>
                            </span>
                            <span style={{ color: 'var(--text-secondary)' }}>→</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

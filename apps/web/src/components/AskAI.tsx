'use client';

import { useState } from 'react';

interface AskSource { corpus: string; source_type: string; title: string | null; similarity: number }
interface NextPage { id: string; title: string; url: string }
interface AskResponse {
  ok: boolean;
  answer?: string;
  sources?: AskSource[];
  next_pages?: NextPage[];
  error?: string;
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
  const [sources, setSources] = useState<AskSource[]>([]);
  const [nextPages, setNextPages] = useState<NextPage[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    const q = question.trim();
    if (q.length < 3) { setError('Ask a question (at least 3 characters).'); return; }
    setLoading(true); setError(null); setAnswer(null); setSources([]); setNextPages([]);
    try {
      const res = await fetch('/api/rag/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
        signal: AbortSignal.timeout(30_000),
      });
      if (res.status === 429) { setError('Rate limited — wait a moment and try again.'); return; }
      const body = await res.json() as AskResponse;
      if (!res.ok || !body.ok) { setError(body.error ?? 'Ask AI failed. Try again.'); return; }
      setAnswer(body.answer ?? 'No answer returned.');
      setSources(body.sources ?? []);
      setNextPages(body.next_pages ?? []);
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

                {sources.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-secondary)', marginBottom: 8 }}>Sources</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {sources.slice(0, 6).map((s, i) => (
                        <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                          <span>📄</span>
                          <span>{s.title || s.source_type} <span style={{ opacity: 0.6 }}>· {s.corpus} · {Math.round(s.similarity * 100)}%</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {nextPages.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-secondary)', marginBottom: 8 }}>Study next</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {nextPages.slice(0, 5).map((p) => (
                        <a key={p.id} href={p.url} style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none' }}>→ {p.title}</a>
                      ))}
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

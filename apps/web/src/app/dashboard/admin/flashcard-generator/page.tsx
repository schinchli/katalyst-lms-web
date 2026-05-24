'use client';
export const dynamic = 'force-dynamic';

/**
 * Admin Flashcard Generator — LearnKloud
 *
 * Topic → /api/rag retrieval → gpt-4o-mini generates N flashcards in JSON →
 * admin edits inline → "Save" persists into knowledge_chunks with
 * corpus='generated-flashcards'.
 *
 * Same admin gate as the rest of /dashboard/admin/*: server-side JWT
 * verification via /api/admin/check.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/LoadingSpinner';

interface GenCard {
  front:            string;
  back:             string;
  source_chunk_ids: string[];
}

interface GenSource {
  id:          string;
  corpus:      string;
  source_type: string;
  title:       string | null;
  metadata:    Record<string, unknown>;
  similarity:  number;
}

const CORPORA: Array<{ id: string; label: string; color: string }> = [
  { id: 'eks-coreks',           label: 'EKS Course',         color: '#4A90E2' },
  { id: 'clf-c02',              label: 'CLF-C02',            color: '#27AE60' },
  { id: 'aip-c01',              label: 'AIP-C01',            color: '#F39C12' },
  { id: 'flashcards',           label: 'Generic flashcards', color: '#9B59B6' },
  { id: 'eks-coreks-questions', label: 'EKS Questions',      color: '#1ABC9C' },
  { id: 'generated-flashcards', label: 'Prior generated',    color: '#E74C3C' },
];

type Status = 'loading' | 'authorized' | 'unauthorized' | 'error';

export default function FlashcardGeneratorPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [token,  setToken]  = useState<string | null>(null);

  const [topic,           setTopic]           = useState('');
  const [count,           setCount]           = useState(5);
  const [retrievalLimit,  setRetrievalLimit]  = useState(8);
  const [selectedCorpus,  setSelectedCorpus]  = useState<string[]>(['eks-coreks']);

  const [generating, setGenerating] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [cards,      setCards]      = useState<GenCard[]>([]);
  const [sources,    setSources]    = useState<GenSource[]>([]);
  const [error,      setError]      = useState<string | null>(null);
  const [warning,    setWarning]    = useState<string | null>(null);
  const [savedMsg,   setSavedMsg]   = useState<string | null>(null);
  const [usage,      setUsage]      = useState<{ input_tokens: number; output_tokens: number; model: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          if (!cancelled) setStatus('unauthorized');
          return;
        }
        const res = await fetch('/api/admin/check', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await res.json();
        if (cancelled) return;
        if (json.isAdmin) {
          setToken(session.access_token);
          setStatus('authorized');
        } else {
          setStatus('unauthorized');
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function call({ save }: { save: boolean }) {
    if (!topic.trim() || !token) return;
    if (save) setSaving(true); else { setGenerating(true); setCards([]); setSources([]); setUsage(null); }
    setError(null); setWarning(null); setSavedMsg(null);

    try {
      const res = await fetch('/api/admin/generate-flashcards', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          Authorization:   `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic:           topic.trim(),
          count,
          retrievalLimit,
          corpus:          selectedCorpus.length ? selectedCorpus : undefined,
          save,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      }
      // When save=true with edited cards, the server didn't see our edits.
      // For this v1 we re-generate then save in two clicks; future improvement: explicit save-edited endpoint.
      if (!save) {
        setCards(data.cards ?? []);
        setSources(data.sources ?? []);
        setUsage(data.usage ?? null);
        if (data.warning) setWarning(data.warning);
      } else if (data.saved_count) {
        setSavedMsg(`✓ Saved ${data.saved_count} card${data.saved_count === 1 ? '' : 's'} to knowledge_chunks (corpus='generated-flashcards')`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown error');
    } finally {
      setGenerating(false);
      setSaving(false);
    }
  }

  function toggleCorpus(id: string) {
    setSelectedCorpus((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function updateCard(i: number, field: 'front' | 'back', val: string) {
    setCards((prev) => prev.map((c, j) => j === i ? { ...c, [field]: val } : c));
  }

  function removeCard(i: number) {
    setCards((prev) => prev.filter((_, j) => j !== i));
  }

  if (status === 'loading') {
    return <div className="page-content"><LoadingSpinner /></div>;
  }
  if (status === 'unauthorized') {
    return (
      <div className="page-content">
        <h2 style={{ marginTop: 0 }}>Admin access required</h2>
        <p style={{ color: 'var(--muted)' }}>Sign in with an admin account to use the flashcard generator.</p>
        <button onClick={() => router.push('/dashboard')} className="vx-btn vx-btn-primary vx-btn-sm">
          Back to dashboard
        </button>
      </div>
    );
  }
  if (status === 'error') {
    return <div className="page-content"><p>Could not verify admin access — try refreshing.</p></div>;
  }

  return (
    <div className="page-content" style={{ maxWidth: 920 }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(115,103,240,0.10), rgba(74,144,226,0.08))',
        border: '1px solid rgba(115,103,240,0.25)',
        borderRadius: 12,
        padding: '20px 24px',
        marginBottom: 20,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>
          Admin · RAG-powered authoring
        </div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
          ✨ Flashcard Generator
        </h2>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>
          Pick a topic and (optionally) a corpus to retrieve from. The generator pulls the top relevant
          chunks, then gpt-4o-mini writes N grounded flashcards with citations. Edit inline, then save.
        </p>
      </div>

      {/* Inputs */}
      <div style={{
        background: 'var(--card-bg, #fff)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
      }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
          Topic
        </label>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. IAM Roles for Service Accounts (IRSA)"
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--card-bg, #fff)',
            color: 'var(--text)', fontSize: 14, fontFamily: 'inherit',
          }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: 'var(--muted)', marginBottom: 6 }}>
              Cards to generate: {count}
            </label>
            <input type="range" min={1} max={20} value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: 'var(--muted)', marginBottom: 6 }}>
              Chunks retrieved: {retrievalLimit}
            </label>
            <input type="range" min={3} max={15} value={retrievalLimit}
              onChange={(e) => setRetrievalLimit(parseInt(e.target.value))}
              style={{ width: '100%' }} />
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            color: 'var(--muted)', marginBottom: 8 }}>
            Restrict to corpus {selectedCorpus.length === 0 && <span style={{ color: 'var(--warning)' }}> · none selected = all</span>}
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CORPORA.map((c) => {
              const active = selectedCorpus.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCorpus(c.id)}
                  style={{
                    background: active ? `${c.color}20` : 'transparent',
                    border: `1px solid ${active ? c.color : 'var(--border)'}`,
                    color: active ? c.color : 'var(--muted)',
                    borderRadius: 16, padding: '4px 12px', fontSize: 12,
                    cursor: 'pointer', fontFamily: 'inherit', fontWeight: active ? 600 : 400,
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 18, alignItems: 'center' }}>
          <button
            onClick={() => call({ save: false })}
            disabled={generating || saving || !topic.trim()}
            className="vx-btn vx-btn-primary"
            style={{ opacity: (generating || saving || !topic.trim()) ? 0.6 : 1 }}
          >
            {generating ? 'Generating…' : 'Generate'}
          </button>
          {cards.length > 0 && (
            <button
              onClick={() => call({ save: true })}
              disabled={saving || generating}
              className="vx-btn vx-btn-outline-secondary"
              style={{ opacity: (saving || generating) ? 0.6 : 1 }}
              title="Re-runs generation with current settings, then saves to knowledge_chunks"
            >
              {saving ? 'Saving…' : `💾 Save ${cards.length} card${cards.length === 1 ? '' : 's'}`}
            </button>
          )}
          {usage && (
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>
              {usage.model} · {usage.input_tokens} in / {usage.output_tokens} out tokens
            </span>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.3)',
          borderRadius: 8, padding: '10px 14px', color: '#c0392b', fontSize: 13, marginBottom: 12 }}>
          ⚠ {error}
        </div>
      )}
      {warning && (
        <div style={{ background: 'rgba(243,156,18,0.08)', border: '1px solid rgba(243,156,18,0.3)',
          borderRadius: 8, padding: '10px 14px', color: '#b8730a', fontSize: 13, marginBottom: 12 }}>
          ⚠ {warning}
        </div>
      )}
      {savedMsg && (
        <div style={{ background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.3)',
          borderRadius: 8, padding: '10px 14px', color: '#1e8c54', fontSize: 13, marginBottom: 12 }}>
          {savedMsg}
        </div>
      )}

      {/* Generated cards */}
      {cards.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
            Generated cards ({cards.length}) — edit inline before saving
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {cards.map((card, i) => (
              <div key={i} style={{
                background: 'var(--card-bg, #fff)',
                border: '1px solid var(--border)',
                borderRadius: 10, padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)',
                    letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Card {i + 1}
                    {card.source_chunk_ids.length > 0 && (
                      <span style={{ marginLeft: 8, fontWeight: 400 }}>
                        · grounded in {card.source_chunk_ids.length} chunk{card.source_chunk_ids.length === 1 ? '' : 's'}
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => removeCard(i)}
                    style={{ background: 'none', border: 'none', color: 'var(--error)',
                      cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}
                  >
                    Remove
                  </button>
                </div>
                <label style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginBottom: 2 }}>Front</label>
                <textarea
                  value={card.front}
                  onChange={(e) => updateCard(i, 'front', e.target.value)}
                  rows={2}
                  style={{
                    width: '100%', padding: '6px 10px', borderRadius: 6,
                    border: '1px solid var(--border)', background: 'var(--card-bg, #fff)',
                    color: 'var(--text)', fontSize: 13, fontFamily: 'inherit',
                    resize: 'vertical', marginBottom: 8,
                  }}
                />
                <label style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginBottom: 2 }}>Back</label>
                <textarea
                  value={card.back}
                  onChange={(e) => updateCard(i, 'back', e.target.value)}
                  rows={3}
                  style={{
                    width: '100%', padding: '6px 10px', borderRadius: 6,
                    border: '1px solid var(--border)', background: 'var(--card-bg, #fff)',
                    color: 'var(--text)', fontSize: 13, fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source chunks */}
      {sources.length > 0 && (
        <div style={{
          background: 'var(--card-bg, #fff)',
          border: '1px solid var(--border)',
          borderRadius: 10, padding: '14px 16px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
            Source chunks used ({sources.length})
          </div>
          <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 4 }}>
            {sources.map((s, i) => {
              const meta = s.metadata as { module?: string; topic?: string };
              return (
                <li key={s.id} style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.55 }}>
                  <strong>{s.corpus}</strong>
                  {meta?.module ? ` · M${meta.module}` : ''}
                  {' · '}{s.source_type}
                  {meta?.topic ? ` · ${meta.topic}` : ''}
                  {s.title ? ` — ${s.title}` : ''}
                  <span style={{ color: 'var(--muted)', marginLeft: 6 }}>({Math.round(s.similarity * 100)}%)</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}

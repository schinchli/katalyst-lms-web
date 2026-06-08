'use client';

/**
 * Renders the "Official AWS References" block for a lesson. Hydrates from the
 * DB-backed /api/sources endpoint (live title/url/verified-date from the seeded
 * content_sources table), with the in-repo registry as an instant first paint
 * and offline fallback.
 */
import { useEffect, useState } from 'react';
import { getModuleSources, type TrustedSource } from '@/lib/sources';

interface DisplaySource extends TrustedSource {
  verifiedAt?: string | null;
  backedBy?: 'db' | 'registry';
}

const TYPE_LABEL: Record<TrustedSource['sourceType'], string> = {
  aws_docs: 'AWS Docs', aws_blog: 'AWS Blog', mcp: 'AWS MCP', ingested: 'Course', manual: 'Curated',
};
const TYPE_COLOR: Record<TrustedSource['sourceType'], string> = {
  aws_docs: '#FF9900', aws_blog: '#7367F0', mcp: '#00CFE8', ingested: '#28C76F', manual: '#9E9E9E',
};

function fmtDate(iso?: string | null): string {
  if (!iso) return 'against official AWS documentation';
  try { return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return 'against official AWS documentation'; }
}

export function SourceReferences({ moduleId }: { moduleId: string }) {
  // Instant first paint from the registry; hydrate from the DB-backed API.
  const [sources, setSources] = useState<DisplaySource[]>(() => getModuleSources(moduleId));
  const [verified, setVerified] = useState<string | null>(null);
  const [backed, setBacked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/sources?module=${encodeURIComponent(moduleId)}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || !j?.ok || !Array.isArray(j.sources) || j.sources.length === 0) return;
        setSources(j.sources as DisplaySource[]);
        setBacked(j.backed === 'content_sources');
        const v = (j.sources as DisplaySource[]).map((s) => s.verifiedAt).filter(Boolean).sort().pop();
        if (v) setVerified(v);
      })
      .catch(() => { /* keep registry fallback */ });
    return () => { cancelled = true; };
  }, [moduleId]);

  if (sources.length === 0) return null;

  return (
    <div className="vx-card" style={{ padding: '20px 22px', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h4 style={{ margin: 0, fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>📚 Official AWS References</h4>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Verified {verified ? fmtDate(verified) : 'against official AWS documentation'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sources.map((s) => (
          <a
            key={s.key}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
              borderRadius: 10, border: '1px solid var(--border)', textDecoration: 'none',
              background: 'var(--bg)', transition: 'border-color 0.12s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = TYPE_COLOR[s.sourceType])}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <span
              style={{
                flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                background: `${TYPE_COLOR[s.sourceType]}1A`, color: TYPE_COLOR[s.sourceType],
                textTransform: 'uppercase', letterSpacing: 0.3,
              }}
            >
              {TYPE_LABEL[s.sourceType]}
            </span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.title}
            </span>
            <span style={{ flexShrink: 0, fontSize: 13, color: 'var(--text-secondary)' }}>↗</span>
          </a>
        ))}
      </div>

      <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        Sources are ranked by trust level (official AWS documentation first){backed ? ' and served from the verified content-source registry' : ''}.
        Content on this page is validated against these references.
      </p>
    </div>
  );
}

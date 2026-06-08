'use client';

/**
 * Renders the "Official AWS References" block for a lesson — every source is a
 * traceable, official link with its type and trust level. Powered by the
 * in-repo curated registry (lib/sources.ts), so it needs no network or DB.
 */
import { getModuleSources, type TrustedSource } from '@/lib/sources';

const TYPE_LABEL: Record<TrustedSource['sourceType'], string> = {
  aws_docs: 'AWS Docs',
  aws_blog: 'AWS Blog',
  mcp: 'AWS MCP',
  ingested: 'Course',
  manual: 'Curated',
};

const TYPE_COLOR: Record<TrustedSource['sourceType'], string> = {
  aws_docs: '#FF9900',
  aws_blog: '#7367F0',
  mcp: '#00CFE8',
  ingested: '#28C76F',
  manual: '#9E9E9E',
};

export function SourceReferences({ moduleId, verifiedDate }: { moduleId: string; verifiedDate?: string }) {
  const sources = getModuleSources(moduleId);
  if (sources.length === 0) return null;

  return (
    <div className="vx-card" style={{ padding: '20px 22px', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h4 style={{ margin: 0, fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>📚 Official AWS References</h4>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Verified {verifiedDate ?? 'against official AWS documentation'}
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
        Sources are ranked by trust level (official AWS documentation first). Content on this page is
        validated against these references.
      </p>
    </div>
  );
}

'use client';
export const dynamic = 'force-dynamic';

/**
 * /dashboard/learning-paths/notes/[moduleId]
 *
 * Detailed reading notes for a CLF-C02 module — headings, body text,
 * architecture diagrams, key-point callouts, and exam tips. Rendered from
 * the structured MODULE_NOTES data so web and mobile stay in sync.
 */
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { getModuleNotes } from '@/data/moduleNotes';

/** Minimal inline-markdown: **bold** → <strong>. */
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--text)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function ModuleNotesPage() {
  const params = useParams();
  const moduleId = (Array.isArray(params.moduleId) ? params.moduleId[0] : params.moduleId) ?? '';
  const notes = getModuleNotes(moduleId);

  // Mark this module's notes as read so the learning path tracks progress.
  useEffect(() => {
    if (notes && typeof window !== 'undefined') {
      try { localStorage.setItem(`notes-read-${moduleId}`, '1'); } catch { /* ignore */ }
    }
  }, [moduleId, notes]);

  if (!notes) {
    return (
      <div className="page-content">
        <div className="vx-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
          <h5 style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--text)' }}>Notes coming soon</h5>
          <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: 14 }}>
            Detailed reading notes for this module are being written.
          </p>
          <Link href="/dashboard/learning-paths/clf-c02" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
            Back to the CLF-C02 path
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ maxWidth: 820, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <Link href="/dashboard/learning-paths/clf-c02" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        ← Back to CLF-C02 path
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <span className="vx-badge vx-badge-primary" style={{ marginBottom: 10, display: 'inline-block' }}>📖 {notes.readingMinutes} min read</span>
        <h3 style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 26, color: 'var(--text)' }}>{notes.title}</h3>
        <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: 15 }}>{notes.subtitle}</p>
        <p style={{ margin: 0, color: 'var(--text)', fontSize: 15, lineHeight: 1.7 }}>{renderInline(notes.intro)}</p>
      </div>

      {/* Sections */}
      {notes.sections.map((section, i) => (
        <section key={i} style={{ marginBottom: 32 }}>
          <h4 style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 19, color: 'var(--text)', borderLeft: '4px solid var(--primary)', paddingLeft: 12 }}>
            {section.heading}
          </h4>

          {section.body.split('\n\n').map((para, p) => (
            <p key={p} style={{ margin: '0 0 14px', color: 'var(--text)', fontSize: 15, lineHeight: 1.75 }}>
              {renderInline(para)}
            </p>
          ))}

          {section.diagram && (
            <figure style={{ margin: '20px 0', textAlign: 'center', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)', padding: 18 }}>
              <Image
                src={`/clf-c02/notes/${section.diagram}.png`}
                alt={section.diagramCaption ?? section.heading}
                width={680}
                height={520}
                style={{ width: '100%', height: 'auto', maxWidth: 560, objectFit: 'contain' }}
                unoptimized
              />
              {section.diagramCaption && (
                <figcaption style={{ marginTop: 10, fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  {section.diagramCaption}
                </figcaption>
              )}
            </figure>
          )}

          {section.keyPoints && section.keyPoints.length > 0 && (
            <div style={{ background: 'var(--primary-light, rgba(115,103,240,0.08))', borderRadius: 10, padding: '14px 18px', marginTop: 14, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--primary)', marginBottom: 8 }}>Key points</div>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {section.keyPoints.map((kp, k) => (
                  <li key={k} style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>{renderInline(kp)}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ))}

      {/* Exam tips */}
      {notes.examTips.length > 0 && (
        <div className="vx-card" style={{ padding: '20px 22px', marginBottom: 28, background: 'var(--warning-light, rgba(255,159,67,0.08))', border: '1px solid var(--warning, #FF9F43)' }}>
          <h4 style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>🎯 Exam tips</h4>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {notes.examTips.map((tip, t) => (
              <li key={t} style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.8 }}>{renderInline(tip)}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer nav */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        <Link href={`/dashboard/flashcards/${notes.moduleId}`} className="btn-primary" style={{ textDecoration: 'none' }}>
          Practice with flashcards →
        </Link>
        <Link href="/dashboard/learning-paths/clf-c02" style={{ textDecoration: 'none', padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 14 }}>
          Back to path
        </Link>
      </div>
    </div>
  );
}

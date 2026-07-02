/**
 * ContentTypeBadge — shared content-type registry for the unified Library.
 *
 * Mirrors the mobile implementation exactly: identical labels, colors, and
 * Feather icons for every content kind (notes / quiz / video / article /
 * flashcard). Pure presentational — safe in both server and client components.
 */
import type { CSSProperties, ReactElement } from 'react';

export type ContentKind = 'notes' | 'quiz' | 'video' | 'article' | 'flashcard';

export interface ContentTypeMeta {
  icon: FeatherIconName;
  label: string;
  color: string;
  external: boolean;
}

export const CONTENT_TYPES: Record<ContentKind, ContentTypeMeta> = {
  notes:     { icon: 'book-open',   label: 'Notes',      color: '#7C83FF', external: false },
  quiz:      { icon: 'help-circle', label: 'Quiz',       color: '#28C76F', external: false },
  video:     { icon: 'youtube',     label: 'Video',      color: '#EA5455', external: true  },
  article:   { icon: 'file-text',   label: 'Article',    color: '#FF9F43', external: false },
  flashcard: { icon: 'layers',      label: 'Flashcards', color: '#B99AF6', external: false },
};

// ── Feather icons (official 24×24 stroke paths) ─────────────────────────────

const FEATHER_PATHS: Record<string, ReactElement> = {
  'book-open': (
    <>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </>
  ),
  'help-circle': (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),
  'youtube': (
    <>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </>
  ),
  'file-text': (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </>
  ),
  'layers': (
    <>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </>
  ),
  'external-link': (
    <>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </>
  ),
  'lock': (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  'search': (
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  'x': (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
};

export type FeatherIconName = keyof typeof FEATHER_PATHS;

export function FeatherIcon({
  name,
  size = 16,
  color = 'currentColor',
  style,
}: {
  name: FeatherIconName;
  size?: number;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {FEATHER_PATHS[name]}
    </svg>
  );
}

// ── Badge + icon tile (match mobile styling exactly) ────────────────────────

export function ContentTypeBadge({ kind }: { kind: ContentKind }) {
  const meta = CONTENT_TYPES[kind];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        borderRadius: 6,
        border: `1px solid ${meta.color}55`,
        background: `${meta.color}1A`,
      }}
    >
      <FeatherIcon name={meta.icon} size={11} color={meta.color} />
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color: meta.color,
        }}
      >
        {meta.label}
      </span>
    </span>
  );
}

export function ContentTypeIconTile({ kind, size = 48 }: { kind: ContentKind; size?: number }) {
  const meta = CONTENT_TYPES[kind];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: `${meta.color}1A`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <FeatherIcon name={meta.icon} size={Math.round(size * 0.45)} color={meta.color} />
    </div>
  );
}

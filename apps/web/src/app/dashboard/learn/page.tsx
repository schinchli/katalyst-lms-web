'use client';
export const dynamic = 'force-dynamic';

/**
 * /dashboard/learn — unified, filterable content Library.
 *
 * Aggregates notes, quizzes, videos, articles, and flashcards into one
 * searchable grid, mirroring the mobile Library exactly (shared content-type
 * registry in @/components/ContentTypeBadge).
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { ArticleListItem } from '@/lib/sanityClient';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  CONTENT_TYPES,
  ContentTypeBadge,
  ContentTypeIconTile,
  FeatherIcon,
  type ContentKind,
} from '@/components/ContentTypeBadge';
import { LEARNING_PATHS } from '@/data/learningPaths';
import { flashcardDecks } from '@/data/flashcards';
import { quizzes } from '@/data/quizzes';
import { PLAYLIST } from '@/data/videos';

interface LibraryItem {
  key: string;
  kind: ContentKind;
  title: string;
  subtitle?: string;
  meta: string;
  course?: string;
  premium?: boolean;
  href?: string;
  externalUrl?: string;
}

const KIND_ORDER: ContentKind[] = ['notes', 'quiz', 'video', 'article', 'flashcard'];

function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function articleMeta(article: ArticleListItem): string {
  const parts = [article.author ?? 'LearnKloud Team'];
  if (article.readTime) parts.push(article.readTime);
  const date = formatDate(article.publishedAt);
  if (date) parts.push(date);
  return parts.join(' · ');
}

export default function LearnPage() {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [articlesError, setArticlesError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | ContentKind>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');

  useEffect(() => {
    fetch('/api/articles')
      .then((r) => r.json())
      .then((d: { ok: boolean; articles?: ArticleListItem[]; error?: string }) => {
        if (d.ok && d.articles) setArticles(d.articles);
        else setArticlesError(d.error ?? 'Failed to load articles');
      })
      .catch(() => setArticlesError('Failed to load articles'))
      .finally(() => setArticlesLoading(false));
  }, []);

  // ── Aggregate every content source into LibraryItems ──
  const items = useMemo<LibraryItem[]>(() => {
    const list: LibraryItem[] = [];

    // Notes + flashcards from learning paths
    for (const path of LEARNING_PATHS) {
      for (const step of path.steps) {
        if (step.type === 'notes') {
          list.push({
            key: `notes-${step.id}`,
            kind: 'notes',
            title: step.title.replace(/^Read:\s*/, ''),
            subtitle: step.subtitle,
            meta: `${path.certCode} · ${step.estimatedMinutes} min read`,
            course: path.certCode,
            href: `/dashboard/learning-paths/notes/${step.resourceId}`,
          });
        }
        if (step.type === 'flashcard') {
          // Mirror the stepHref guard: only link decks that actually exist.
          const deck = flashcardDecks.find((d) => d.id === step.resourceId);
          if (!deck) continue;
          list.push({
            key: `flashcard-${step.id}`,
            kind: 'flashcard',
            title: step.title,
            subtitle: step.subtitle,
            meta: `${path.certCode} · ${step.estimatedMinutes} min`,
            course: path.certCode,
            href: `/dashboard/flashcards/${step.resourceId}`,
          });
        }
      }
    }

    // Quizzes
    for (const quiz of quizzes) {
      if (quiz.enabled === false) continue;
      list.push({
        key: `quiz-${quiz.id}`,
        kind: 'quiz',
        title: quiz.title,
        subtitle: quiz.description,
        meta: `${(quiz.examCode ?? quiz.category).toUpperCase()} · ${quiz.questionCount} questions · ${quiz.duration} min`,
        course: quiz.examCode,
        premium: quiz.isPremium,
        href: `/dashboard/quiz/${quiz.id}`,
      });
    }

    // Videos (external YouTube)
    for (const video of PLAYLIST) {
      list.push({
        key: `video-${video.id}`,
        kind: 'video',
        title: video.title,
        subtitle: video.description,
        meta: `${video.author} · ${video.duration}`,
        externalUrl: `https://youtu.be/${video.youtubeId}`,
      });
    }

    // Articles (fetched)
    for (const article of articles) {
      list.push({
        key: `article-${article.slug}`,
        kind: 'article',
        title: article.title,
        subtitle: article.excerpt ?? undefined,
        meta: articleMeta(article),
        premium: article.accessTier === 'premium',
        href: `/dashboard/learn/${article.slug}`,
      });
    }

    return list;
  }, [articles]);

  const courses = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) if (item.course) set.add(item.course);
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (kindFilter !== 'all' && item.kind !== kindFilter) return false;
      // Course chips are hidden for articles, so don't apply the course filter there.
      if (kindFilter !== 'article' && courseFilter !== 'all' && item.course !== courseFilter) return false;
      if (q) {
        return [item.title, item.subtitle, item.meta]
          .filter(Boolean)
          .some((f) => String(f).toLowerCase().includes(q));
      }
      return true;
    });
  }, [items, kindFilter, courseFilter, search]);

  const grouped = useMemo(
    () =>
      KIND_ORDER.map((kind) => ({ kind, items: filtered.filter((i) => i.kind === kind) })).filter(
        (g) => g.items.length > 0,
      ),
    [filtered],
  );

  const renderCard = (item: LibraryItem) => {
    const inner = (
      <>
        <div style={{ padding: '20px 20px 14px', flex: 1 }}>
          {/* Top row: type badge + premium lock + external indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <ContentTypeBadge kind={item.kind} />
              {item.premium && <FeatherIcon name="lock" size={13} color="#FF9F43" />}
            </div>
            {item.externalUrl && (
              <FeatherIcon name="external-link" size={13} color="var(--text-secondary)" />
            )}
          </div>
          <div style={{ marginBottom: 12 }}>
            <ContentTypeIconTile kind={item.kind} />
          </div>
          <h6 style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 15, color: 'var(--text)', lineHeight: 1.4 }}>
            {item.title}
          </h6>
          {item.subtitle && (
            <p
              style={{
                margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}
            >
              {item.subtitle}
            </p>
          )}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.meta}</span>
        </div>
      </>
    );

    const cardStyle = { textDecoration: 'none', display: 'flex', flexDirection: 'column' } as const;

    return item.externalUrl ? (
      <a key={item.key} href={item.externalUrl} target="_blank" rel="noopener noreferrer" className="quiz-card" style={cardStyle}>
        {inner}
      </a>
    ) : (
      <Link key={item.key} href={item.href ?? '#'} className="quiz-card" style={cardStyle}>
        {inner}
      </Link>
    );
  };

  return (
    <div className="page-content">
      {/* ── Page header ── */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Library</h4>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
          All study content in one place — notes, quizzes, videos, articles, and flashcards.
        </p>
      </div>

      {/* ── Search + filters ── */}
      <div className="vx-card" style={{ marginBottom: 24, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', background: 'var(--bg)' }}>
          <FeatherIcon name="search" size={15} color="var(--text-secondary)" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes, quizzes, videos, articles, flashcards…"
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: 'var(--text)', width: '100%', fontFamily: 'inherit' }}
          />
          {search && (
            <button
              type="button" onClick={() => setSearch('')} aria-label="Clear search"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--text-secondary)' }}
            >
              <FeatherIcon name="x" size={14} />
            </button>
          )}
        </div>

        {/* Type filter chips */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <button
            type="button" onClick={() => setKindFilter('all')}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              border: `1px solid ${kindFilter === 'all' ? 'var(--primary)' : 'var(--border)'}`,
              background: kindFilter === 'all' ? 'var(--primary)' : 'var(--card-bg)',
              color: kindFilter === 'all' ? '#fff' : 'var(--text-secondary)',
            }}
          >
            All
          </button>
          {KIND_ORDER.map((kind) => {
            const meta = CONTENT_TYPES[kind];
            const active = kindFilter === kind;
            return (
              <button
                key={kind} type="button" onClick={() => setKindFilter(kind)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  border: `1px solid ${active ? meta.color : 'var(--border)'}`,
                  background: active ? `${meta.color}22` : 'var(--card-bg)',
                  color: active ? meta.color : 'var(--text-secondary)',
                }}
              >
                <FeatherIcon name={meta.icon} size={13} color={active ? meta.color : 'var(--text-secondary)'} />
                {meta.label}
              </button>
            );
          })}
        </div>

        {/* Course chips (hidden for articles — they have no course mapping) */}
        {kindFilter !== 'article' && courses.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {['all', ...courses].map((course) => {
              const active = courseFilter === course;
              return (
                <button
                  key={course} type="button" onClick={() => setCourseFilter(course)}
                  style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                    border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                    background: active ? 'var(--primary-light)' : 'var(--card-bg)',
                    color: active ? 'var(--primary)' : 'var(--text-secondary)',
                  }}
                >
                  {course === 'all' ? 'ALL' : course}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Result count ── */}
      <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
        {filtered.length} item{filtered.length === 1 ? '' : 's'}
      </p>

      {/* ── Grouped sections ── */}
      {grouped.map(({ kind, items: sectionItems }) => {
        const meta = CONTENT_TYPES[kind];
        return (
          <div key={kind} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <FeatherIcon name={meta.icon} size={16} color={meta.color} />
              <h6 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{meta.label}</h6>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>({sectionItems.length})</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {sectionItems.map(renderCard)}
            </div>
          </div>
        );
      })}

      {/* Articles still loading — the rest of the library renders above */}
      {articlesLoading && (kindFilter === 'all' || kindFilter === 'article') && (
        <LoadingSpinner label="Loading articles…" />
      )}

      {/* Non-fatal article error */}
      {!articlesLoading && articlesError && (kindFilter === 'all' || kindFilter === 'article') && (
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
          Articles unavailable: {articlesError}
        </p>
      )}

      {/* Empty state */}
      {!articlesLoading && filtered.length === 0 && (
        <div className="vx-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <h5 style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--text)' }}>No content found</h5>
          <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 14 }}>Try adjusting your search or filters.</p>
          <button
            type="button" onClick={() => { setSearch(''); setKindFilter('all'); setCourseFilter('all'); }}
            style={{ padding: '10px 20px', borderRadius: 8, background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}

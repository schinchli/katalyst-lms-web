'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { ArticleListItem } from '@/lib/sanityClient';
import LoadingSpinner from '@/components/LoadingSpinner';

const TAG_COLORS: Record<string, string> = {
  'AWS':           'vx-badge-primary',
  'GenAI':         'vx-badge-success',
  'Security':      'vx-badge-error',
  'Networking':    'vx-badge-info',
  'Hugging Face':  'vx-badge-primary',
  'SQL':           'vx-badge-info',
  'AI Agents':     'vx-badge-success',
  'Bedrock':       'vx-badge-warning',
  'Prompting':     'vx-badge-error',
  'Observability': 'vx-badge-secondary',
};

const TAG_AVATAR: Record<string, string> = {
  'AWS':           'vx-avatar-primary',
  'GenAI':         'vx-avatar-success',
  'Security':      'vx-avatar-error',
  'Networking':    'vx-avatar-info',
  'Hugging Face':  'vx-avatar-primary',
  'SQL':           'vx-avatar-info',
  'AI Agents':     'vx-avatar-success',
  'Bedrock':       'vx-avatar-warning',
  'Prompting':     'vx-avatar-error',
  'Observability': 'vx-avatar-secondary',
};

function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function LearnPage() {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/articles')
      .then((r) => r.json())
      .then((d: { ok: boolean; articles?: ArticleListItem[]; error?: string }) => {
        if (d.ok && d.articles) setArticles(d.articles);
        else setError(d.error ?? 'Failed to load articles');
      })
      .catch(() => setError('Failed to load articles'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-content">
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Resources</h4>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
          Editorial-style articles, cheat sheets, and guided notes for deep study sessions.
        </p>
      </div>

      {loading && <LoadingSpinner label="Loading articles…" />}

      {!loading && error && (
        <div className="vx-card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {!loading && !error && articles.length === 0 && (
        <div className="vx-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
          No articles published yet. Check back soon!
        </div>
      )}

      {/* Article grid — same layout as /dashboard/quizzes */}
      {!loading && articles.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {articles.map((article) => {
            const tagColor    = TAG_COLORS[article.tag ?? ''] ?? 'vx-badge-secondary';
            const avatarColor = TAG_AVATAR[article.tag ?? ''] ?? 'vx-avatar-primary';
            const tagLetter   = article.tag?.charAt(0).toUpperCase() ?? 'A';

            return (
              <Link
                key={article.slug}
                href={`/dashboard/learn/${article.slug}`}
                className="quiz-card"
                style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
              >
                {/* Card header */}
                <div style={{ padding: '20px 20px 14px', flex: 1 }}>
                  {/* Top row: tag + premium badge on left, readTime on right */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span className={`vx-badge ${tagColor}`}>{article.tag ?? 'General'}</span>
                      {article.accessTier === 'premium' && (
                        <span className="vx-badge vx-badge-warning">Premium</span>
                      )}
                    </div>
                    {article.readTime && (
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{article.readTime}</span>
                    )}
                  </div>
                  {/* Tag avatar in the "icon" slot (mirrors quiz.icon) */}
                  <div
                    className={`vx-avatar ${avatarColor}`}
                    style={{ width: 48, height: 48, borderRadius: 12, fontSize: 18, fontWeight: 700, marginBottom: 12 }}
                  >
                    {tagLetter}
                  </div>
                  <h6 style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 15, color: 'var(--text)', lineHeight: 1.4 }}>
                    {article.title}
                  </h6>
                  {article.excerpt && (
                    <p
                      style={{
                        margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}
                    >
                      {article.excerpt}
                    </p>
                  )}
                </div>
                {/* Card footer */}
                <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {article.author ?? 'LearnKloud Team'}
                    </span>
                    {article.publishedAt && <span>{formatDate(article.publishedAt)}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

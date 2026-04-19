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

      {/* Article grid */}
      {!loading && articles.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {articles.map((article) => {
            const tagColor   = TAG_COLORS[article.tag ?? ''] ?? 'vx-badge-secondary';
            const avatarColor = TAG_AVATAR[article.tag ?? ''] ?? 'vx-avatar-primary';
            return (
              <Link key={article.slug} href={`/dashboard/learn/${article.slug}`} style={{ textDecoration: 'none' }}>
                <article
                  className="vx-card"
                  style={{ height: '100%', cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)')}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span className={`vx-badge ${tagColor}`}>{article.tag ?? 'General'}</span>
                    {article.accessTier === 'premium' && (
                      <span className="vx-badge vx-badge-warning" style={{ fontSize: 10 }}>PREMIUM</span>
                    )}
                  </div>
                  <h6 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, flex: 1 }}>
                    {article.title}
                  </h6>
                  {article.excerpt && (
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {article.excerpt}
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className={`vx-avatar ${avatarColor}`} style={{ width: 28, height: 28, fontSize: 11, fontWeight: 700 }}>
                        {article.author?.charAt(0) ?? 'K'}
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{article.author ?? 'LearnKloud Team'}</span>
                    </div>
                    {article.readTime && (
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {article.readTime}
                      </span>
                    )}
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

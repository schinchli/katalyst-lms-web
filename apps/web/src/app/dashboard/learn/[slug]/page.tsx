'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { PortableText, type PortableTextComponents } from '@portabletext/react';
import { supabase } from '@/lib/supabase';
import { urlFor, type ArticleFull, type ArticleListItem } from '@/lib/sanityClient';
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

function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ── Portable Text → Katalyst styled components ────────────────────────────────

const portableTextComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p style={{ fontSize: 16, lineHeight: 1.85, color: 'var(--text)', marginBottom: 20 }}>{children}</p>
    ),
    h2: ({ children }) => (
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '36px 0 12px', paddingTop: 8, borderTop: '1px solid var(--border)' }}>{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: '24px 0 10px' }}>{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '20px 0 8px' }}>{children}</h4>
    ),
    blockquote: ({ children }) => (
      <blockquote style={{ margin: '0 0 20px', padding: '14px 20px', borderLeft: '3px solid var(--primary)', background: 'rgba(115,103,240,0.06)', borderRadius: '0 8px 8px 0', fontSize: 16, color: 'var(--text)', fontStyle: 'normal', lineHeight: 1.7 }}>
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul style={{ margin: '0 0 20px', padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>{children}</ul>
    ),
    number: ({ children }) => (
      <ol style={{ margin: '0 0 20px', paddingLeft: 20, display: 'grid', gap: 8 }}>{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 15, lineHeight: 1.7, color: 'var(--text)' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 9 }} />
        <span>{children}</span>
      </li>
    ),
    number: ({ children }) => (
      <li style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text)' }}>{children}</li>
    ),
  },
  marks: {
    strong: ({ children }) => <strong style={{ fontWeight: 700, color: 'var(--text)' }}>{children}</strong>,
    em:     ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
    code:   ({ children }) => (
      <code style={{ fontFamily: 'monospace', fontSize: '0.875em', background: 'var(--border)', padding: '1px 6px', borderRadius: 4, color: 'var(--primary)' }}>
        {children}
      </code>
    ),
    link: ({ value, children }) => (
      <a href={value?.href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
        {children}
      </a>
    ),
  },
  types: {
    // Custom code block
    codeBlock: ({ value }) => (
      <div style={{ marginBottom: 24, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
        {value.language && (
          <div style={{ background: 'var(--border)', padding: '6px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--error)' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
            <span style={{ marginLeft: 8 }}>{value.language}</span>
          </div>
        )}
        <pre style={{ margin: 0, padding: '18px 20px', background: 'var(--bg)', fontSize: 13, lineHeight: 1.75, overflowX: 'auto', color: 'var(--text)' }}>
          <code>{value.code}</code>
        </pre>
      </div>
    ),
    // Callout / tip
    callout: ({ value }) => {
      const colors: Record<string, { bg: string; border: string; icon: string }> = {
        info:    { bg: 'rgba(115,103,240,0.08)', border: 'rgba(115,103,240,0.2)',  icon: 'var(--primary)' },
        warning: { bg: 'rgba(255,159,67,0.08)',  border: 'rgba(255,159,67,0.2)',   icon: 'var(--warning)' },
        success: { bg: 'rgba(40,199,111,0.08)',  border: 'rgba(40,199,111,0.2)',   icon: 'var(--success)' },
      };
      const c = colors[value.variant ?? 'info'];
      return (
        <div style={{ margin: '0 0 24px', padding: '16px 20px', borderRadius: 10, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'var(--text)' }}>{value.text}</p>
        </div>
      );
    },
    // YouTube embed
    youtubeEmbed: ({ value }) => {
      const src = `https://www.youtube.com/embed/${value.videoId}?rel=0&modestbranding=1`;
      return (
        <div style={{ marginBottom: 28, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          <iframe
            src={src}
            title={value.title ?? 'YouTube video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      );
    },
    // Sanity image
    image: ({ value }) => {
      if (!value?.asset) return null;
      const imgUrl = urlFor(value).width(900).auto('format').url();
      return (
        <figure style={{ margin: '0 0 28px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgUrl} alt={value.alt ?? ''} style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)', display: 'block' }} />
          {value.caption && (
            <figcaption style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', fontStyle: 'italic' }}>
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
  },
};

// ── Premium paywall ───────────────────────────────────────────────��───────────

function PremiumPaywall({ article }: { article: Partial<ArticleListItem> }) {
  return (
    <div style={{ margin: '32px 0', padding: '36px 32px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(115,103,240,0.12) 0%, rgba(115,103,240,0.04) 100%)', border: '1px solid rgba(115,103,240,0.25)', textAlign: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
      <h3 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
        This is a Pro article
      </h3>
      <p style={{ margin: '0 0 24px', fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
        <strong style={{ color: 'var(--text)' }}>{article.title}</strong> is available to Pro subscribers.
        Upgrade to unlock all premium articles, the full 195-question CLF-C02 exam, and an ad-free experience.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/dashboard/profile" className="btn-primary" style={{ textDecoration: 'none' }}>
          Upgrade to Pro
        </Link>
        <Link href="/dashboard/learn" className="btn-outline" style={{ textDecoration: 'none' }}>
          Browse free articles
        </Link>
      </div>
      <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
        ₹999/year · ₹149/month · Cancel anytime
      </p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

type PageState =
  | { status: 'loading' }
  | { status: 'ok'; article: ArticleFull; sidebarArticles: ArticleListItem[] }
  | { status: 'premium'; article: Partial<ArticleListItem> }
  | { status: 'unauthenticated' }
  | { status: 'notfound' }
  | { status: 'error'; message: string };

export default function ArticlePage() {
  const { slug }           = useParams<{ slug: string }>();
  const router             = useRouter();
  const [state, setState]  = useState<PageState>({ status: 'loading' });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token;
      if (!token) { setState({ status: 'unauthenticated' }); return; }

      const [articleRes, listRes] = await Promise.all([
        fetch(`/api/articles/${slug}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/articles'),
      ]);

      if (articleRes.status === 401) { setState({ status: 'unauthenticated' }); return; }
      if (articleRes.status === 404) { setState({ status: 'notfound' }); return; }

      if (articleRes.status === 403) {
        const body = await articleRes.json() as { article?: Partial<ArticleListItem> };
        setState({ status: 'premium', article: body.article ?? {} });
        return;
      }

      if (!articleRes.ok) {
        setState({ status: 'error', message: 'Failed to load article' });
        return;
      }

      const articleBody = await articleRes.json() as { ok: boolean; article: ArticleFull };
      const listBody    = listRes.ok ? await listRes.json() as { ok: boolean; articles: ArticleListItem[] } : { ok: false, articles: [] as ArticleListItem[] };

      setState({
        status: 'ok',
        article: articleBody.article,
        sidebarArticles: (listBody.articles ?? []).filter((a) => a.slug !== slug).slice(0, 5),
      });
    });
  }, [slug, router]);

  if (state.status === 'loading') {
    return <div className="page-content"><LoadingSpinner label="Loading article…" /></div>;
  }

  if (state.status === 'unauthenticated') {
    return (
      <div className="page-content">
        <div className="vx-card" style={{ padding: 48, textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 12px', color: 'var(--text)' }}>Sign in to read this article</h4>
          <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: 14 }}>Create a free account to access all articles.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link href="/login" className="btn-primary" style={{ textDecoration: 'none' }}>Sign in</Link>
            <Link href="/signup" className="btn-outline" style={{ textDecoration: 'none' }}>Create free account</Link>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === 'notfound') {
    return (
      <div className="page-content">
        <div className="vx-card" style={{ padding: 48, textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 12px', color: 'var(--text)' }}>Article not found</h4>
          <Link href="/dashboard/learn" className="btn-primary" style={{ textDecoration: 'none' }}>Back to Resources</Link>
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="page-content">
        <div className="vx-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
          {state.message}
        </div>
      </div>
    );
  }

  if (state.status === 'premium') {
    return (
      <div className="page-content">
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <Link href="/dashboard/learn" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Resources
          </Link>
        </div>
        <div className="vx-card" style={{ padding: '36px 40px' }}>
          <PremiumPaywall article={state.article} />
        </div>
      </div>
    );
  }

  const { article, sidebarArticles } = state;
  const tagColor = TAG_COLORS[article.tag ?? ''] ?? 'vx-badge-secondary';

  return (
    <div className="page-content">
      {/* Breadcrumb */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
        <Link href="/dashboard/learn" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Resources
        </Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--border)' }}><polyline points="9 18 15 12 9 6"/></svg>
        <span style={{ color: 'var(--text)' }}>{article.title}</span>
      </div>

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 24, alignItems: 'start' }}>

        {/* Article card */}
        <div className="vx-card" style={{ padding: '36px 40px' }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
              {article.tag && <span className={`vx-badge ${tagColor}`}>{article.tag}</span>}
              {article.accessTier === 'premium' && (
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-gold)', background: 'rgba(255,180,0,0.12)', padding: '2px 8px', borderRadius: 99, border: '1px solid rgba(255,180,0,0.25)' }}>
                  PRO
                </span>
              )}
              {article.readTime && (
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {article.readTime}
                </span>
              )}
            </div>
            <h1 style={{ margin: '0 0 16px', fontSize: 32, fontWeight: 700, lineHeight: 1.25, color: 'var(--text)' }}>
              {article.title}
            </h1>
            {article.excerpt && (
              <p style={{ margin: '0 0 20px', fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {article.excerpt}
              </p>
            )}
            {/* Author row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-light)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>K</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{article.author ?? 'Katalyst Team'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(article.publishedAt)}</div>
              </div>
            </div>
          </div>

          {/* Portable Text body */}
          {article.body && article.body.length > 0 && (
            <div>
              <PortableText value={article.body} components={portableTextComponents} />
            </div>
          )}

          {/* Related quiz CTA */}
          {article.relatedQuizId && (
            <div style={{ marginTop: 36, padding: '20px 24px', borderRadius: 10, background: 'var(--primary-light)', border: '1px solid rgba(115,103,240,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>Ready to practice?</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Reinforce this article with a related quiz.</div>
              </div>
              <Link href={`/dashboard/quiz/${article.relatedQuizId}`} className="btn-primary" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
                Open Practice Quiz
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sidebarArticles.length > 0 && (
            <div className="vx-card" style={{ padding: 20 }}>
              <h5 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>More Resources</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sidebarArticles.map((a) => (
                  <Link key={a._id} href={`/dashboard/learn/${a.slug}`} style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>{a.title}</div>
                        {a.accessTier === 'premium' && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-gold)', background: 'rgba(255,180,0,0.12)', padding: '1px 5px', borderRadius: 99, flexShrink: 0 }}>PRO</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{a.tag}{a.readTime ? ` · ${a.readTime}` : ''}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Link href="/dashboard/quizzes" style={{ textDecoration: 'none' }}>
            <div className="vx-card" style={{ padding: 20, background: 'var(--primary-light)', border: '1px solid rgba(115,103,240,0.2)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>Browse All Courses</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Practice with 400+ certification questions across AWS and GenAI tracks.</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

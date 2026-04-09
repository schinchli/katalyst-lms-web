'use client';
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FEATURED_ARTICLES, type ArticleSection } from '@/lib/experienceFixtures';

const TAG_COLORS: Record<string, string> = {
  'Hugging Face': 'vx-badge-primary',
  'SQL': 'vx-badge-info',
  'AI Agents': 'vx-badge-success',
  'Bedrock': 'vx-badge-warning',
  'Prompting': 'vx-badge-error',
  'Observability': 'vx-badge-secondary',
};

function Section({ section }: { section: ArticleSection }) {
  switch (section.type) {
    case 'intro':
      return (
        <p style={{ fontSize: 18, lineHeight: 1.9, color: 'var(--text)', marginBottom: 28, fontWeight: 400, borderLeft: '3px solid var(--primary)', paddingLeft: 18 }}>
          {section.text}
        </p>
      );
    case 'heading':
      return (
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '36px 0 12px', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
          {section.text}
        </h2>
      );
    case 'paragraph':
      return (
        <p style={{ fontSize: 16, lineHeight: 1.85, color: 'var(--text)', marginBottom: 20 }}>
          {section.text}
        </p>
      );
    case 'list':
      return (
        <ul style={{ margin: '0 0 20px', padding: '0 0 0 0', listStyle: 'none', display: 'grid', gap: 8 }}>
          {section.items?.map((item, i) => (
            <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 15, lineHeight: 1.7, color: 'var(--text)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 9 }} />
              {item}
            </li>
          ))}
        </ul>
      );
    case 'code':
      return (
        <div style={{ marginBottom: 24, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
          {section.language && (
            <div style={{ background: 'var(--border)', padding: '6px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--error)' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
              <span style={{ marginLeft: 8 }}>{section.language}</span>
            </div>
          )}
          <pre style={{ margin: 0, padding: '18px 20px', background: 'var(--bg)', fontSize: 13, lineHeight: 1.75, overflowX: 'auto', color: 'var(--text)' }}>
            <code>{section.text}</code>
          </pre>
        </div>
      );
    case 'callout':
      return (
        <div style={{ margin: '0 0 24px', padding: '16px 20px', borderRadius: 10, background: 'rgba(115,103,240,0.08)', border: '1px solid rgba(115,103,240,0.2)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'var(--text)' }}>{section.text}</p>
        </div>
      );
    default:
      return null;
  }
}

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const article = FEATURED_ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    return (
      <div className="page-content">
        <div className="vx-card" style={{ padding: 48, textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 12px', color: 'var(--text)' }}>Article not found</h4>
          <Link href="/dashboard/learn" className="btn-primary" style={{ textDecoration: 'none' }}>Back to Resources</Link>
        </div>
      </div>
    );
  }

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

      {/* Article container — Medium-like reading layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 24, alignItems: 'start' }}>

        {/* Main content */}
        <div className="vx-card" style={{ padding: '36px 40px' }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
              <span className={`vx-badge ${TAG_COLORS[article.tag] ?? 'vx-badge-secondary'}`}>{article.tag}</span>
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
            <p style={{ margin: '0 0 20px', fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {article.description}
            </p>

            {/* Author row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-light)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>K</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{article.author}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{article.date}</div>
              </div>
            </div>
          </div>

          {/* Article body */}
          <div>
            {article.content.map((section, i) => (
              <Section key={i} section={section} />
            ))}
          </div>

          {/* Footer CTA */}
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

        {/* Sidebar: other articles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="vx-card" style={{ padding: 20 }}>
            <h5 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>More Resources</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {FEATURED_ARTICLES.filter((a) => a.slug !== slug).slice(0, 5).map((a) => (
                <Link key={a.slug} href={`/dashboard/learn/${a.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4, lineHeight: 1.4 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{a.tag} · {a.readTime}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

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

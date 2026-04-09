'use client';
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { FEATURED_ARTICLES } from '@/lib/experienceFixtures';

const TAG_COLORS: Record<string, string> = {
  'Hugging Face': 'vx-badge-primary',
  'SQL': 'vx-badge-info',
  'AI Agents': 'vx-badge-success',
  'Bedrock': 'vx-badge-warning',
  'Prompting': 'vx-badge-error',
  'Observability': 'vx-badge-secondary',
};

const TAG_AVATAR: Record<string, string> = {
  'Hugging Face': 'vx-avatar-primary',
  'SQL': 'vx-avatar-info',
  'AI Agents': 'vx-avatar-success',
  'Bedrock': 'vx-avatar-warning',
  'Prompting': 'vx-avatar-error',
  'Observability': 'vx-avatar-secondary',
};

export default function LearnPage() {
  return (
    <div className="page-content">
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Resources</h4>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
          Editorial-style articles, cheat sheets, and guided notes for deep study sessions.
        </p>
      </div>

      {/* Article grid — Vuexy blog card pattern */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {FEATURED_ARTICLES.map((article) => (
          <Link
            key={article.slug}
            href={`/dashboard/learn/${article.slug}`}
            style={{ textDecoration: 'none', display: 'block' }}
          >
            <article className="vx-card" style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(115,103,240,0.18)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ''; (e.currentTarget as HTMLElement).style.transform = ''; }}
            >
              {/* Tag + date */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span className={`vx-badge ${TAG_COLORS[article.tag] ?? 'vx-badge-secondary'}`}>{article.tag}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{article.date}</span>
              </div>

              {/* Avatar + title */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div className={`vx-avatar ${TAG_AVATAR[article.tag] ?? 'vx-avatar-secondary'}`} style={{ flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                </div>
                <h5 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 }}>{article.title}</h5>
              </div>

              {/* Description */}
              <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, flex: 1 }}>
                {article.description}
              </p>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-light)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>K</div>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{article.author}</span>
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
        ))}
      </div>
    </div>
  );
}

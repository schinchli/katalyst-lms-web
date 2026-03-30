'use client';
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { FEATURED_ARTICLES } from '@/lib/experienceFixtures';
import { usePlatformExperience } from '@/components/PlatformExperienceProvider';

export default function LearnPage() {
  const { config } = usePlatformExperience();
  const visibleArticles = FEATURED_ARTICLES.slice(0, config.layout.resourcesArticleCount);

  return (
    <div className="page-content dc-shell" style={{ maxWidth: 1240 }}>
      <section className="dc-hero" style={{ padding: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 22, alignItems: 'start', flexWrap: 'wrap' }}>
          <div>
            <span className="dc-chip">{config.copy.resourcesFilter}</span>
            <h1 style={{ margin: '18px 0 12px', fontSize: 'clamp(34px, 4.5vw, 54px)', lineHeight: 1.03 }}>{config.copy.learnTitle}</h1>
            <p style={{ margin: 0, maxWidth: 780, color: 'var(--text-secondary)', fontSize: 17, lineHeight: 1.8 }}>
              {config.copy.learnSubtitle}
            </p>
          </div>
          <div className="dc-card" style={{ padding: 18, minWidth: 260 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Article count</div>
            <div style={{ marginTop: 10, fontSize: 38, fontWeight: 700 }}>{visibleArticles.length}</div>
            <div style={{ marginTop: 8, color: 'var(--text-secondary)' }}>Controlled from admin settings</div>
          </div>
        </div>
      </section>

      <section className="dc-card" style={{ padding: 22, background: 'var(--platform-resources-background)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h2 className="dc-section-title" style={{ fontSize: 30, color: 'var(--text)' }}>{config.copy.resourcesTitle}</h2>
            <p className="dc-section-subtitle" style={{ color: 'var(--text-secondary)' }}>
              Responsive editorial cards with adjustable volume, tag labels, and a calmer reading surface.
            </p>
          </div>
          <div className="dc-chip" style={{ background: 'rgba(0, 237, 100, 0.12)', color: 'var(--text)', borderColor: 'rgba(0, 237, 100, 0.18)' }}>
            {config.copy.resourcesFilter}
          </div>
        </div>
      </section>

      <section className="dc-resource-list">
        {visibleArticles.map((article, index) => (
          <article key={article.slug} className="dc-resource-card" style={{ background: config.layout.resourcesCardStyle === 'compact' ? 'var(--surface)' : undefined }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'start', flexWrap: 'wrap' }}>
              <span className="dc-chip" style={{ background: index % 3 === 0 ? 'rgba(0,237,100,0.14)' : index % 3 === 1 ? 'rgba(61,123,255,0.14)' : 'rgba(111,68,255,0.14)', color: 'inherit' }}>
                {article.tag}
              </span>
              <div style={{ color: 'inherit', opacity: 0.7 }}>{article.author} · {article.date}</div>
            </div>
            <h2 style={{ margin: '20px 0 14px', fontSize: config.layout.resourcesCardStyle === 'compact' ? 34 : 46, lineHeight: 1.05 }}>{article.title}</h2>
            <p style={{ margin: 0, fontSize: config.layout.resourcesCardStyle === 'compact' ? 17 : 20, lineHeight: 1.75, opacity: 0.78 }}>{article.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginTop: 24, flexWrap: 'wrap' }}>
              <div style={{ color: 'inherit', opacity: 0.68 }}>
                Learn the concept, then jump into the matching quiz rail to reinforce it immediately.
              </div>
              <Link href="/dashboard/quizzes" className="btn-primary" style={{ textDecoration: 'none' }}>
                Open practice
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

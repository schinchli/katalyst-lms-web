'use client';

import { useEffect, useState } from 'react';

interface CloudNewsItem {
  id: string;
  title: string;
  url: string;
  excerpt: string | null;
  imageUrl: string;
  source: string;
  provider: string;
  publishedAt: string | null;
}

/** Cloud News carousel — parity with mobile home cloud-news widget. */
export default function CloudNews() {
  const [news, setNews] = useState<CloudNewsItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/cloud-news?limit=8')
      .then((r) => r.json() as Promise<{ ok: boolean; news?: CloudNewsItem[] }>)
      .then((b) => { if (active) setNews(b.news ?? []); })
      .catch(() => { if (active) setNews([]); })
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []);

  // Hide entirely if there's nothing to show (no dead/empty widget).
  if (loaded && news.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h5 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>☁️ Cloud News</h5>
      </div>
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4 }}>
        {(loaded ? news : Array.from({ length: 4 })).map((item, idx) => {
          const n = item as CloudNewsItem | undefined;
          return (
            <a
              key={n?.id ?? idx}
              href={n?.url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="vx-card"
              style={{ flex: '0 0 260px', width: 260, padding: 14, textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="vx-badge vx-badge-info" style={{ textTransform: 'uppercase' }}>{n?.provider ?? '···'}</span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{n?.source ?? ''}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {n?.title ?? 'Loading…'}
              </div>
              {n?.excerpt && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {n.excerpt}
                </div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}

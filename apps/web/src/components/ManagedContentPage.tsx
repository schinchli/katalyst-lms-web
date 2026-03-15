'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { AppContentConfig } from '@/lib/appContent';

type ContentKey = 'privacyPolicy' | 'termsAndConditions' | 'aboutUs' | 'instructions';

const TITLES: Record<ContentKey, string> = {
  privacyPolicy: 'Privacy Policy',
  termsAndConditions: 'Terms & Conditions',
  aboutUs: 'About Us',
  instructions: 'How To Play',
};

export function ManagedContentPage({ contentKey }: { contentKey: ContentKey }) {
  const [content, setContent] = useState<AppContentConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/app-content')
      .then((response) => response.json() as Promise<{ content?: AppContentConfig }>)
      .then((body) => setContent(body.content ?? null))
      .finally(() => setLoading(false));
  }, []);

  const title = TITLES[contentKey];
  const body = useMemo(() => content?.[contentKey] ?? '', [content, contentKey]);

  return (
    <div className="page-content dc-shell">
      <section className="dc-hero" style={{ padding: 30 }}>
        <span className="dc-chip">{content?.appName ?? 'Katalyst LMS'}</span>
        <h1 style={{ margin: '18px 0 12px', fontSize: 'clamp(34px, 4.5vw, 54px)', lineHeight: 1.03 }}>{title}</h1>
        <p style={{ margin: 0, maxWidth: 780, color: 'var(--text-secondary)', fontSize: 17, lineHeight: 1.8 }}>
          Managed from admin settings and shared across the website and mobile app.
        </p>
      </section>

      <section>
        <div className="dc-card" style={{ padding: 28 }}>
          {loading ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading content…</p>
          ) : (
            <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text)', lineHeight: 1.8, fontSize: 15 }}>
              {body}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
            <Link href="/privacy" className="btn-primary" style={{ textDecoration: 'none' }}>Privacy</Link>
            <Link href="/terms" className="btn-primary" style={{ textDecoration: 'none' }}>Terms</Link>
            <Link href="/about" className="btn-primary" style={{ textDecoration: 'none' }}>About</Link>
            <Link href="/instructions" className="btn-primary" style={{ textDecoration: 'none' }}>Instructions</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

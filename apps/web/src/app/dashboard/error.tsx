'use client';
/**
 * Dashboard error boundary — shown when an unhandled error occurs in any
 * /dashboard/* page. Next.js App Router requires this to be a Client Component.
 */

import { useEffect } from 'react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => {
    // Log to console in dev; replace with Sentry/CloudWatch in production
    if (process.env.NODE_ENV === 'development') {
      console.error('[Dashboard Error]', error);
    }
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 52, marginBottom: 20 }}>⚠️</div>
      <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
        Something went wrong
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 420, lineHeight: 1.6, margin: '0 0 28px' }}>
        An unexpected error occurred. Your data is safe — please try again.
        {process.env.NODE_ENV === 'development' && (
          <span style={{ display: 'block', marginTop: 10, fontFamily: 'monospace', fontSize: 12, color: 'var(--error)' }}>
            {error.message}
          </span>
        )}
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={reset}
          style={{
            height: 40, padding: '0 20px', borderRadius: 8,
            background: 'var(--primary)', color: '#fff',
            fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Try again
        </button>
        <button
          onClick={() => { window.location.href = '/dashboard'; }}
          style={{
            height: 40, padding: '0 20px', borderRadius: 8,
            background: 'transparent', color: 'var(--text-secondary)',
            fontSize: 14, fontWeight: 600, border: '1.5px solid var(--border)',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Go to Dashboard
        </button>
      </div>
      {error.digest && (
        <p style={{ marginTop: 20, fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}

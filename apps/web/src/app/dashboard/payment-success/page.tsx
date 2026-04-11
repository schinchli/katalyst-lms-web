'use client';
export const dynamic = 'force-dynamic';

/**
 * /dashboard/payment-success
 * Stripe redirects here after a successful Checkout Session.
 * Reads ?session_id=xxx, verifies server-side, updates local subscription state,
 * then redirects to the quiz (or quizzes list).
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type VerifyState = 'loading' | 'success' | 'error';

export default function PaymentSuccessPage() {
  const router       = useRouter();
  const params       = useSearchParams();
  const sessionId    = params.get('session_id') ?? '';
  const quizId       = params.get('quiz_id')    ?? '';
  const [state,   setState]   = useState<VerifyState>('loading');
  const [message, setMessage] = useState('Confirming your payment…');

  useEffect(() => {
    if (!sessionId) { setState('error'); setMessage('Missing session ID.'); return; }

    void (async () => {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        setState('error');
        setMessage('Please sign in and try again.');
        return;
      }

      const res = await fetch(
        `/api/payment/stripe/verify?session_id=${encodeURIComponent(sessionId)}`,
        { headers: { Authorization: `Bearer ${authSession.access_token}` } },
      ).catch(() => null);

      if (!res?.ok) {
        setState('error');
        setMessage('Could not confirm payment. Contact support if you were charged.');
        return;
      }

      const data = await res.json() as {
        verified: boolean;
        purchaseType?: string;
        plan?: string;
        courseId?: string;
      };

      if (!data.verified) {
        setState('error');
        setMessage('Payment not yet confirmed. Please wait a moment and refresh.');
        return;
      }

      setState('success');
      const typeLabel = data.purchaseType === 'subscription'
        ? `Pro ${data.plan === 'annual' ? '(Annual)' : '(Monthly)'}` : 'Course';
      setMessage(`${typeLabel} unlocked! Redirecting you back…`);

      setTimeout(() => {
        router.replace(quizId ? `/dashboard/quiz/${quizId}` : '/dashboard/quizzes');
      }, 2000);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const destPath = quizId ? `/dashboard/quiz/${quizId}` : '/dashboard/quizzes';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', border: '1px solid var(--border)', boxShadow: '0 8px 48px rgba(47,43,61,0.15)' }}>

        {/* Compact logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 36 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0 }}>K</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>LearnKloud</div>
        </div>

        {/* Loading state */}
        {state === 'loading' && (
          <>
            {/* Animated spinner */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <svg
                width="64" height="64" viewBox="0 0 64 64" fill="none"
                style={{ animation: 'spin 0.9s linear infinite' }}
              >
                <circle cx="32" cy="32" r="26" stroke="var(--border)" strokeWidth="5" />
                <path d="M32 6 A26 26 0 0 1 58 32" stroke="var(--primary)" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>Confirming Payment</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Confirming your payment…
            </p>
          </>
        )}

        {/* Success state */}
        {state === 'success' && (
          <>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(40,199,111,0.12)', border: '2px solid var(--success)', display: 'grid', placeItems: 'center', margin: '0 auto 24px' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>Payment Confirmed! 🎉</h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 28px' }}>
              {message}
            </p>
            <button
              onClick={() => router.replace(destPath)}
              style={{ width: '100%', minHeight: 48, border: 'none', cursor: 'pointer', borderRadius: 10, background: 'var(--success)', color: '#fff', fontSize: 15, fontWeight: 600 }}
            >
              Back to quiz →
            </button>
            <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
              Redirecting in 2 seconds…
            </p>
          </>
        )}

        {/* Error state */}
        {state === 'error' && (
          <>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,159,67,0.12)', border: '2px solid #FF9F43', display: 'grid', placeItems: 'center', margin: '0 auto 24px' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FF9F43" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>Verification Issue</h2>
            <p style={{ fontSize: 15, color: 'var(--error)', lineHeight: 1.6, margin: '0 0 28px' }}>
              {message}
            </p>
            <button
              onClick={() => router.replace(destPath)}
              className="btn-primary"
              style={{ width: '100%', minHeight: 48 }}
            >
              Back to quizzes
            </button>
          </>
        )}
      </div>

      {/* Spinner keyframes — injected inline so no globals.css change needed */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

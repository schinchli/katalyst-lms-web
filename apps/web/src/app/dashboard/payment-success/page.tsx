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
  const [state,  setState]  = useState<VerifyState>('loading');
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

  const icon = state === 'loading' ? '⏳' : state === 'success' ? '🎉' : '⚠️';
  const color = state === 'error' ? '#FF4C51' : '#28C76F';

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 24,
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 20, padding: '48px 40px',
        maxWidth: 440, width: '100%', textAlign: 'center',
        border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>{icon}</div>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: '0 0 12px' }}>
          {state === 'loading' ? 'Confirming Payment' : state === 'success' ? 'Payment Confirmed!' : 'Verification Issue'}
        </h2>
        <p style={{ fontSize: 15, color: state === 'error' ? color : 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 28px' }}>
          {message}
        </p>
        {state !== 'loading' && (
          <button
            onClick={() => router.replace(quizId ? `/dashboard/quiz/${quizId}` : '/dashboard/quizzes')}
            className="btn-primary"
            style={{ width: '100%', minHeight: 48 }}
          >
            {state === 'success' ? 'Back to quiz →' : 'Back to quizzes'}
          </button>
        )}
      </div>
    </div>
  );
}

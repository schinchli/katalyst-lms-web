'use client';
/**
 * usePayment
 * ──────────
 * Unified payment hook for Razorpay (India) and Stripe (international).
 *
 * Razorpay flow: opens inline modal → verify server-side → onSuccess()
 * Stripe flow:   redirects to Stripe Checkout → /dashboard/payment-success → verify
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ── Razorpay checkout.js types ─────────────────────────────────────────────
interface RazorpayOptions {
  key:         string;
  amount:      number;
  currency:    string;
  name:        string;
  description: string;
  order_id:    string;
  handler:     (response: RazorpayPaymentResponse) => void;
  prefill?:    { email?: string; name?: string };
  theme?:      { color?: string };
  modal?:      { ondismiss?: () => void; escape?: boolean };
}
interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id:   string;
  razorpay_signature:  string;
}
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open(): void };
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export type Gateway = 'razorpay' | 'stripe';

export type PaymentOptions =
  | { type: 'subscription'; plan: 'annual' | 'monthly' }
  | { type: 'course'; courseId: string };

export interface PaymentSuccessResult {
  purchaseType:    'subscription' | 'course';
  plan?:           string;
  courseId?:       string;
  unlockedCourses?: string[];
  subscription?:   string;
}

/**
 * Waits for window.Razorpay to be available (loaded via Next.js Script tag in the page).
 * Polls for up to 5 seconds before rejecting.
 */
function waitForRazorpay(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = setInterval(() => {
      attempts++;
      if (window.Razorpay) { clearInterval(check); resolve(); return; }
      if (attempts >= 50) {
        clearInterval(check);
        reject(new Error('Payment provider not loaded. Please refresh and try again.'));
      }
    }, 100);
  });
}

export function usePayment(callbacks?: {
  onSuccess?: (result: PaymentSuccessResult) => void;
  onError?:   (message: string) => void;
  onDismiss?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  // ── Razorpay ──────────────────────────────────────────────────────────────
  const initiateRazorpay = useCallback(async (
    opts: PaymentOptions,
    session: { access_token: string; user: { email?: string; user_metadata?: Record<string, unknown> } },
  ) => {
    await waitForRazorpay();
    if (!window.Razorpay) throw new Error('Payment provider failed to load. Please refresh.');

    const orderRes = await fetch('/api/payment/create-order', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(
        opts.type === 'subscription'
          ? { purchaseType: 'subscription', plan: opts.plan }
          : { purchaseType: 'course', courseId: opts.courseId },
      ),
    });
    if (!orderRes.ok) {
      const body = await orderRes.json() as { error?: string };
      throw new Error(body.error ?? 'Failed to create payment order.');
    }

    const orderData = await orderRes.json() as {
      orderId: string; amount: number; currency: string; keyId: string;
      purchaseType: string; plan?: string; courseId?: string;
    };

    await new Promise<void>((resolve, reject) => {
      const rzp = new window.Razorpay!({
        key:         orderData.keyId,
        amount:      orderData.amount,
        currency:    orderData.currency,
        name:        'LearnKloud',
        description: opts.type === 'subscription'
          ? `Pro ${opts.plan === 'annual' ? '₹999/yr' : '₹149/mo'}`
          : 'Course unlock',
        order_id:    orderData.orderId,
        theme:       { color: '#7367F0' },
        prefill:     {
          email: session.user?.email ?? undefined,
          name:  (session.user?.user_metadata?.name as string | undefined) ?? undefined,
        },
        modal: {
          escape:    false,
          ondismiss: () => { callbacks?.onDismiss?.(); setLoading(false); resolve(); },
        },
        handler: async (response: RazorpayPaymentResponse) => {
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_signature:  response.razorpay_signature,
                purchaseType:        orderData.purchaseType,
                plan:                orderData.plan,
                courseId:            orderData.courseId,
              }),
            });
            if (!verifyRes.ok) {
              const body = await verifyRes.json() as { error?: string };
              throw new Error(body.error ?? 'Payment verification failed.');
            }
            const result = await verifyRes.json() as PaymentSuccessResult;
            callbacks?.onSuccess?.(result);
            setLoading(false);
            resolve();
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Verification error.';
            setError(msg);
            callbacks?.onError?.(msg);
            setLoading(false);
            reject(err);
          }
        },
      });
      rzp.open();
    });
  }, [callbacks]);

  // ── Stripe ────────────────────────────────────────────────────────────────
  const initiateStripe = useCallback(async (
    opts: PaymentOptions,
    session: { access_token: string },
    quizId?: string,
  ) => {
    const sessionRes = await fetch('/api/payment/stripe/create-session', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
        ...(opts.type === 'subscription'
          ? { purchaseType: 'subscription', plan: opts.plan }
          : { purchaseType: 'course', courseId: opts.courseId }),
        quizId: quizId ?? '',
      }),
    });
    if (!sessionRes.ok) {
      const body = await sessionRes.json() as { error?: string };
      throw new Error(body.error ?? 'Failed to create Stripe session.');
    }
    const { sessionUrl } = await sessionRes.json() as { sessionUrl: string };
    if (!sessionUrl) throw new Error('No checkout URL returned.');

    // Redirect to Stripe-hosted checkout
    window.location.href = sessionUrl;
    // Don't setLoading(false) — page will navigate away
  }, []);

  // ── Public API ────────────────────────────────────────────────────────────
  const initiatePayment = useCallback(async (
    opts: PaymentOptions,
    gateway: Gateway,
    quizId?: string,
  ) => {
    setError(null);
    setLoading(true);

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) throw new Error('You must be signed in to purchase.');

      if (gateway === 'razorpay') {
        await initiateRazorpay(opts, authSession);
      } else {
        await initiateStripe(opts, authSession, quizId);
        // Stripe redirects away — loading stays true until navigation
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment failed. Please try again.';
      setError(msg);
      callbacks?.onError?.(msg);
      setLoading(false);
    }
  }, [initiateRazorpay, initiateStripe, callbacks]);

  return { initiatePayment, loading, error };
}

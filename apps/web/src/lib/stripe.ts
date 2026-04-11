/**
 * stripe.ts — singleton Stripe server client.
 * Import only inside API routes / server components — never in client code.
 */

import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is required.');
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2026-02-25.clover',
    });
  }

  return stripeClient;
}

/** USD prices in cents — hardcoded server-side, cannot be spoofed by clients. */
export const STRIPE_SUBSCRIPTION_PRICES: Record<'annual' | 'monthly', number> = {
  annual:  999,  // $9.99
  monthly: 199,  // $1.99
};

/** Returns course price in USD cents from app_settings, or null if not set. */
export async function getStripeCoursePrice(
  courseId: string,
  supabaseAdmin: { from: (table: string) => unknown },
): Promise<number | null> {
  const client = supabaseAdmin.from('app_settings') as {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{ data: { value: unknown } | null }>;
      };
    };
  };
  const { data } = await client
    .select('value')
    .eq('key', 'quiz_catalog_overrides')
    .maybeSingle();

  if (!data?.value) return null;
  try {
    const overrides = data.value as Record<string, { price_usd?: number; price?: number }>;
    const priceUsd  = overrides[courseId]?.price_usd ?? overrides[courseId]?.price;
    if (typeof priceUsd === 'number' && priceUsd > 0) return Math.round(priceUsd * 100);
    return null;
  } catch {
    return null;
  }
}

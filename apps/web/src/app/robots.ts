/**
 * /robots.txt — Next.js auto-discovers this file convention.
 * Allow all public content (including /flashcards/*), block auth-gated.
 */
import type { MetadataRoute } from 'next';
import { PUBLIC_BASE_URL } from '@/lib/deckMetadata';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/dashboard/',
          '/api/',
          '/studio/',
          '/update-password',
          '/verify-email',
          '/reset-password/verify',  // OTP-entry page — never indexable
          '/payment-success',
        ],
      },
    ],
    sitemap: `${PUBLIC_BASE_URL}/sitemap.xml`,
    host: PUBLIC_BASE_URL,
  };
}

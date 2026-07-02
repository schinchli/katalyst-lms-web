/**
 * /sitemap.xml — Next.js auto-discovers this file convention.
 * Lists every public route so Google can crawl them.
 *
 * Auth-gated routes (/dashboard/*, /api/*) are intentionally excluded.
 */
import type { MetadataRoute } from 'next';
import { flashcardDecks } from '@/data/flashcards';
import { CERT_GUIDES } from '@/data/certGuides';
import { PUBLIC_BASE_URL } from '@/lib/deckMetadata';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    // ── Core ────────────────────────────────────────────────────────
    { url: `${PUBLIC_BASE_URL}/`,            lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${PUBLIC_BASE_URL}/learn`,       lastModified: now, changeFrequency: 'weekly',  priority: 0.95 },
    { url: `${PUBLIC_BASE_URL}/flashcards`,  lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },

    // ── Per-certification study hubs (indexable, SEO) ───────────────
    ...CERT_GUIDES.map((g) => ({
      url: `${PUBLIC_BASE_URL}/learn/${g.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),

    // ── Per-deck pages (one indexable URL per deck) ─────────────────
    ...flashcardDecks.map((deck) => ({
      url: `${PUBLIC_BASE_URL}/flashcards/${deck.id}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),

    // ── Static / legal ──────────────────────────────────────────────
    { url: `${PUBLIC_BASE_URL}/about`,        lastModified: now, changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${PUBLIC_BASE_URL}/instructions`, lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${PUBLIC_BASE_URL}/privacy`,      lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${PUBLIC_BASE_URL}/terms`,        lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },

    // ── Auth gateways (low priority but indexable) ──────────────────
    { url: `${PUBLIC_BASE_URL}/login`,        lastModified: now, changeFrequency: 'yearly',  priority: 0.1 },
    { url: `${PUBLIC_BASE_URL}/signup`,       lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ];
}

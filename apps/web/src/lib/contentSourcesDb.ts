/**
 * Server-side reader for the seeded `content_sources` table.
 * ────────────────────────────────────────────────────────────────────────────
 * The in-repo registry (lib/sources.ts) defines the STRUCTURE — which sources
 * belong to which module and their topics. This module supplies the LIVE
 * RECORD for each source (title, url, trust_level, verified_at) from Supabase,
 * so the displayed "verified" date and any future edits are data-driven.
 *
 * Reads use the anon key (content_sources has a public-select RLS policy).
 * Results are cached in-process for 5 minutes to avoid per-request round-trips.
 * Any failure falls back silently to the registry (callers handle undefined).
 */
import { createClient } from '@supabase/supabase-js';

export interface DbSource {
  source_key: string;
  title: string;
  source_type: string;
  source_url: string | null;
  trust_level: number;
  verified_at: string | null;
  retrieved_at: string | null;
}

let cache: { at: number; byKey: Map<string, DbSource> } | null = null;
const TTL_MS = 5 * 60_000;

export async function getDbSources(): Promise<Map<string, DbSource>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.byKey;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return new Map();

  try {
    const sb = createClient(url, anon);
    const { data, error } = await sb
      .from('content_sources')
      .select('source_key, title, source_type, source_url, trust_level, verified_at, retrieved_at');
    if (error || !data) return cache?.byKey ?? new Map();
    const byKey = new Map<string, DbSource>(data.map((r) => [r.source_key, r as DbSource]));
    cache = { at: Date.now(), byKey };
    return byKey;
  } catch {
    return cache?.byKey ?? new Map();
  }
}

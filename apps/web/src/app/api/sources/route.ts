/**
 * GET /api/sources
 * ─────────────────
 * Resolve trusted content sources. The in-repo registry (lib/sources.ts)
 * provides the structural map (which sources belong to a module, topics);
 * the seeded `content_sources` table provides the LIVE record per source
 * (title, url, trust, verified_at). Registry is the fallback if the DB row
 * is missing or the DB is unreachable.
 *
 *   ?module=arch-m04   → ordered official AWS references for a lesson
 *   ?q=vpc+peering     → best-trust source for a free-text service/topic query
 *   ?key=doc-vpc       → a single source by key
 *
 * Public, rate-limited, read-only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimiter';
import {
  getModuleSources, resolveSource, resolveBestSource,
  ALL_SOURCE_KEYS, type TrustedSource,
} from '@/lib/sources';
import { getDbSources, type DbSource } from '@/lib/contentSourcesDb';

export const runtime = 'nodejs';

interface HydratedSource extends TrustedSource {
  verifiedAt?: string | null;
  backedBy: 'db' | 'registry';
}

function hydrate(s: TrustedSource, db: Map<string, DbSource>): HydratedSource {
  const row = db.get(s.key);
  if (!row) return { ...s, backedBy: 'registry' };
  return {
    ...s,
    title: row.title ?? s.title,
    url: row.source_url ?? s.url,
    trustLevel: row.trust_level ?? s.trustLevel,
    sourceType: (row.source_type as TrustedSource['sourceType']) ?? s.sourceType,
    verifiedAt: row.verified_at,
    backedBy: 'db',
  };
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`sources:${ip}`, 60, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  const sp = req.nextUrl.searchParams;
  const moduleId = sp.get('module');
  const key = sp.get('key');
  const q = sp.get('q');
  const db = await getDbSources();

  if (moduleId) {
    const sources = getModuleSources(moduleId).map((s) => hydrate(s, db));
    return NextResponse.json({ ok: true, module: moduleId, sources, backed: db.size > 0 ? 'content_sources' : 'registry' });
  }
  if (key) {
    const s = resolveSource(key);
    return s
      ? NextResponse.json({ ok: true, source: hydrate(s, db) })
      : NextResponse.json({ ok: false, error: 'Unknown source key', validKeys: ALL_SOURCE_KEYS }, { status: 404 });
  }
  if (q) {
    const s = await resolveBestSource(q.slice(0, 200));
    return NextResponse.json({ ok: true, query: q, source: s ? hydrate(s, db) : null });
  }

  return NextResponse.json({ ok: true, keys: ALL_SOURCE_KEYS, dbRows: db.size });
}

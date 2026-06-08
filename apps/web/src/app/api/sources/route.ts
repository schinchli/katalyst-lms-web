/**
 * GET /api/sources
 * ─────────────────
 * Resolve trusted content sources. Backed by the curated in-repo registry
 * (lib/sources.ts) and the resolution abstraction (MCP → ingested → curated).
 *
 *   ?module=arch-m04   → ordered official AWS references curated for a lesson
 *   ?q=vpc+peering     → best-trust source for a free-text service/topic query
 *   ?key=doc-vpc       → a single source by key
 *
 * Public, rate-limited, read-only. No database required.
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimiter';
import {
  getModuleSources,
  resolveSource,
  resolveBestSource,
  ALL_SOURCE_KEYS,
} from '@/lib/sources';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`sources:${ip}`, 60, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  const sp = req.nextUrl.searchParams;
  const moduleId = sp.get('module');
  const key = sp.get('key');
  const q = sp.get('q');

  if (moduleId) {
    return NextResponse.json({ ok: true, module: moduleId, sources: getModuleSources(moduleId) });
  }
  if (key) {
    const s = resolveSource(key);
    return s
      ? NextResponse.json({ ok: true, source: s })
      : NextResponse.json({ ok: false, error: 'Unknown source key', validKeys: ALL_SOURCE_KEYS }, { status: 404 });
  }
  if (q) {
    const s = await resolveBestSource(q.slice(0, 200));
    return NextResponse.json({ ok: true, query: q, source: s });
  }

  return NextResponse.json({ ok: true, keys: ALL_SOURCE_KEYS });
}

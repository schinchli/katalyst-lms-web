/**
 * GET /api/cloud-news
 *
 * Ingests Google News RSS feeds for cloud providers, normalizes the items,
 * and returns the latest deduplicated cloud headlines for the mobile home feed.
 *
 * Public endpoint — no auth required.
 * Cache: 15 min CDN + 30 min stale-while-revalidate.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit }            from '@/lib/rateLimiter';
import { logger }                    from '@/lib/logger';

export const dynamic = 'force-dynamic';

const ROUTE = '/api/cloud-news';

type CloudProvider = 'AWS' | 'Azure' | 'GCP' | 'Oracle' | 'Cloud';

interface FeedConfig {
  provider: CloudProvider;
  query: string;
}

interface CloudNewsItem {
  id: string;
  title: string;
  url: string;
  excerpt: string | null;
  imageUrl: string;
  source: string;
  provider: CloudProvider;
  publishedAt: string | null;
  readTime: string;
}

const FEEDS: FeedConfig[] = [
  { provider: 'AWS',    query: 'Amazon Web Services cloud latest news' },
  { provider: 'Azure',  query: 'Microsoft Azure cloud latest news' },
  { provider: 'GCP',    query: 'Google Cloud latest news' },
  { provider: 'Oracle', query: 'Oracle Cloud latest news' },
  { provider: 'Cloud',  query: 'cloud computing latest news enterprise' },
];

const PROVIDER_PRIORITY: Record<CloudProvider, number> = {
  AWS: 0,
  Azure: 1,
  GCP: 2,
  Oracle: 3,
  Cloud: 4,
};

const PROVIDER_IMAGES: Record<CloudProvider, string> = {
  AWS: 'https://www.google.com/s2/favicons?domain=aws.amazon.com&sz=128',
  Azure: 'https://www.google.com/s2/favicons?domain=azure.microsoft.com&sz=128',
  GCP: 'https://www.google.com/s2/favicons?domain=cloud.google.com&sz=128',
  Oracle: 'https://www.google.com/s2/favicons?domain=oracle.com&sz=128',
  Cloud: 'https://www.google.com/s2/favicons?domain=cloud.google.com&sz=128',
};

function feedUrl(query: string) {
  const params = new URLSearchParams({
    q: query,
    hl: 'en-US',
    gl: 'US',
    ceid: 'US:en',
  });
  return `https://news.google.com/rss/search?${params.toString()}`;
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function stripHtml(value: string) {
  return decodeXml(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tagValue(itemXml: string, tag: string) {
  const match = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeXml(match[1]) : '';
}

function sourceValue(itemXml: string) {
  const match = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
  return match ? stripHtml(match[1]) : 'Google News';
}

function normalizeId(title: string, url: string) {
  const raw = `${title}-${url}`;
  return raw
    .toLowerCase()
    .replace(/https?:\/\//g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

function normalizeTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/\s+-\s+[^-]+$/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function parseFeed(xml: string, provider: CloudProvider): CloudNewsItem[] {
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];

  return itemMatches.map((itemXml) => {
    const title = stripHtml(tagValue(itemXml, 'title'));
    const url = tagValue(itemXml, 'link');
    const description = stripHtml(tagValue(itemXml, 'description'));
    const publishedRaw = tagValue(itemXml, 'pubDate');
    const publishedAt = publishedRaw ? new Date(publishedRaw).toISOString() : null;
    const source = sourceValue(itemXml);
    const shortExcerpt = description && normalizeTitle(description) !== normalizeTitle(title)
      ? description
      : `Latest ${provider} cloud coverage from ${source}.`;

    return {
      id: normalizeId(title, url),
      title,
      url,
      excerpt: shortExcerpt,
      imageUrl: PROVIDER_IMAGES[provider],
      source,
      provider,
      publishedAt,
      readTime: 'News',
    };
  }).filter((item) => item.title && item.url);
}

async function fetchProviderFeed(feed: FeedConfig): Promise<CloudNewsItem[]> {
  const res = await fetch(feedUrl(feed.query), {
    headers: {
      Accept: 'application/rss+xml, application/xml, text/xml',
      'User-Agent': 'LearnKloud.Today cloud-news-ingestor/1.0',
    },
    signal: AbortSignal.timeout(8_000),
    next: { revalidate: 900 },
  });

  if (!res.ok) throw new Error(`Google News RSS ${feed.provider} failed: ${res.status}`);
  return parseFeed(await res.text(), feed.provider);
}

function dedupeAndRank(items: CloudNewsItem[], limit: number) {
  const seen = new Set<string>();
  const deduped: CloudNewsItem[] = [];

  for (const item of items) {
    const key = normalizeTitle(item.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  const byProvider = [...deduped].sort((a, b) => {
    const providerDelta = PROVIDER_PRIORITY[a.provider] - PROVIDER_PRIORITY[b.provider];
    if (providerDelta !== 0) return providerDelta;
    return Date.parse(b.publishedAt ?? '') - Date.parse(a.publishedAt ?? '');
  });
  const selected: CloudNewsItem[] = [];

  for (const provider of FEEDS.map((feed) => feed.provider)) {
    const item = byProvider.find((candidate) => candidate.provider === provider);
    if (item) selected.push(item);
    if (selected.length >= limit) return selected;
  }

  const selectedIds = new Set(selected.map((item) => item.id));
  const remaining = deduped
    .filter((item) => !selectedIds.has(item.id))
    .sort((a, b) => Date.parse(b.publishedAt ?? '') - Date.parse(a.publishedAt ?? ''));

  return [...selected, ...remaining].slice(0, limit);
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!(await checkRateLimit(`cloud-news:${ip}`, 60, 60_000))) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json({ ok: false, error: 'Too many requests' }, {
      status: 429, headers: { 'Retry-After': '60' },
    });
  }

  const limit = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get('limit') ?? '5', 10) || 5, 1), 20);

  try {
    const settled = await Promise.allSettled(FEEDS.map(fetchProviderFeed));
    const items = settled.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
    const news = dedupeAndRank(items, limit);

    return NextResponse.json({
      ok: true,
      source: 'google-news-rss',
      feeds: FEEDS.map((feed) => feed.provider),
      news,
    }, {
      headers: { 'Cache-Control': 's-maxage=900, stale-while-revalidate=1800' },
    });
  } catch (err) {
    logger.error(ROUTE, 'Failed to ingest cloud news', { error: String(err), ip });
    return NextResponse.json({ ok: true, source: 'google-news-rss', feeds: [], news: [] }, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    });
  }
}

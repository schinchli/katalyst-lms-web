import { createClient } from 'next-sanity';
import imageUrlBuilder from '@sanity/image-url';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SanityImageSource = any;

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '';
export const dataset   = process.env.NEXT_PUBLIC_SANITY_DATASET   ?? 'production';
const apiVersion       = '2024-01-01';

// Public read client (used in API routes and server components).
// Returns a no-op client when projectId is not configured (local dev / build time).
export const sanityClient = projectId
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: true,
      token: process.env.SANITY_API_READ_TOKEN,
    })
  : createClient({ projectId: 'placeholder', dataset, apiVersion, useCdn: false });

// Image URL builder
const builder = imageUrlBuilder({ projectId, dataset });
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type ArticleProvider = 'AWS' | 'GCP' | 'Azure' | 'Oracle' | 'Databricks' | 'Snowflake' | 'General';
export type ArticleCategory = 'Cloud' | 'Data' | 'AI' | 'Security' | 'DevOps' | 'General';

export type ArticleListItem = {
  _id:          string;
  title:        string;
  slug:         string;
  tag:          string | null;
  excerpt:      string | null;
  author:       string | null;
  publishedAt:  string | null;
  readTime:     string | null;
  accessTier:   'free' | 'premium';
  featured:     boolean;
  provider:     ArticleProvider;
  category:     ArticleCategory;
  organisation: string;
  relatedQuizId: string | null;
  coverImage:   SanityImageSource | null;
};

export type ArticleFull = ArticleListItem & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any[];  // Portable Text blocks
};

// ── GROQ Queries ──────────────────────────────────────────────────────────────

const ARTICLE_LIST_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  tag,
  excerpt,
  author,
  publishedAt,
  readTime,
  accessTier,
  featured,
  "provider": coalesce(provider, "General"),
  "category": coalesce(category, "General"),
  "organisation": coalesce(organisation, "LearnKloud Team"),
  relatedQuizId,
  coverImage
`;

export interface ArticleListParams {
  providers?: ArticleProvider[];
  categories?: ArticleCategory[];
  sort?: 'date' | 'organisation';
  limit?: number;
}

/** Fetch articles with optional provider/category filters and sort. */
export async function fetchArticleList(params: ArticleListParams = {}): Promise<ArticleListItem[]> {
  if (!projectId) return [];
  const { providers, categories, sort = 'date', limit = 100 } = params;

  const filters = [`_type == "article"`, `defined(slug.current)`];
  if (providers?.length) filters.push(`provider in ${JSON.stringify(providers)}`);
  if (categories?.length) filters.push(`category in ${JSON.stringify(categories)}`);

  const orderClause = sort === 'organisation'
    ? `organisation asc, publishedAt desc`
    : `featured desc, publishedAt desc`;

  const query = `*[${filters.join(' && ')}] | order(${orderClause}) [0...${limit}] { ${ARTICLE_LIST_FIELDS} }`;
  return sanityClient.fetch<ArticleListItem[]>(query);
}

/** Fetch a single article with full Portable Text body. */
export async function fetchArticleFull(slug: string): Promise<ArticleFull | null> {
  if (!projectId) return null;
  return sanityClient.fetch<ArticleFull | null>(
    `*[_type == "article" && slug.current == $slug][0] { ${ARTICLE_LIST_FIELDS}, body }`,
    { slug },
  );
}

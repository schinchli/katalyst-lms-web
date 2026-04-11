import { createClient } from 'next-sanity';
import imageUrlBuilder from '@sanity/image-url';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SanityImageSource = any;

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '';
export const dataset   = process.env.NEXT_PUBLIC_SANITY_DATASET   ?? 'production';
const apiVersion       = '2024-01-01';

// Public read client (used in API routes and server components)
export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  // Use SANITY_API_READ_TOKEN for private datasets; omit for public
  token: process.env.SANITY_API_READ_TOKEN,
});

// Image URL builder
const builder = imageUrlBuilder({ projectId, dataset });
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

// ── Types ─────────────────────────────────────────────────────────────────────

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
  relatedQuizId,
  coverImage
`;

/** Fetch all published articles (metadata only — no body). */
export async function fetchArticleList(): Promise<ArticleListItem[]> {
  if (!projectId) return [];
  return sanityClient.fetch<ArticleListItem[]>(
    `*[_type == "article" && defined(slug.current)] | order(featured desc, publishedAt desc) { ${ARTICLE_LIST_FIELDS} }`,
  );
}

/** Fetch a single article with full Portable Text body. */
export async function fetchArticleFull(slug: string): Promise<ArticleFull | null> {
  if (!projectId) return null;
  return sanityClient.fetch<ArticleFull | null>(
    `*[_type == "article" && slug.current == $slug][0] { ${ARTICLE_LIST_FIELDS}, body }`,
    { slug },
  );
}

/**
 * rag.ts — Generic server-side helpers for cross-corpus RAG on knowledge_chunks.
 *
 * Embedding:  OpenAI text-embedding-3-small (1536 dims)
 * Retrieval:  Supabase RPC `kb_search` (pgvector cosine similarity, corpus-filterable)
 * Generation: OpenAI gpt-4o-mini by default — set EKS_RAG_GEN_MODEL to override.
 *
 * knowledge_chunks has anon SELECT (public study content), so we use the anon key.
 * No service-role key crosses any client boundary.
 */
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const OPENAI_KEY    = process.env.OPENAI_API_KEY?.trim();

export const EMBED_MODEL = 'text-embedding-3-small';
export const GEN_MODEL   = process.env.EKS_RAG_GEN_MODEL?.trim() || 'gpt-4o-mini';

let _openai: OpenAI | null = null;
function openai(): OpenAI {
  if (!OPENAI_KEY) throw new Error('OPENAI_API_KEY not configured');
  if (!_openai) _openai = new OpenAI({ apiKey: OPENAI_KEY });
  return _openai;
}

export function kbSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON) throw new Error('Supabase env vars not configured');
  return createClient(SUPABASE_URL, SUPABASE_ANON);
}

export interface KbHit {
  id:          string;
  corpus:      string;
  source_type: string;
  title:       string | null;
  content:     string;
  metadata:    Record<string, unknown>;
  similarity:  number;
}

export async function embedQuery(query: string): Promise<number[]> {
  const res = await openai().embeddings.create({
    model: EMBED_MODEL,
    input: query.slice(0, 8000),
  });
  return res.data[0].embedding;
}

export interface SearchOpts {
  matchCount?:     number;
  filterCorpus?:   string[] | null;             // null = all corpora
  filterSource?:   string | null;
  filterMetadata?: Record<string, unknown> | null;
}

export async function semanticSearch(
  embedding: number[],
  {
    matchCount = 8,
    filterCorpus = null,
    filterSource = null,
    filterMetadata = null,
  }: SearchOpts = {},
): Promise<KbHit[]> {
  const sb = kbSupabase();
  const { data, error } = await sb.rpc('kb_search', {
    query_embedding: embedding,
    filter_corpus:   filterCorpus,
    filter_source:   filterSource,
    filter_metadata: filterMetadata,
    match_count:     Math.min(matchCount, 20),
  });
  if (error) throw new Error(`kb_search rpc failed: ${error.message}`);
  return (data ?? []) as KbHit[];
}

const SYSTEM_PROMPT = `You are an expert instructor for LearnKloud — an AWS Cloud and GenAI certification prep platform.
Answer the student's question using ONLY the numbered course excerpts provided.

Rules:
- Be concise, precise, technically accurate.
- Use bullet points or numbered lists when listing multiple items.
- Cite sources by number, e.g. [1] or [2,3], when you use them.
- If the answer is not in the provided excerpts, say: "This isn't covered in the provided content."
- Never invent AWS service names, pricing, or behaviour.`;

export interface GenerateOpts {
  question: string;
  chunks:   KbHit[];
  maxTokens?: number;
}

export interface GenerationResult {
  answer:        string;
  model:         string;
  inputTokens:   number;
  outputTokens:  number;
}

export async function generateAnswer({
  question, chunks, maxTokens = 1024,
}: GenerateOpts): Promise<GenerationResult> {
  const context = chunks
    .map((c, i) => {
      const meta = c.metadata as Record<string, unknown>;
      const where = [c.corpus, meta?.module ? `M${meta.module}` : null, c.source_type, meta?.topic]
        .filter(Boolean).join(' · ');
      return `[${i + 1}] ${where}\n${c.content}`;
    })
    .join('\n\n---\n\n');

  const res = await openai().chat.completions.create({
    model: GEN_MODEL,
    max_tokens: maxTokens,
    temperature: 0.2,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: `Course excerpts:\n\n${context}\n\n---\n\nStudent question: ${question}` },
    ],
  });

  return {
    answer:       res.choices[0]?.message?.content ?? '',
    model:        res.model,
    inputTokens:  res.usage?.prompt_tokens     ?? 0,
    outputTokens: res.usage?.completion_tokens ?? 0,
  };
}

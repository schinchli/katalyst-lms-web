-- Migration 014: Generic knowledge_chunks table for cross-corpus RAG
-- Replaces the course-specific eks_knowledge table (migration 001 in learnk8s)
-- with a single multi-corpus table. The eks_knowledge table is preserved
-- read-only during a transition window; new ingestion writes here.

create extension if not exists vector;

create table if not exists public.knowledge_chunks (
  id           uuid    default gen_random_uuid() primary key,
  corpus       text    not null,                    -- 'eks-coreks' | 'clf-c02' | 'aip-c01' | 'flashcards' | 'eks-coreks-flashcards' | 'articles' | …
  source_type  text    not null,                    -- 'slide' | 'flashcard' | 'quiz_question' | 'notes' | 'article' | …
  content_hash text    not null,                    -- sha256(content) — idempotency key per (corpus, content_hash)
  title        text,
  content      text    not null,
  embedding    vector(1536),                        -- text-embedding-3-small dims
  metadata     jsonb   default '{}'::jsonb,         -- corpus-specific: module, topic, question_id, deck_id, exam_code, difficulty, …
  created_at   timestamptz default now()
);

create unique index if not exists knowledge_chunks_corpus_hash_uniq
  on public.knowledge_chunks (corpus, content_hash);

create index if not exists knowledge_chunks_embedding_idx
  on public.knowledge_chunks using hnsw (embedding vector_cosine_ops);

create index if not exists knowledge_chunks_corpus_idx
  on public.knowledge_chunks (corpus);

create index if not exists knowledge_chunks_corpus_source_idx
  on public.knowledge_chunks (corpus, source_type);

-- ── Generic similarity search ────────────────────────────────────────────
-- Filter by corpus (single or array), optional source_type, optional
-- metadata-key match. Returns ranked rows above min_similarity threshold.
create or replace function public.kb_search(
  query_embedding  vector(1536),
  filter_corpus    text[]  default null,            -- null = all corpora
  filter_source    text    default null,
  filter_metadata  jsonb   default null,            -- e.g. '{"module":"03"}'::jsonb
  match_count      int     default 8,
  min_similarity   float   default 0.30
)
returns table (
  id           uuid,
  corpus       text,
  source_type  text,
  title        text,
  content      text,
  metadata     jsonb,
  similarity   float
)
language plpgsql
as $$
begin
  return query
  select
    kc.id,
    kc.corpus,
    kc.source_type,
    kc.title,
    kc.content,
    kc.metadata,
    1 - (kc.embedding <=> query_embedding) as similarity
  from public.knowledge_chunks kc
  where
    (filter_corpus is null   or kc.corpus = any(filter_corpus))
    and (filter_source is null   or kc.source_type = filter_source)
    and (filter_metadata is null or kc.metadata @> filter_metadata)
    and (1 - (kc.embedding <=> query_embedding)) >= min_similarity
  order by kc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table public.knowledge_chunks enable row level security;

-- Public read: knowledge chunks are study content, not sensitive
drop policy if exists "Public read knowledge_chunks" on public.knowledge_chunks;
create policy "Public read knowledge_chunks"
  on public.knowledge_chunks
  for select to anon, authenticated
  using (true);

-- Service role full access for ingestion
drop policy if exists "Service role full access knowledge_chunks" on public.knowledge_chunks;
create policy "Service role full access knowledge_chunks"
  on public.knowledge_chunks
  for all to service_role
  using (true)
  with check (true);

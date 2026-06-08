-- Migration 017: Trusted content sources, diagrams, recommendations, topic graph
-- Backs the "source abstraction" layer: every generated/curated content block
-- can point at a traceable source (AWS docs, blog, ingested material, MCP).
-- A live AWS Documentation MCP can be swapped in later — the schema is source-
-- type agnostic (source_type column).

-- ── content_sources ─────────────────────────────────────────────────────────
-- One row per trusted source reference. Cached so we never re-fetch the same
-- URL repeatedly. trust_level orders preference: official AWS docs > blog > web.
create table if not exists public.content_sources (
  id                    uuid    default gen_random_uuid() primary key,
  source_key            text    not null,                 -- stable lookup key, e.g. 'aws-well-architected'
  title                 text    not null,
  source_type           text    not null,                 -- 'aws_docs' | 'aws_blog' | 'mcp' | 'ingested' | 'manual'
  source_url            text,
  trust_level           int     not null default 50,      -- 100 official docs, 80 blog, 60 ingested, 40 web, 20 manual
  retrieved_at          timestamptz,                      -- when content was last fetched
  verified_at           timestamptz default now(),        -- when a human/automation last verified it
  raw_content_reference text,                             -- pointer to cached body (knowledge_chunks id, URL, etc.)
  metadata              jsonb   default '{}'::jsonb,       -- service, topic, module ids, etc.
  created_at            timestamptz default now()
);

create unique index if not exists content_sources_key_uniq on public.content_sources (source_key);
create index if not exists content_sources_type_idx       on public.content_sources (source_type);

alter table public.content_sources enable row level security;
-- Public read (study content is not sensitive); writes only via service role.
drop policy if exists content_sources_read on public.content_sources;
create policy content_sources_read on public.content_sources for select using (true);

-- ── lms_diagrams ────────────────────────────────────────────────────────────
-- Architecture/flow/security diagrams attached to a lesson, each pointing at a
-- content_source so its provenance is traceable.
create table if not exists public.lms_diagrams (
  id                uuid    default gen_random_uuid() primary key,
  title             text    not null,
  image_url         text    not null,
  alt_text          text,
  caption           text,
  explanation       text,
  source_id         uuid    references public.content_sources(id) on delete set null,
  related_lesson_id text,                                  -- moduleId, e.g. 'arch-m04'
  tags              text[]  default '{}',
  created_at        timestamptz default now()
);

create index if not exists lms_diagrams_lesson_idx on public.lms_diagrams (related_lesson_id);

alter table public.lms_diagrams enable row level security;
drop policy if exists lms_diagrams_read on public.lms_diagrams;
create policy lms_diagrams_read on public.lms_diagrams for select using (true);

-- ── lms_recommendations ─────────────────────────────────────────────────────
-- Per-user recommendation rows. Users may read only their own.
create table if not exists public.lms_recommendations (
  id               uuid    default gen_random_uuid() primary key,
  user_id          uuid    not null references auth.users(id) on delete cascade,
  item_type        text    not null,                      -- 'lesson' | 'flashcard' | 'quiz' | 'diagram' | 'aws_reading' | 'lab'
  item_id          text    not null,
  title            text    not null,
  reason           text,
  score            float   not null default 0,
  difficulty       text,                                  -- 'beginner' | 'intermediate' | 'architect'
  estimated_time   int,                                   -- minutes
  source_reference text,                                  -- content_source.source_key or url
  category         text,                                  -- 'continue' | 'study_next' | 'review' | ...
  created_at       timestamptz default now()
);

create index if not exists lms_recommendations_user_idx on public.lms_recommendations (user_id, created_at desc);

alter table public.lms_recommendations enable row level security;
drop policy if exists lms_recommendations_owner_read on public.lms_recommendations;
create policy lms_recommendations_owner_read on public.lms_recommendations
  for select using (auth.uid() = user_id);

-- ── lms_topic_graph ─────────────────────────────────────────────────────────
-- Knowledge graph: prerequisite/related/next edges per topic, with AWS service,
-- certification, and Well-Architected pillar mappings. Powers recommendation
-- ordering and the "Before You Continue / Study Next" UI sections.
create table if not exists public.lms_topic_graph (
  id                        uuid    default gen_random_uuid() primary key,
  topic                     text    not null,             -- moduleId or concept id
  title                     text,
  prerequisites             text[]  default '{}',
  related_topics            text[]  default '{}',
  next_topics               text[]  default '{}',
  aws_services              text[]  default '{}',
  certification_mapping     text[]  default '{}',          -- e.g. {'SAA-C03'}
  well_architected_pillars  text[]  default '{}',          -- e.g. {'Security','Reliability'}
  metadata                  jsonb   default '{}'::jsonb,
  created_at                timestamptz default now()
);

create unique index if not exists lms_topic_graph_topic_uniq on public.lms_topic_graph (topic);

alter table public.lms_topic_graph enable row level security;
drop policy if exists lms_topic_graph_read on public.lms_topic_graph;
create policy lms_topic_graph_read on public.lms_topic_graph for select using (true);

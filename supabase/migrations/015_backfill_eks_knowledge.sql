-- Migration 015: One-time backfill from eks_knowledge → knowledge_chunks
-- Idempotent: skips if the source table is gone, and the destination has a
-- unique (corpus, content_hash) constraint so re-running is a no-op.

-- Note: Supabase installs pgcrypto into the `extensions` schema, not `public`,
-- so qualifying `extensions.digest(...)` is safer than relying on search_path.
-- Postgres 14+ also ships a built-in sha256(bytea) in pg_catalog which we use below.

do $$
declare
  inserted_count int;
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'eks_knowledge'
  ) then
    raise notice 'eks_knowledge table does not exist — skipping backfill';
    return;
  end if;

  insert into public.knowledge_chunks
    (corpus, source_type, content_hash, title, content, embedding, metadata, created_at)
  select
    'eks-coreks'                                              as corpus,
    ek.source_type,
    encode(sha256(convert_to(ek.content, 'UTF8')), 'hex')     as content_hash,
    ek.title,
    ek.content,
    ek.embedding,
    jsonb_build_object(
      'module',        ek.module,
      'module_title',  ek.module_title,
      'topic',         ek.topic
    ) || coalesce(ek.metadata, '{}'::jsonb)                   as metadata,
    ek.created_at
  from public.eks_knowledge ek
  on conflict (corpus, content_hash) do nothing;

  get diagnostics inserted_count = row_count;
  raise notice 'backfilled % rows from eks_knowledge into knowledge_chunks (corpus=eks-coreks)', inserted_count;
end $$;

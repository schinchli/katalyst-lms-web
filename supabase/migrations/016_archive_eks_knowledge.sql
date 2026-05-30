-- Migration 016: Archive (rename) the legacy eks_knowledge table
-- All 1021 rows were backfilled into knowledge_chunks (corpus='eks-coreks')
-- in migration 015. Nothing in the LMS or learnk8s repos still references
-- eks_knowledge — confirmed by grep before this migration was written:
--   `grep -rE "eks_knowledge" apps/ learnk8s/scripts/` returns no hits
--
-- Rename rather than drop so the original embeddings are recoverable for
-- 90 days. Drop the archived table in a later migration if no recovery is
-- needed.

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'eks_knowledge'
  )
  and not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'eks_knowledge_archived_2026_05'
  )
  then
    -- Drop the eks_search RPC first (it depended on this table)
    drop function if exists public.eks_search(vector(1536), int, text, text, float);

    -- Rename the table and its indexes / policies move with it automatically
    alter table public.eks_knowledge rename to eks_knowledge_archived_2026_05;
    raise notice 'archived eks_knowledge → eks_knowledge_archived_2026_05';
  else
    raise notice 'archive skipped — either eks_knowledge is gone or already archived';
  end if;
end $$;

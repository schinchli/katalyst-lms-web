-- Migration 013: Enable RLS on att_backups
-- att_backups stores full database backup dumps (sensitive). No user-facing
-- access is needed — all reads/writes go through server-side API routes using
-- the service_role key which bypasses RLS. Enabling RLS with no policies
-- blocks anon and authenticated clients entirely.

ALTER TABLE public.att_backups ENABLE ROW LEVEL SECURITY;

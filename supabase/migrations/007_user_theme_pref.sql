-- Per-user theme preference (keeps app + web consistent)
alter table public.user_profiles
  add column if not exists theme_pref jsonb;

-- RLS already enforced on user_profiles; existing policy covers update/select.

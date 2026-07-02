-- 018_user_learning_pref.sql
-- Sync the learner's active path + completed steps across web + app.
-- Shape: learning_pref = { "activePathId": string|null, "completedStepIds": string[] }
-- RLS: the existing "own user_profiles" policy (auth.uid() = id) already covers
-- select/update, so no new policy is required.
alter table public.user_profiles
  add column if not exists learning_pref jsonb;

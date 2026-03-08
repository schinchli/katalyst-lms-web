/**
 * /api/setup-db
 * ─────────────
 * One-shot database migration endpoint using the Supabase Management API.
 * Requires SUPABASE_ACCESS_TOKEN (personal access token) in .env.local
 *
 * Get your PAT: https://supabase.com/dashboard/account/tokens
 * Add to .env.local:  SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxx
 *
 * Run once (from a new terminal while `npm run dev` is running):
 *   curl -X POST http://localhost:8080/api/setup-db \
 *     -H "x-setup-token: katalyst-setup-2026"
 */

import { NextRequest, NextResponse } from 'next/server';

// Token MUST be set in .env.local as SETUP_TOKEN — never hardcode here.
// Generate a strong random value: openssl rand -hex 32
const SETUP_TOKEN  = process.env.SETUP_TOKEN;
const PROJECT_REF  = process.env.SUPABASE_PROJECT_REF ?? 'swydybtzyjxftzfzqqnv';
const MGMT_API_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

// Full schema — idempotent (uses IF NOT EXISTS, DROP POLICY IF EXISTS)
const MIGRATION_SQL = `
-- ── 1. User Profiles (extends auth.users) ─────────────────────────────────
create table if not exists public.user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  role        text default 'Student',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── 2. Quiz Results (one row per user+quiz — upsert on retake) ─────────────
create table if not exists public.quiz_results (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  quiz_id         text not null,
  score           integer not null,
  total_questions integer not null,
  time_taken      integer not null default 0,
  answers         jsonb not null default '{}',
  completed_at    timestamptz not null,
  created_at      timestamptz default now(),
  unique(user_id, quiz_id)
);

-- ── 3. Subscriptions ───────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null unique,
  tier        text not null default 'free',
  plan        text,
  started_at  timestamptz,
  updated_at  timestamptz default now()
);

-- ── 4. Unlocked Courses (individual purchases) ────────────────────────────
create table if not exists public.unlocked_courses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  course_id   text not null,
  unlocked_at timestamptz default now(),
  unique(user_id, course_id)
);

-- ── 5. Purchases (audit log) ──────────────────────────────────────────────
create table if not exists public.purchases (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  purchase_type text not null,
  course_id     text,
  course_name   text,
  plan          text,
  amount        integer not null,
  purchased_at  timestamptz not null,
  created_at    timestamptz default now()
);

-- ── 6. Profiles (mobile app reads subscription + unlocked_courses here) ───
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  name             text,
  subscription     text not null default 'free',
  unlocked_courses text[] not null default '{}',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ── Patch existing profiles table (add columns if missing) ───────────────
alter table public.profiles add column if not exists updated_at  timestamptz default now();
alter table public.profiles add column if not exists name        text;
alter table public.profiles add column if not exists subscription text not null default 'free';
alter table public.profiles add column if not exists unlocked_courses text[] not null default '{}';

-- ── Row Level Security ────────────────────────────────────────────────────
alter table public.user_profiles   enable row level security;
alter table public.quiz_results    enable row level security;
alter table public.subscriptions   enable row level security;
alter table public.unlocked_courses enable row level security;
alter table public.purchases       enable row level security;
alter table public.profiles        enable row level security;

drop policy if exists "own user_profiles"    on public.user_profiles;
drop policy if exists "own quiz_results"     on public.quiz_results;
drop policy if exists "own subscriptions"    on public.subscriptions;
drop policy if exists "own unlocked_courses" on public.unlocked_courses;
drop policy if exists "own purchases"        on public.purchases;
drop policy if exists "own profiles"         on public.profiles;

create policy "own user_profiles"    on public.user_profiles    for all using (auth.uid() = id)         with check (auth.uid() = id);
create policy "own quiz_results"     on public.quiz_results     for all using (auth.uid() = user_id)    with check (auth.uid() = user_id);
create policy "own subscriptions"    on public.subscriptions    for all using (auth.uid() = user_id)    with check (auth.uid() = user_id);
create policy "own unlocked_courses" on public.unlocked_courses for all using (auth.uid() = user_id)    with check (auth.uid() = user_id);
create policy "own purchases"        on public.purchases        for all using (auth.uid() = user_id)    with check (auth.uid() = user_id);
create policy "own profiles"         on public.profiles         for all using (auth.uid() = id)         with check (auth.uid() = id);

-- ── RPC: append_unlocked_course (mobile authStore uses this) ─────────────
create or replace function public.append_unlocked_course(user_id uuid, course_id text)
returns void language sql security definer as $$
  update public.profiles
  set unlocked_courses = array_append(unlocked_courses, course_id), updated_at = now()
  where id = user_id and not (course_id = any(unlocked_courses));

  insert into public.unlocked_courses (user_id, course_id, unlocked_at)
  values (user_id, course_id, now())
  on conflict (user_id, course_id) do nothing;
$$;

-- ── Trigger: keep profiles.subscription in sync ──────────────────────────
create or replace function public.sync_subscription_to_profiles()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, subscription, updated_at)
  values (new.user_id, new.tier, now())
  on conflict (id) do update set subscription = excluded.subscription, updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_subscription_change on public.subscriptions;
create trigger on_subscription_change
  after insert or update on public.subscriptions
  for each row execute function public.sync_subscription_to_profiles();

-- ── Trigger: auto-create profile rows on new Supabase user ───────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name')
  on conflict (id) do nothing;

  insert into public.user_profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
`;

export async function POST(req: NextRequest) {
  if (!SETUP_TOKEN || req.headers.get('x-setup-token') !== SETUP_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pat = process.env.SUPABASE_ACCESS_TOKEN;
  if (!pat) {
    return NextResponse.json(
      {
        error: 'SUPABASE_ACCESS_TOKEN not set.',
        instructions: [
          '1. Go to https://supabase.com/dashboard/account/tokens',
          '2. Click "Generate new token" → name it "katalyst-setup"',
          '3. Add to apps/web/.env.local:  SUPABASE_ACCESS_TOKEN=sbp_xxxx',
          '4. Restart dev server, then re-run this curl command',
        ],
      },
      { status: 500 },
    );
  }

  const res = await fetch(MGMT_API_URL, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${pat}`,
    },
    body: JSON.stringify({ query: MIGRATION_SQL }),
  });

  if (!res.ok) {
    const body = await res.text();
    return NextResponse.json({ error: `Supabase API error: ${body}` }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'Schema created.',
    tables: ['user_profiles', 'quiz_results', 'subscriptions', 'unlocked_courses', 'purchases', 'profiles'],
    rpc:     ['append_unlocked_course'],
    triggers: ['on_auth_user_created', 'on_subscription_change'],
  });
}

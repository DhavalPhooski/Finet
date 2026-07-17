-- ============================================================
-- 001_profiles.sql
-- Profiles table + auto-creation trigger on auth.users insert
-- ============================================================

-- ── Table ────────────────────────────────────────────────────

create table if not exists public.profiles (
  id          uuid        primary key references auth.users (id) on delete cascade,
  full_name   text,
  email       text        not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'One row per authenticated user. Mirrors auth.users with extra display fields.';

-- ── Updated-at trigger ────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ── Auto-create profile on signup ────────────────────────────
-- Fires after a new row is inserted into auth.users.
-- Reads full_name from the raw_user_meta_data JSON supplied
-- at sign-up (authService.ts passes it via options.data).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Drop and recreate so re-running is idempotent
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ── Row Level Security ────────────────────────────────────────

alter table public.profiles enable row level security;

-- Users can read only their own profile
create policy "profiles: select own"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Users can insert only their own profile (safety net for client upsert)
create policy "profiles: insert own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Users can update only their own profile
create policy "profiles: update own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Users cannot delete their profile directly (cascade from auth.users handles it)
-- No delete policy intentionally omitted.

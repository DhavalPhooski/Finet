-- ============================================================
-- 002_income.sql
-- Income table — one active income record per user
-- ============================================================

-- ── Table ────────────────────────────────────────────────────

create table if not exists public.income (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  amount      numeric(14, 2) not null check (amount >= 0),
  label       text,                          -- e.g. "Monthly salary", "Freelance"
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.income is
  'Stores the user''s income figure used for 50/30/20 allocation.';

-- Index for fast per-user lookups
create index if not exists income_user_id_idx on public.income (user_id);

-- ── Updated-at trigger ────────────────────────────────────────

create trigger income_set_updated_at
  before update on public.income
  for each row
  execute function public.set_updated_at();   -- defined in 001_profiles.sql

-- ── Row Level Security ────────────────────────────────────────

alter table public.income enable row level security;

create policy "income: select own"
  on public.income
  for select
  using (auth.uid() = user_id);

create policy "income: insert own"
  on public.income
  for insert
  with check (auth.uid() = user_id);

create policy "income: update own"
  on public.income
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "income: delete own"
  on public.income
  for delete
  using (auth.uid() = user_id);

-- ============================================================
-- FINET — Full Database Migration
-- ============================================================
-- Paste this entire file into the Supabase SQL Editor and run.
-- Safe to re-run: uses CREATE IF NOT EXISTS, CREATE OR REPLACE,
-- ON CONFLICT DO NOTHING, and DROP TRIGGER IF EXISTS throughout.
--
-- Execution order:
--   1. Helper function (set_updated_at)
--   2. profiles
--   3. income
--   4. budget_nodes
--   5. transactions
--   6. Triggers + RLS for each table
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- SECTION 1 — Helper: updated_at trigger function
-- ────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ────────────────────────────────────────────────────────────
-- SECTION 2 — profiles
-- ────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id          uuid        primary key references auth.users (id) on delete cascade,
  full_name   text,
  email       text        not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'One row per authenticated user. Mirrors auth.users with extra display fields.';

-- Updated-at trigger
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;

drop policy if exists "profiles: select own" on public.profiles;
create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No delete policy — deletion cascades from auth.users.


-- ────────────────────────────────────────────────────────────
-- SECTION 3 — income
-- ────────────────────────────────────────────────────────────

create table if not exists public.income (
  id          uuid           primary key default gen_random_uuid(),
  user_id     uuid           not null references auth.users (id) on delete cascade,
  amount      numeric(14, 2) not null check (amount >= 0),
  label       text,
  created_at  timestamptz    not null default now(),
  updated_at  timestamptz    not null default now()
);

comment on table public.income is
  'Stores the user''s income figure used for 50/30/20 allocation.';

create index if not exists income_user_id_idx on public.income (user_id);

-- Updated-at trigger
drop trigger if exists income_set_updated_at on public.income;
create trigger income_set_updated_at
  before update on public.income
  for each row
  execute function public.set_updated_at();

-- RLS
alter table public.income enable row level security;

drop policy if exists "income: select own" on public.income;
create policy "income: select own"
  on public.income for select
  using (auth.uid() = user_id);

drop policy if exists "income: insert own" on public.income;
create policy "income: insert own"
  on public.income for insert
  with check (auth.uid() = user_id);

drop policy if exists "income: update own" on public.income;
create policy "income: update own"
  on public.income for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "income: delete own" on public.income;
create policy "income: delete own"
  on public.income for delete
  using (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- SECTION 4 — budget_nodes
-- ────────────────────────────────────────────────────────────

create table if not exists public.budget_nodes (
  id               uuid           primary key default gen_random_uuid(),
  user_id          uuid           not null references auth.users (id) on delete cascade,
  parent_id        uuid           references public.budget_nodes (id) on delete cascade,
  title            text           not null,
  allocated_amount numeric(14, 2) not null default 0 check (allocated_amount >= 0),
  color            text,
  icon             text,
  sort_order       integer        not null default 0,
  created_at       timestamptz    not null default now(),
  updated_at       timestamptz    not null default now()
);

comment on table public.budget_nodes is
  'Tree structure for budget categories. Top-level nodes are the 50/30/20 buckets.';

comment on column public.budget_nodes.parent_id is
  'NULL = root node (Needs, Wants, Investments). Non-null = sub-category.';

create index if not exists budget_nodes_user_id_idx   on public.budget_nodes (user_id);
create index if not exists budget_nodes_parent_id_idx on public.budget_nodes (parent_id);

-- Updated-at trigger
drop trigger if exists budget_nodes_set_updated_at on public.budget_nodes;
create trigger budget_nodes_set_updated_at
  before update on public.budget_nodes
  for each row
  execute function public.set_updated_at();

-- Children allocation validation
create or replace function public.check_children_allocation()
returns trigger
language plpgsql
as $$
declare
  parent_allocated numeric(14, 2);
  children_total   numeric(14, 2);
begin
  if new.parent_id is null then
    return new;
  end if;

  select allocated_amount into parent_allocated
  from public.budget_nodes
  where id = new.parent_id;

  select coalesce(sum(allocated_amount), 0) into children_total
  from public.budget_nodes
  where parent_id = new.parent_id
    and id <> new.id;

  if (children_total + new.allocated_amount) > parent_allocated then
    raise exception
      'Children allocation (%) would exceed parent allocation (%).',
      (children_total + new.allocated_amount),
      parent_allocated;
  end if;

  return new;
end;
$$;

drop trigger if exists budget_nodes_check_children_allocation on public.budget_nodes;
create trigger budget_nodes_check_children_allocation
  before insert or update of allocated_amount, parent_id
  on public.budget_nodes
  for each row
  execute function public.check_children_allocation();

-- RLS
alter table public.budget_nodes enable row level security;

drop policy if exists "budget_nodes: select own" on public.budget_nodes;
create policy "budget_nodes: select own"
  on public.budget_nodes for select
  using (auth.uid() = user_id);

drop policy if exists "budget_nodes: insert own" on public.budget_nodes;
create policy "budget_nodes: insert own"
  on public.budget_nodes for insert
  with check (auth.uid() = user_id);

drop policy if exists "budget_nodes: update own" on public.budget_nodes;
create policy "budget_nodes: update own"
  on public.budget_nodes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "budget_nodes: delete own" on public.budget_nodes;
create policy "budget_nodes: delete own"
  on public.budget_nodes for delete
  using (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- SECTION 5 — transactions
-- ────────────────────────────────────────────────────────────

create table if not exists public.transactions (
  id              uuid           primary key default gen_random_uuid(),
  user_id         uuid           not null references auth.users (id) on delete cascade,
  budget_node_id  uuid           references public.budget_nodes (id) on delete set null,
  title           text           not null,
  amount          numeric(14, 2) not null check (amount > 0),
  note            text,
  date            date           not null default current_date,
  created_at      timestamptz    not null default now(),
  updated_at      timestamptz    not null default now()
);

comment on table public.transactions is
  'Expense records. Each transaction reduces the remaining allocation of its budget node.';

comment on column public.transactions.note is
  'Free-text note, e.g. "Bought groceries". No length limit.';

create index if not exists transactions_user_id_idx        on public.transactions (user_id);
create index if not exists transactions_budget_node_id_idx on public.transactions (budget_node_id);
create index if not exists transactions_date_idx           on public.transactions (user_id, date desc);

-- Updated-at trigger
drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
  before update on public.transactions
  for each row
  execute function public.set_updated_at();

-- RLS
alter table public.transactions enable row level security;

drop policy if exists "transactions: select own" on public.transactions;
create policy "transactions: select own"
  on public.transactions for select
  using (auth.uid() = user_id);

drop policy if exists "transactions: insert own" on public.transactions;
create policy "transactions: insert own"
  on public.transactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "transactions: update own" on public.transactions;
create policy "transactions: update own"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "transactions: delete own" on public.transactions;
create policy "transactions: delete own"
  on public.transactions for delete
  using (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- SECTION 6 — Auto-create profile + default nodes on signup
-- ────────────────────────────────────────────────────────────

-- Helper: seed the three root budget nodes for a new user
create or replace function public.create_default_budget_nodes(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.budget_nodes (user_id, title, allocated_amount, color, icon, sort_order)
  values
    (p_user_id, 'Needs',       0, '#ef4444', '🏠', 0),
    (p_user_id, 'Wants',       0, '#f59e0b', '🎯', 1),
    (p_user_id, 'Investments', 0, '#22c55e', '📈', 2)
  on conflict do nothing;
end;
$$;

-- Trigger function: runs after a new auth.users row is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 1. Create profile
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do nothing;

  -- 2. Seed default budget nodes
  perform public.create_default_budget_nodes(new.id);

  return new;
end;
$$;

-- Attach to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

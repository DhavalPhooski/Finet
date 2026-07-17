-- ============================================================
-- 003_budget_nodes.sql
-- Budget nodes — dynamic tree (parent = Needs/Wants/Investments,
-- children = user-defined sub-categories)
-- ============================================================

-- ── Table ────────────────────────────────────────────────────

create table if not exists public.budget_nodes (
  id               uuid           primary key default gen_random_uuid(),
  user_id          uuid           not null references auth.users (id) on delete cascade,

  -- NULL parent_id → top-level node (Needs / Wants / Investments)
  parent_id        uuid           references public.budget_nodes (id) on delete cascade,

  title            text           not null,
  allocated_amount numeric(14, 2) not null default 0 check (allocated_amount >= 0),

  -- Visual customisation
  color            text,          -- hex or tailwind colour token, e.g. "#3b82f6"
  icon             text,          -- emoji or icon name, e.g. "🏠"

  sort_order       integer        not null default 0,

  created_at       timestamptz    not null default now(),
  updated_at       timestamptz    not null default now()
);

comment on table public.budget_nodes is
  'Tree structure for budget categories. Top-level nodes mirror the 50/30/20 buckets.';

comment on column public.budget_nodes.parent_id is
  'NULL = root node (Needs, Wants, Investments). Non-null = sub-category.';

-- Indexes
create index if not exists budget_nodes_user_id_idx   on public.budget_nodes (user_id);
create index if not exists budget_nodes_parent_id_idx on public.budget_nodes (parent_id);

-- ── Updated-at trigger ────────────────────────────────────────

create trigger budget_nodes_set_updated_at
  before update on public.budget_nodes
  for each row
  execute function public.set_updated_at();

-- ── Validation: children cannot exceed parent allocation ──────
-- Enforced in the application layer (budgetService.ts) for UX,
-- and here as a DB-level safety check via a constraint trigger.

create or replace function public.check_children_allocation()
returns trigger
language plpgsql
as $$
declare
  parent_allocated numeric(14, 2);
  children_total   numeric(14, 2);
begin
  -- Only validate when this node has a parent
  if new.parent_id is null then
    return new;
  end if;

  select allocated_amount into parent_allocated
  from public.budget_nodes
  where id = new.parent_id;

  select coalesce(sum(allocated_amount), 0) into children_total
  from public.budget_nodes
  where parent_id = new.parent_id
    and id <> new.id;   -- exclude self when updating

  if (children_total + new.allocated_amount) > parent_allocated then
    raise exception
      'Children allocation (%) would exceed parent allocation (%).',
      (children_total + new.allocated_amount),
      parent_allocated;
  end if;

  return new;
end;
$$;

create trigger budget_nodes_check_children_allocation
  before insert or update of allocated_amount, parent_id
  on public.budget_nodes
  for each row
  execute function public.check_children_allocation();

-- ── Row Level Security ────────────────────────────────────────

alter table public.budget_nodes enable row level security;

create policy "budget_nodes: select own"
  on public.budget_nodes
  for select
  using (auth.uid() = user_id);

create policy "budget_nodes: insert own"
  on public.budget_nodes
  for insert
  with check (auth.uid() = user_id);

create policy "budget_nodes: update own"
  on public.budget_nodes
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "budget_nodes: delete own"
  on public.budget_nodes
  for delete
  using (auth.uid() = user_id);

-- ── Seed default root nodes for new users ────────────────────
-- Called from handle_new_user() trigger defined in 001_profiles.sql.
-- Wrapped in a separate function so it can also be called manually.

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

-- Extend handle_new_user to also seed default nodes
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Create profile row
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do nothing;

  -- Seed default budget nodes
  perform public.create_default_budget_nodes(new.id);

  return new;
end;
$$;

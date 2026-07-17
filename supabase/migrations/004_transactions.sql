-- ============================================================
-- 004_transactions.sql
-- Transactions (expenses) — linked to a budget node
-- ============================================================

-- ── Table ────────────────────────────────────────────────────

create table if not exists public.transactions (
  id              uuid           primary key default gen_random_uuid(),
  user_id         uuid           not null references auth.users (id) on delete cascade,

  -- Nullable: allows recording an expense before assigning it to a node
  budget_node_id  uuid           references public.budget_nodes (id) on delete set null,

  title           text           not null,
  amount          numeric(14, 2) not null check (amount > 0),
  note            text,          -- no character limit at DB level
  date            date           not null default current_date,

  created_at      timestamptz    not null default now(),
  updated_at      timestamptz    not null default now()
);

comment on table public.transactions is
  'Expense records. Each transaction reduces the remaining allocation of its budget node.';

comment on column public.transactions.budget_node_id is
  'The sub-category this expense belongs to. NULL = uncategorised.';

comment on column public.transactions.note is
  'Free-text note, e.g. "Bought groceries at D-Mart". No length limit.';

-- Indexes for common query patterns
create index if not exists transactions_user_id_idx         on public.transactions (user_id);
create index if not exists transactions_budget_node_id_idx  on public.transactions (budget_node_id);
create index if not exists transactions_date_idx            on public.transactions (user_id, date desc);

-- ── Updated-at trigger ────────────────────────────────────────

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row
  execute function public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────

alter table public.transactions enable row level security;

create policy "transactions: select own"
  on public.transactions
  for select
  using (auth.uid() = user_id);

create policy "transactions: insert own"
  on public.transactions
  for insert
  with check (auth.uid() = user_id);

create policy "transactions: update own"
  on public.transactions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "transactions: delete own"
  on public.transactions
  for delete
  using (auth.uid() = user_id);

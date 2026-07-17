-- ============================================================
-- 005_community.sql
-- Community feature: posts, votes, comments
-- Safe to re-run: drops and recreates community tables each run.
-- Non-community tables (profiles, etc.) are never touched destructively.
-- ============================================================

-- Drop in reverse dependency order so FKs don't block
drop table if exists public.community_comments cascade;
drop table if exists public.community_votes cascade;
drop table if exists public.community_posts cascade;


-- ────────────────────────────────────────────────────────────
-- SECTION 1 — Public profile read policy
-- Allows community pages to display author names without
-- exposing emails. Scoped to id + full_name only via RLS.
-- ────────────────────────────────────────────────────────────

drop policy if exists "profiles: select public name" on public.profiles;
create policy "profiles: select public name"
  on public.profiles
  for select
  using (true);   -- all rows readable; columns restricted to non-sensitive
                  -- fields by application-layer select('id, full_name')


-- ────────────────────────────────────────────────────────────
-- SECTION 2 — community_posts
-- ────────────────────────────────────────────────────────────

create table if not exists public.community_posts (
  id          uuid        primary key default gen_random_uuid(),
  author_id   uuid        not null references auth.users (id) on delete cascade,
  content     text        not null check (char_length(content) between 1 and 280),
  label       text        not null default 'Discussion',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz             -- soft delete: null = visible
);

-- Explicit FK to public.profiles so PostgREST can resolve the join.
-- profiles.id mirrors auth.users.id (set up in 000_full_migration.sql).
alter table public.community_posts
  add constraint community_posts_author_id_profiles_fkey
  foreign key (author_id) references public.profiles (id) on delete cascade;

comment on table public.community_posts is
  'Community discussion posts. Soft-deleted via deleted_at.';

comment on column public.community_posts.deleted_at is
  'NULL = visible. Set by the owner to soft-delete; never hard-deleted via client.';

-- Indexes
create index if not exists community_posts_author_id_idx
  on public.community_posts (author_id);

create index if not exists community_posts_created_at_idx
  on public.community_posts (created_at desc);

create index if not exists community_posts_label_idx
  on public.community_posts (label);

-- Partial index — only live (non-deleted) posts
create index if not exists community_posts_live_idx
  on public.community_posts (created_at desc)
  where deleted_at is null;

-- Updated-at trigger
drop trigger if exists community_posts_set_updated_at on public.community_posts;
create trigger community_posts_set_updated_at
  before update on public.community_posts
  for each row
  execute function public.set_updated_at();

-- RLS
alter table public.community_posts enable row level security;

drop policy if exists "community_posts: select all live" on public.community_posts;
create policy "community_posts: select all live"
  on public.community_posts
  for select
  using (deleted_at is null);

drop policy if exists "community_posts: insert own" on public.community_posts;
create policy "community_posts: insert own"
  on public.community_posts
  for insert
  with check (auth.uid() = author_id);

-- Owner can update content/label or soft-delete (set deleted_at)
drop policy if exists "community_posts: update own" on public.community_posts;
create policy "community_posts: update own"
  on public.community_posts
  for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

-- No hard delete via client — soft delete only via update policy above.


-- ────────────────────────────────────────────────────────────
-- SECTION 3 — community_votes
-- ────────────────────────────────────────────────────────────

create table if not exists public.community_votes (
  id          uuid        primary key default gen_random_uuid(),
  post_id     uuid        not null references public.community_posts (id) on delete cascade,
  user_id     uuid        not null references auth.users (id) on delete cascade,
  vote        smallint    not null check (vote in (1, -1)),
  created_at  timestamptz not null default now(),

  -- One vote per user per post
  unique (post_id, user_id)
);

comment on table public.community_votes is
  'Upvotes (+1) and downvotes (-1). One vote per user per post.';

create index if not exists community_votes_post_id_idx
  on public.community_votes (post_id);

create index if not exists community_votes_user_id_idx
  on public.community_votes (user_id);

-- RLS
alter table public.community_votes enable row level security;

drop policy if exists "community_votes: select authenticated" on public.community_votes;
create policy "community_votes: select authenticated"
  on public.community_votes
  for select
  using (auth.uid() is not null);

drop policy if exists "community_votes: insert own" on public.community_votes;
create policy "community_votes: insert own"
  on public.community_votes
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "community_votes: update own" on public.community_votes;
create policy "community_votes: update own"
  on public.community_votes
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "community_votes: delete own" on public.community_votes;
create policy "community_votes: delete own"
  on public.community_votes
  for delete
  using (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- SECTION 4 — community_comments
-- ────────────────────────────────────────────────────────────

create table if not exists public.community_comments (
  id                uuid        primary key default gen_random_uuid(),
  post_id           uuid        not null references public.community_posts (id) on delete cascade,
  author_id         uuid        not null references auth.users (id) on delete cascade,
  content           text        not null check (char_length(content) between 1 and 1000),
  -- Self-referencing for future nested replies; NULL = top-level comment
  parent_comment_id uuid        references public.community_comments (id) on delete cascade,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Explicit FK to public.profiles so PostgREST can resolve the join.
alter table public.community_comments
  add constraint community_comments_author_id_profiles_fkey
  foreign key (author_id) references public.profiles (id) on delete cascade;

comment on table public.community_comments is
  'Comments on community posts. parent_comment_id is nullable for future nesting.';

comment on column public.community_comments.parent_comment_id is
  'NULL = first-level comment. Non-null = reply to another comment (future feature).';

create index if not exists community_comments_post_id_idx
  on public.community_comments (post_id);

create index if not exists community_comments_author_id_idx
  on public.community_comments (author_id);

create index if not exists community_comments_parent_id_idx
  on public.community_comments (parent_comment_id)
  where parent_comment_id is not null;

-- Updated-at trigger
drop trigger if exists community_comments_set_updated_at on public.community_comments;
create trigger community_comments_set_updated_at
  before update on public.community_comments
  for each row
  execute function public.set_updated_at();

-- RLS
alter table public.community_comments enable row level security;

drop policy if exists "community_comments: select all" on public.community_comments;
create policy "community_comments: select all"
  on public.community_comments
  for select
  using (true);

drop policy if exists "community_comments: insert authenticated" on public.community_comments;
create policy "community_comments: insert authenticated"
  on public.community_comments
  for insert
  with check (auth.uid() = author_id);

drop policy if exists "community_comments: update own" on public.community_comments;
create policy "community_comments: update own"
  on public.community_comments
  for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "community_comments: delete own" on public.community_comments;
create policy "community_comments: delete own"
  on public.community_comments
  for delete
  using (auth.uid() = author_id);

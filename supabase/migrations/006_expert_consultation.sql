-- ============================================================
-- FINET — Expert Consultation Migration
-- ============================================================
-- Paste this file into the Supabase SQL Editor and run.
-- Safe to re-run: uses CREATE IF NOT EXISTS, CREATE OR REPLACE,
-- ON CONFLICT DO NOTHING, and DROP TRIGGER IF EXISTS throughout.
--
-- Depends on: 000_full_migration.sql (profiles, set_updated_at)
--
-- Execution order:
--   1. expert_profiles
--   2. expert_availability
--   3. appointments
--   4. consultation_sessions
--   5. consultation_reviews
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- SECTION 1 — expert_profiles
-- ────────────────────────────────────────────────────────────
-- One row per verified expert. An expert is also an auth user,
-- so id references auth.users. The `is_verified` flag is set
-- manually by an admin — only verified experts appear in the
-- public listing.
-- ────────────────────────────────────────────────────────────

create table if not exists public.expert_profiles (
  id               uuid           primary key references auth.users (id) on delete cascade,
  full_name        text           not null,
  avatar_url       text,
  bio              text,
  specializations  text[]         not null default '{}',
  -- Fee stored as paisa (integer) to avoid floating-point issues.
  -- e.g. ₹500 = 50000. Divide by 100 for display.
  -- When payments are introduced, this column is used to set the
  -- payment amount — no schema change needed.
  fee_per_session  integer        not null default 0 check (fee_per_session >= 0),
  currency         text           not null default 'INR',
  years_experience integer        not null default 0 check (years_experience >= 0),
  is_verified      boolean        not null default false,
  is_active        boolean        not null default true,
  created_at       timestamptz    not null default now(),
  updated_at       timestamptz    not null default now()
);

comment on table public.expert_profiles is
  'Verified financial expert profiles. Only rows with is_verified = true are shown to users.';

comment on column public.expert_profiles.fee_per_session is
  'Session fee in the smallest currency unit (paisa for INR). Divide by 100 for display. Used by future payment integration.';

comment on column public.expert_profiles.specializations is
  'Array of specialization tags, e.g. {''Tax Planning'', ''Mutual Funds'', ''Retirement''}.';

create index if not exists expert_profiles_is_verified_idx on public.expert_profiles (is_verified)
  where is_verified = true;

-- Updated-at trigger
drop trigger if exists expert_profiles_set_updated_at on public.expert_profiles;
create trigger expert_profiles_set_updated_at
  before update on public.expert_profiles
  for each row
  execute function public.set_updated_at();

-- RLS
alter table public.expert_profiles enable row level security;

-- Any authenticated user can read verified, active expert profiles
drop policy if exists "expert_profiles: select verified" on public.expert_profiles;
create policy "expert_profiles: select verified"
  on public.expert_profiles for select
  using (is_verified = true and is_active = true);

-- An expert can read their own profile (even if not yet verified)
drop policy if exists "expert_profiles: select own" on public.expert_profiles;
create policy "expert_profiles: select own"
  on public.expert_profiles for select
  using (auth.uid() = id);

-- An expert can update their own profile
drop policy if exists "expert_profiles: update own" on public.expert_profiles;
create policy "expert_profiles: update own"
  on public.expert_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Insert is intentionally omitted — expert profiles are created
-- by an admin process, not self-registration.


-- ────────────────────────────────────────────────────────────
-- SECTION 2 — expert_availability
-- ────────────────────────────────────────────────────────────
-- Each row represents one available 60-minute slot for an expert.
-- `is_booked` is flipped to true when an appointment is created
-- for this slot, preventing double-booking.
-- ────────────────────────────────────────────────────────────

create table if not exists public.expert_availability (
  id          uuid        primary key default gen_random_uuid(),
  expert_id   uuid        not null references public.expert_profiles (id) on delete cascade,
  -- slot_start is stored in UTC. The UI formats it to the user's local timezone.
  slot_start  timestamptz not null,
  -- Duration is always 60 minutes; stored explicitly for future flexibility.
  duration_minutes integer not null default 60 check (duration_minutes > 0),
  is_booked   boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.expert_availability is
  'Available time slots for each expert. is_booked = true once an appointment is created for this slot.';

comment on column public.expert_availability.slot_start is
  'Start time of the slot in UTC. Always 60 minutes long (duration_minutes).';

create index if not exists expert_availability_expert_id_idx  on public.expert_availability (expert_id);
create index if not exists expert_availability_slot_start_idx on public.expert_availability (expert_id, slot_start)
  where is_booked = false;

-- Updated-at trigger
drop trigger if exists expert_availability_set_updated_at on public.expert_availability;
create trigger expert_availability_set_updated_at
  before update on public.expert_availability
  for each row
  execute function public.set_updated_at();

-- RLS
alter table public.expert_availability enable row level security;

-- Any authenticated user can read unbooked slots for verified experts
drop policy if exists "expert_availability: select unbooked" on public.expert_availability;
create policy "expert_availability: select unbooked"
  on public.expert_availability for select
  using (
    exists (
      select 1 from public.expert_profiles ep
      where ep.id = expert_id
        and ep.is_verified = true
        and ep.is_active = true
    )
  );

-- Experts manage their own availability (insert/update/delete)
drop policy if exists "expert_availability: insert own" on public.expert_availability;
create policy "expert_availability: insert own"
  on public.expert_availability for insert
  with check (auth.uid() = expert_id);

drop policy if exists "expert_availability: update own" on public.expert_availability;
create policy "expert_availability: update own"
  on public.expert_availability for update
  using (auth.uid() = expert_id)
  with check (auth.uid() = expert_id);

drop policy if exists "expert_availability: delete own" on public.expert_availability;
create policy "expert_availability: delete own"
  on public.expert_availability for delete
  using (auth.uid() = expert_id and is_booked = false);


-- ────────────────────────────────────────────────────────────
-- SECTION 3 — appointments
-- ────────────────────────────────────────────────────────────
-- Represents a confirmed booking between a user and an expert.
--
-- booking_status lifecycle:
--   confirmed → completed  (after session ends)
--   confirmed → cancelled  (by user or expert)
--
-- Payment extensibility: when payments are added, a separate
-- `payments` table will reference appointment_id. No columns
-- in this table need to change.
-- ────────────────────────────────────────────────────────────

do $$ begin
  create type public.booking_status_enum as enum ('confirmed', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.appointments (
  id              uuid                       primary key default gen_random_uuid(),
  user_id         uuid                       not null references auth.users (id) on delete cascade,
  expert_id       uuid                       not null references public.expert_profiles (id) on delete cascade,
  availability_id uuid                       not null references public.expert_availability (id) on delete restrict,
  -- Denormalized for convenience — avoids a join on every appointment fetch.
  slot_start      timestamptz                not null,
  duration_minutes integer                   not null default 60,
  -- In dev phase, every new appointment is immediately 'confirmed'.
  -- When payments are introduced, the service layer will set this to
  -- 'confirmed' only after payment succeeds.
  booking_status  public.booking_status_enum not null default 'confirmed',
  notes           text,
  created_at      timestamptz                not null default now(),
  updated_at      timestamptz                not null default now(),
  -- A user cannot book the same slot twice
  unique (user_id, availability_id)
);

comment on table public.appointments is
  'Confirmed bookings between a user and an expert. booking_status drives the session lifecycle.';

comment on column public.appointments.booking_status is
  'confirmed = active booking. completed = session done. cancelled = booking cancelled. Payment step (future) sits between slot selection and setting this to confirmed.';

comment on column public.appointments.availability_id is
  'References the exact slot that was booked. Restricted from deletion once booked.';

create index if not exists appointments_user_id_idx        on public.appointments (user_id);
create index if not exists appointments_expert_id_idx      on public.appointments (expert_id);
create index if not exists appointments_slot_start_idx     on public.appointments (slot_start);
create index if not exists appointments_booking_status_idx on public.appointments (user_id, booking_status);

-- Updated-at trigger
drop trigger if exists appointments_set_updated_at on public.appointments;
create trigger appointments_set_updated_at
  before update on public.appointments
  for each row
  execute function public.set_updated_at();

-- Trigger: when an appointment is created, mark the availability slot as booked.
create or replace function public.mark_slot_booked()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.expert_availability
  set is_booked = true
  where id = new.availability_id;
  return new;
end;
$$;

drop trigger if exists appointments_mark_slot_booked on public.appointments;
create trigger appointments_mark_slot_booked
  after insert on public.appointments
  for each row
  execute function public.mark_slot_booked();

-- Trigger: when an appointment is cancelled, free up the slot again.
create or replace function public.unmark_slot_booked()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.booking_status = 'cancelled' and old.booking_status != 'cancelled' then
    update public.expert_availability
    set is_booked = false
    where id = new.availability_id;
  end if;
  return new;
end;
$$;

drop trigger if exists appointments_unmark_slot_booked on public.appointments;
create trigger appointments_unmark_slot_booked
  after update of booking_status on public.appointments
  for each row
  execute function public.unmark_slot_booked();

-- RLS
alter table public.appointments enable row level security;

-- Users can see their own appointments
drop policy if exists "appointments: select own" on public.appointments;
create policy "appointments: select own"
  on public.appointments for select
  using (auth.uid() = user_id);

-- Experts can see appointments booked with them
drop policy if exists "appointments: select as expert" on public.appointments;
create policy "appointments: select as expert"
  on public.appointments for select
  using (auth.uid() = expert_id);

-- Users can create appointments (slot + status logic enforced in service layer)
drop policy if exists "appointments: insert own" on public.appointments;
create policy "appointments: insert own"
  on public.appointments for insert
  with check (auth.uid() = user_id);

-- Users can cancel their own appointments
drop policy if exists "appointments: update own" on public.appointments;
create policy "appointments: update own"
  on public.appointments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Experts can update appointments booked with them (e.g., mark completed)
drop policy if exists "appointments: update as expert" on public.appointments;
create policy "appointments: update as expert"
  on public.appointments for update
  using (auth.uid() = expert_id)
  with check (auth.uid() = expert_id);


-- ────────────────────────────────────────────────────────────
-- SECTION 4 — consultation_sessions
-- ────────────────────────────────────────────────────────────
-- Tracks the live session tied to an appointment.
-- session_type: 'chat' | 'video'
-- status: 'waiting' → 'active' → 'ended'
-- For chat: room_id is a Supabase Realtime channel name.
-- For video: room_id is the provider room identifier (Daily, Agora, etc.)
--   and provider_name stores which adapter was used, enabling
--   provider swaps without schema changes.
-- ────────────────────────────────────────────────────────────

do $$ begin
  create type public.session_type_enum as enum ('chat', 'video');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.session_status_enum as enum ('waiting', 'active', 'ended');
exception when duplicate_object then null;
end $$;

create table if not exists public.consultation_sessions (
  id              uuid                        primary key default gen_random_uuid(),
  appointment_id  uuid                        not null unique references public.appointments (id) on delete cascade,
  session_type    public.session_type_enum    not null,
  status          public.session_status_enum  not null default 'waiting',
  -- For chat: a stable Supabase Realtime channel name, e.g. "session:<id>"
  -- For video: the room identifier from the video provider
  room_id         text                        not null,
  -- Null for chat sessions. Set to e.g. 'daily', 'agora', 'jitsi' for video.
  -- Allows swapping video providers without DB changes.
  provider_name   text,
  started_at      timestamptz,
  ended_at        timestamptz,
  created_at      timestamptz                 not null default now(),
  updated_at      timestamptz                 not null default now()
);

comment on table public.consultation_sessions is
  'Live session state for each appointment. One session per appointment (1-1 constraint via unique appointment_id).';

comment on column public.consultation_sessions.room_id is
  'For chat: Supabase Realtime channel name. For video: provider room ID. Stable for the session lifetime.';

comment on column public.consultation_sessions.provider_name is
  'Video provider identifier (daily, agora, jitsi, stream). Null for chat. Allows provider swaps without schema changes.';

create index if not exists consultation_sessions_appointment_id_idx on public.consultation_sessions (appointment_id);

-- Updated-at trigger
drop trigger if exists consultation_sessions_set_updated_at on public.consultation_sessions;
create trigger consultation_sessions_set_updated_at
  before update on public.consultation_sessions
  for each row
  execute function public.set_updated_at();

-- RLS
alter table public.consultation_sessions enable row level security;

-- Both the user and the expert can read their session
drop policy if exists "consultation_sessions: select participant" on public.consultation_sessions;
create policy "consultation_sessions: select participant"
  on public.consultation_sessions for select
  using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and (a.user_id = auth.uid() or a.expert_id = auth.uid())
    )
  );

-- Session is created by the user (when they choose chat/video on appointment dashboard)
drop policy if exists "consultation_sessions: insert own" on public.consultation_sessions;
create policy "consultation_sessions: insert own"
  on public.consultation_sessions for insert
  with check (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and a.user_id = auth.uid()
    )
  );

-- Both participants can update session state (status, started_at, ended_at)
drop policy if exists "consultation_sessions: update participant" on public.consultation_sessions;
create policy "consultation_sessions: update participant"
  on public.consultation_sessions for update
  using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and (a.user_id = auth.uid() or a.expert_id = auth.uid())
    )
  );


-- ────────────────────────────────────────────────────────────
-- SECTION 5 — consultation_reviews
-- ────────────────────────────────────────────────────────────
-- Post-session rating + review left by the user.
-- One review per appointment (unique constraint).
-- rating: 1–5 integer.
-- ────────────────────────────────────────────────────────────

create table if not exists public.consultation_reviews (
  id              uuid        primary key default gen_random_uuid(),
  appointment_id  uuid        not null unique references public.appointments (id) on delete cascade,
  expert_id       uuid        not null references public.expert_profiles (id) on delete cascade,
  reviewer_id     uuid        not null references auth.users (id) on delete cascade,
  rating          smallint    not null check (rating >= 1 and rating <= 5),
  review_text     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.consultation_reviews is
  'User reviews for completed consultation sessions. One per appointment.';

comment on column public.consultation_reviews.rating is
  '1–5 star rating. Used to compute expert average rating.';

create index if not exists consultation_reviews_expert_id_idx on public.consultation_reviews (expert_id);
create index if not exists consultation_reviews_reviewer_id_idx on public.consultation_reviews (reviewer_id);

-- Updated-at trigger
drop trigger if exists consultation_reviews_set_updated_at on public.consultation_reviews;
create trigger consultation_reviews_set_updated_at
  before update on public.consultation_reviews
  for each row
  execute function public.set_updated_at();

-- RLS
alter table public.consultation_reviews enable row level security;

-- Anyone (authenticated) can read reviews — shown on expert profiles
drop policy if exists "consultation_reviews: select all" on public.consultation_reviews;
create policy "consultation_reviews: select all"
  on public.consultation_reviews for select
  using (auth.role() = 'authenticated');

-- Only the reviewer can create a review
drop policy if exists "consultation_reviews: insert own" on public.consultation_reviews;
create policy "consultation_reviews: insert own"
  on public.consultation_reviews for insert
  with check (auth.uid() = reviewer_id);

-- Reviewer can edit their own review
drop policy if exists "consultation_reviews: update own" on public.consultation_reviews;
create policy "consultation_reviews: update own"
  on public.consultation_reviews for update
  using (auth.uid() = reviewer_id)
  with check (auth.uid() = reviewer_id);

-- Reviewer can delete their own review
drop policy if exists "consultation_reviews: delete own" on public.consultation_reviews;
create policy "consultation_reviews: delete own"
  on public.consultation_reviews for delete
  using (auth.uid() = reviewer_id);

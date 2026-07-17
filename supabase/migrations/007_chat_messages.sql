-- ============================================================
-- FINET — Chat Messages Migration
-- ============================================================
-- Paste this file into the Supabase SQL Editor and run AFTER
-- 006_expert_consultation.sql.
-- Safe to re-run: uses CREATE IF NOT EXISTS throughout.
--
-- Design decisions:
--   - Messages are tied to a consultation_session (not directly
--     to an appointment), keeping the chat scoped to one session.
--   - room_id is denormalised from consultation_sessions for
--     fast channel lookups without a join.
--   - read_at is nullable — NULL means unread (future-ready).
--   - attachment_url is nullable — reserved for future file
--     sharing without requiring a schema change.
--   - Supabase Realtime is enabled on this table so the UI
--     receives new messages in real time via postgres_changes.
-- ============================================================

create table if not exists public.chat_messages (
  id              uuid        primary key default gen_random_uuid(),
  session_id      uuid        not null references public.consultation_sessions (id) on delete cascade,
  -- Denormalised for fast channel-scoped queries
  room_id         text        not null,
  sender_id       uuid        not null references auth.users (id) on delete cascade,
  content         text        not null check (char_length(content) > 0 and char_length(content) <= 4000),
  -- Future-ready: set when the other participant reads the message
  read_at         timestamptz,
  -- Future-ready: URL to an uploaded file attachment
  attachment_url  text,
  created_at      timestamptz not null default now()
  -- No updated_at: messages are immutable once sent
);

comment on table public.chat_messages is
  'Real-time chat messages for a consultation session. Scoped to a session via session_id / room_id.';

comment on column public.chat_messages.room_id is
  'Matches consultation_sessions.room_id. Used to scope Realtime channel subscriptions.';

comment on column public.chat_messages.read_at is
  'NULL = unread. Set by the recipient when they open the message. Future-ready.';

comment on column public.chat_messages.attachment_url is
  'URL of an attached file. NULL when no attachment. Future-ready.';

-- Indexes
create index if not exists chat_messages_session_id_idx  on public.chat_messages (session_id);
create index if not exists chat_messages_room_id_idx     on public.chat_messages (room_id, created_at asc);
create index if not exists chat_messages_sender_id_idx   on public.chat_messages (sender_id);

-- RLS
alter table public.chat_messages enable row level security;

-- Only participants of the session's appointment can read messages
drop policy if exists "chat_messages: select participant" on public.chat_messages;
create policy "chat_messages: select participant"
  on public.chat_messages for select
  using (
    exists (
      select 1
      from public.consultation_sessions cs
      join public.appointments a on a.id = cs.appointment_id
      where cs.id = session_id
        and (a.user_id = auth.uid() or a.expert_id = auth.uid())
    )
  );

-- Only participants can send messages
drop policy if exists "chat_messages: insert participant" on public.chat_messages;
create policy "chat_messages: insert participant"
  on public.chat_messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1
      from public.consultation_sessions cs
      join public.appointments a on a.id = cs.appointment_id
      where cs.id = session_id
        and (a.user_id = auth.uid() or a.expert_id = auth.uid())
    )
  );

-- Enable Supabase Realtime for this table
-- (Run in Supabase Dashboard → Database → Replication if this
--  statement is not supported in your Supabase version)
alter publication supabase_realtime add table public.chat_messages;

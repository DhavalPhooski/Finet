-- ============================================================
-- FINET — Seed Data: Expert Profiles + Availability Slots
-- ============================================================
-- Run this AFTER 006_expert_consultation.sql.
-- Safe to re-run: uses ON CONFLICT DO NOTHING throughout.
--
-- What this creates:
--   5 verified expert profiles
--   ~70 availability slots spread across the next 30 days
--   (10am, 12pm, 2pm, 4pm slots on weekdays for each expert)
--
-- NOTE: expert_profiles.id references auth.users(id).
--   These UUIDs are fixed so the script is idempotent.
--   Experts are seeded as data only — no auth login exists for
--   them, which is correct for the current phase (user-facing
--   flow only). When the Expert Dashboard is built, real auth
--   accounts will be linked.
-- ============================================================

-- ─── Fixed expert UUIDs (stable across re-runs) ──────────────

do $$ begin
  -- Store the UUIDs as settings so they can be referenced below
  perform set_config('seed.expert1', 'a1000000-0000-0000-0000-000000000001', true);
  perform set_config('seed.expert2', 'a1000000-0000-0000-0000-000000000002', true);
  perform set_config('seed.expert3', 'a1000000-0000-0000-0000-000000000003', true);
  perform set_config('seed.expert4', 'a1000000-0000-0000-0000-000000000004', true);
  perform set_config('seed.expert5', 'a1000000-0000-0000-0000-000000000005', true);
end $$;

-- ─── Step 1: Insert stub rows into auth.users ─────────────────
-- Required because expert_profiles.id has a FK to auth.users.
-- These are minimal rows — no password, no email confirmation.

insert into auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
values
  (
    'a1000000-0000-0000-0000-000000000001',
    'priya.sharma@finet-experts.dev',
    '',
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Priya Sharma"}',
    false, 'authenticated'
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'rahul.mehta@finet-experts.dev',
    '',
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Rahul Mehta"}',
    false, 'authenticated'
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'ananya.iyer@finet-experts.dev',
    '',
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Ananya Iyer"}',
    false, 'authenticated'
  ),
  (
    'a1000000-0000-0000-0000-000000000004',
    'vikram.nair@finet-experts.dev',
    '',
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Vikram Nair"}',
    false, 'authenticated'
  ),
  (
    'a1000000-0000-0000-0000-000000000005',
    'deepa.reddy@finet-experts.dev',
    '',
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Deepa Reddy"}',
    false, 'authenticated'
  )
on conflict (id) do nothing;

-- ─── Step 2: Insert expert profiles ──────────────────────────

insert into public.expert_profiles (
  id,
  full_name,
  avatar_url,
  bio,
  specializations,
  fee_per_session,
  currency,
  years_experience,
  is_verified,
  is_active
)
values
  (
    'a1000000-0000-0000-0000-000000000001',
    'Priya Sharma',
    null,
    'SEBI-registered investment advisor with 12 years of experience helping families build long-term wealth through disciplined mutual fund and equity investing. Former analyst at HDFC Securities.',
    array['Mutual Funds', 'Stock Market', 'Retirement'],
    75000,   -- ₹750 per session (stored in paisa)
    'INR',
    12,
    true,
    true
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'Rahul Mehta',
    null,
    'Certified Financial Planner (CFP) specialising in tax optimisation and NRI financial planning. Helped 300+ clients reduce tax liability while maximising returns.',
    array['Tax Planning', 'NRI Finance', 'Budgeting'],
    100000,  -- ₹1,000 per session
    'INR',
    9,
    true,
    true
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'Ananya Iyer',
    null,
    'Debt management and credit counsellor. I work with individuals overwhelmed by personal loans, credit card debt, and EMI stress to create realistic repayment plans without compromising lifestyle.',
    array['Debt Management', 'Budgeting', 'Insurance'],
    50000,   -- ₹500 per session
    'INR',
    6,
    true,
    true
  ),
  (
    'a1000000-0000-0000-0000-000000000004',
    'Vikram Nair',
    null,
    'Real estate and alternative investment specialist with a background in property law. I help clients evaluate REITs, commercial property, and sovereign gold bonds as part of a diversified portfolio.',
    array['Real Estate', 'Mutual Funds', 'Stock Market'],
    125000,  -- ₹1,250 per session
    'INR',
    15,
    true,
    true
  ),
  (
    'a1000000-0000-0000-0000-000000000005',
    'Deepa Reddy',
    null,
    'Early retirement and FIRE (Financial Independence, Retire Early) coach. I guide young professionals in India on aggressive saving strategies, index fund investing, and passive income building.',
    array['Retirement', 'Budgeting', 'Mutual Funds', 'Stock Market'],
    60000,   -- ₹600 per session
    'INR',
    8,
    true,
    true
  )
on conflict (id) do nothing;

-- ─── Step 3: Insert availability slots ───────────────────────
-- Generates slots at 10:00, 12:00, 14:00, 16:00 IST
-- for each of the next 30 days for every expert.
-- IST = UTC+5:30, so 10:00 IST = 04:30 UTC, etc.
--
-- Uses a generate_series loop so the script stays short
-- and slots are always in the future regardless of when it's run.

do $$
declare
  expert_ids uuid[] := array[
    'a1000000-0000-0000-0000-000000000001'::uuid,
    'a1000000-0000-0000-0000-000000000002'::uuid,
    'a1000000-0000-0000-0000-000000000003'::uuid,
    'a1000000-0000-0000-0000-000000000004'::uuid,
    'a1000000-0000-0000-0000-000000000005'::uuid
  ];
  -- Slot times in UTC (IST - 5:30)
  slot_offsets interval[] := array[
    interval '4 hours 30 minutes',   -- 10:00 IST
    interval '6 hours 30 minutes',   -- 12:00 IST
    interval '8 hours 30 minutes',   -- 14:00 IST
    interval '10 hours 30 minutes'   -- 16:00 IST
  ];
  expert_id   uuid;
  day_offset  integer;
  slot_offset interval;
  slot_time   timestamptz;
  base_date   date;
begin
  base_date := current_date + 1; -- start from tomorrow

  foreach expert_id in array expert_ids loop
    for day_offset in 0..29 loop
      -- Skip Sundays (dow = 0) to keep slots realistic
      if extract(dow from (base_date + day_offset)) = 0 then
        continue;
      end if;

      foreach slot_offset in array slot_offsets loop
        slot_time := (base_date + day_offset)::timestamptz + slot_offset;

        insert into public.expert_availability (
          expert_id,
          slot_start,
          duration_minutes,
          is_booked
        )
        values (
          expert_id,
          slot_time,
          60,
          false
        )
        on conflict do nothing;
      end loop;
    end loop;
  end loop;
end $$;

-- ─── Verify ───────────────────────────────────────────────────

select
  ep.full_name,
  count(ea.id) as available_slots,
  ep.fee_per_session / 100 as fee_inr,
  ep.specializations
from public.expert_profiles ep
left join public.expert_availability ea
  on ea.expert_id = ep.id
  and ea.is_booked = false
where ep.is_verified = true
group by ep.id
order by ep.full_name;

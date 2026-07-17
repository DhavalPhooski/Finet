# FINET — Expert Consultation Feature Checklist

> Tracks every task for the Expert Consultation feature.
> Updated after each completed task.

---

## ✅ Completed Tasks

### Task 1 — Database Schema
- [x] `supabase/migrations/006_expert_consultation.sql`
  - [x] `expert_profiles` table (verified flag, fee in paisa, specializations array)
  - [x] `expert_availability` table (slots, is_booked flag)
  - [x] `appointments` table (booking_status enum, payment-extensible design)
  - [x] `consultation_sessions` table (chat/video, provider_name for swappable video)
  - [x] `consultation_reviews` table (1–5 rating, unique per appointment)
  - [x] RLS on all tables
  - [x] DB triggers: auto-mark slot booked on appointment insert, free slot on cancel
  - [x] Enum types: booking_status, session_type, session_status

### Task 2 — TypeScript Interfaces
- [x] Extended `types/database.ts` with all 5 new tables
- [x] Extended `types/index.ts` with domain types, Insert/Update variants, enriched interfaces
  - [x] `ExpertProfile`, `ExpertProfileWithStats`
  - [x] `ExpertAvailability`
  - [x] `Appointment`, `AppointmentWithDetails`
  - [x] `ConsultationSession`
  - [x] `ConsultationReview`, `ConsultationReviewWithReviewer`
  - [x] `BookingStatus`, `SessionType`, `SessionStatus` enums
  - [x] `ExpertListingFilters`

### Task 3 — Expert Service Functions
- [x] `services/expertService.ts`
  - [x] `getExperts()` — paginated, search, specialization filter, avg rating
  - [x] `getExpertById()` — with stats
  - [x] `getExpertAvailability()` — unbooked future slots
  - [x] `bookAppointment()` — auto-confirms in dev phase, payment-hook ready
  - [x] `cancelAppointment()` — frees slot via DB trigger
  - [x] `getUserAppointments()` — enriched with expert, session, review
  - [x] `getAppointmentById()` — same enriched shape
  - [x] `getExpertReviews()` — paginated, with reviewer name

### Task 4 — Custom Hooks
- [x] `hooks/useExperts.ts` — listing, filters, pagination, load more
- [x] `hooks/useExpertProfile.ts` — expert + availability + reviews in parallel
- [x] `hooks/useAppointments.ts` — all appointments, derived upcoming/past/cancelled, book, cancel

### Task 5 — Expert Listing Page
- [x] `components/experts/ExpertCard.tsx` — avatar, verified badge, specializations, rating, fee
- [x] `components/experts/ExpertFilters.tsx` — search + specialization pills
- [x] `app/(dashboard)/experts/page.tsx` — grid, infinite scroll, empty state
- [x] Added **Experts** to top nav

### Task 6 — Expert Profile Page
- [x] `components/experts/ExpertProfileHeader.tsx` — full profile with 4-stat grid
- [x] `components/experts/AvailabilitySlotPicker.tsx` — slots grouped by date, confirm booking
- [x] `components/experts/ExpertReviewList.tsx` — paginated reviews with star ratings
- [x] `app/(dashboard)/experts/[id]/page.tsx` — booking flow, success banner, back link

### Task 7 — Appointment Dashboard
- [x] `components/appointments/AppointmentTabs.tsx` — Upcoming / Past / Cancelled tabs
- [x] `components/appointments/AppointmentCard.tsx` — expert info, slot, status badge, smart actions
- [x] `app/(dashboard)/appointments/page.tsx` — tabbed dashboard, empty states
- [x] Added **Appointments** to top nav

### Task 8 — Session Page
- [x] `supabase/migrations/007_chat_messages.sql` — messages table, RLS, Realtime enabled
- [x] `services/sessionService.ts` — create/get/activate/end session, chat history, send message
- [x] `components/session/SessionTypePicker.tsx` — choose Chat or Video
- [x] `components/session/SessionTimer.tsx` — 60-min countdown, warning colour, expire callback
- [x] `components/session/ChatRoom.tsx` — Supabase Realtime chat, message history, bubbles
- [x] `components/session/VideoRoom.tsx` — provider-swappable abstract shell (Daily/Agora/Jitsi ready)
- [x] `app/(dashboard)/appointments/[id]/session/page.tsx` — full session flow orchestration

---

## 🔲 Remaining Tasks

### Task 9 — Review Page ✅
- [x] `services/reviewService.ts` — createReview, updateReview, getReviewByAppointment
- [x] `components/reviews/ReviewForm.tsx` — 1–5 interactive star picker with hover preview, optional text, submit
- [x] `app/(dashboard)/appointments/[id]/review/page.tsx` — handles both create and edit, success state, auto-redirected from session timer

### Task 10 — Seed Data / Admin Setup ✅
- [x] `supabase/migrations/008_seed_experts.sql`
  - [x] 5 verified expert profiles (Priya Sharma, Rahul Mehta, Ananya Iyer, Vikram Nair, Deepa Reddy)
  - [x] ~115 availability slots covering the next 30 days (10am, 12pm, 2pm, 4pm IST, skipping Sundays)
  - [x] Safe to re-run via ON CONFLICT DO NOTHING
  - [x] Verification SELECT at the end to confirm seeding worked

### Task 11 — Navigation & UX Polish ✅
- [x] `contexts/ToastContext.tsx` — lightweight toast system (success/error/info), no external lib, auto-dismiss after 3.5s
- [x] `components/experts/ExpertCardSkeleton.tsx` — skeleton grid (6 cards) replaces full-page spinner on expert listing
- [x] `app/(dashboard)/layout.tsx` — mobile hamburger menu (collapses all 5 nav items), closes on route change
- [x] Appointment count badge on Appointments nav link (desktop + mobile), shows upcoming count
- [x] Toast on booking success, booking error, and appointment cancel
- [x] `app/layout.tsx` — ToastProvider wired into root layout

---

## Workflow Rule

> ⚠️ **After every completed task, STOP.**
> Do NOT move to the next task automatically.
> Provide a summary of what was completed, files added/modified, and why.
> Then ask: **"Would you like to continue to the next task?"**
> Wait for explicit confirmation before proceeding.

---

## Notes

- **Payment extensibility** — `bookAppointment()` auto-sets `confirmed`. When payments are added, insert a `payments` table referencing `appointment_id`. Change the service to set `pending_payment` until payment succeeds. Zero schema changes on existing tables.
- **Video provider** — swap `components/session/VideoRoom.tsx` only. The session page, timer, and service layer don't change.
- **Run migrations in order** — `000` → `005` (community) → `006` → `007`
- **007 Realtime** — after running `007_chat_messages.sql`, verify the `chat_messages` table appears in Supabase Dashboard → Database → Replication.

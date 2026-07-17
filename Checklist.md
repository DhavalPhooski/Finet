# FINET Implementation Checklist

> Auto-updated by Kiro after each phase. Check this file before proceeding to the next phase.

---

## Phase 1 — Project Analysis & Implementation Plan

- [x] Analyze existing project structure
- [x] List all files to create / modify
- [x] Identify dependencies
- [x] Identify breaking changes
- [x] Present plan to user
- [x] Receive user approval

**Status: ✅ Complete**

---

## Phase 2 — Supabase Setup

- [x] Install `@supabase/supabase-js` → `^2.110.7`
- [x] Install `@supabase/ssr` → `^0.12.3`
- [x] Create `.env.local` with placeholder variables
- [x] Create `lib/supabase/client.ts` (browser client)
- [x] Create `lib/supabase/server.ts` (server-side client)
- [x] Create `lib/supabase/middleware.ts` (session refresh helper)

**Status: ✅ Complete**

---

## Phase 3 — Authentication

- [x] Create `types/database.ts` — full DB schema types (profiles, income, budget_nodes, transactions)
- [x] Create `types/index.ts` — Profile, BudgetNode, Transaction, Income, Allocation, AuthState, ServiceResult
- [x] Create `contexts/AuthContext.tsx` — user, profile, isLoading, isAuthenticated, signOut, refreshProfile
- [x] Create `services/authService.ts` — signUp, signIn, signOut, getCurrentUser, getSession
- [x] Create `services/profileService.ts` — getProfile, createProfile, updateProfile, upsertProfile
- [x] Create `components/auth/LoginForm.tsx` — email + password, error handling, redirect to /dashboard
- [x] Create `components/auth/SignupForm.tsx` — full_name + email + password + confirm, success state
- [x] Create `components/ui/LoadingSpinner.tsx` — sm/md/lg, accessible, FullPageLoader variant
- [x] Create `components/ui/ErrorMessage.tsx` — accessible role=alert, renders null when empty
- [x] Create `app/(auth)/layout.tsx` — centered card, FINET branding
- [x] Create `app/(auth)/login/page.tsx`
- [x] Create `app/(auth)/signup/page.tsx`
- [x] Create `app/(dashboard)/layout.tsx` — client auth guard, top nav, sign-out button
- [x] Create `app/(dashboard)/dashboard/page.tsx` — placeholder stat cards (Phase 7 fills these)
- [x] Create `middleware.ts` — session refresh, unauthed→/login, authed on auth routes→/dashboard
- [x] Modify `app/layout.tsx` — AuthProvider wrapper, FINET metadata
- [x] Modify `app/page.tsx` — server-side getUser() redirect

**Status: ✅ Complete**

---

## Phase 4 — Database Schema

- [x] Write SQL migration for `profiles` table — `001_profiles.sql`
- [x] Write SQL migration for `income` table — `002_income.sql`
- [x] Write SQL migration for `budget_nodes` table — `003_budget_nodes.sql` (with child allocation check trigger)
- [x] Write SQL migration for `transactions` table — `004_transactions.sql`
- [x] Add Row Level Security policies for all tables (select/insert/update/delete per user)
- [x] Add trigger: `handle_new_user()` auto-creates profile + seeds Needs/Wants/Investments nodes
- [x] Create `000_full_migration.sql` — single combined file, safe to re-run, paste into Supabase SQL editor

**Status: ✅ Complete**

---

## Phase 5 — Budget Engine

- [x] Create `utils/allocation.ts` — calculate5030020(), buildNodeTree(), validateChildAllocation(), computeRemainingBudget(), formatCurrency() (₹ en-IN)
- [x] Create `services/budgetService.ts` — income CRUD, budget node CRUD, reorderBudgetNodes(), syncRootAllocations()
- [x] Create `hooks/useBudget.ts` — income + nodes loaded in parallel, allocation/nodeTree/remainingBudget as memos, optimistic reorder with rollback
- [x] Create `components/budget/BudgetNodeCard.tsx` — stats (allocated/spent/remaining), progress bar with colour thresholds, recursive children
- [x] Create `components/budget/BudgetNodeForm.tsx` — name + amount + icon picker + colour picker, max allocation validation
- [x] Create `components/budget/BudgetNodeList.tsx` — renders full node tree, inline add-child form
- [x] Create `components/budget/IncomeInput.tsx` — display/edit toggle, live 50/30/20 preview as user types
- [x] Create `components/budget/AllocationSummary.tsx` — 3 bucket cards + overall spending bar + remaining budget
- [x] Validate: children total cannot exceed parent allocation (client + DB trigger)
- [x] Dynamic recalculation on income change via syncRootAllocations()

**Status: ✅ Complete**

---

## Phase 6 — Expense Tracking

- [x] Create `services/transactionService.ts` — getTransactions (paginated+filtered), getAllTransactions, createTransaction, updateTransaction, deleteTransaction, getRecentTransactions
- [x] Create `hooks/useTransactions.ts` — allTransactions + filteredTransactions, client-side search/category/date filter via useMemo, useTransition for non-blocking updates, optimistic delete with rollback
- [x] Create `components/transactions/TransactionForm.tsx` — title + amount + date + category picker (indented tree) + textarea note, add & edit modes
- [x] Create `components/transactions/TransactionList.tsx` — filter bar (search + category + dateFrom + dateTo + clear), inline add/edit forms, filtered count footer
- [x] Create `components/transactions/TransactionItem.tsx` — colour dot, expandable note, hover-reveal edit + delete
- [x] Expenses automatically reduce remaining allocation (via useBudget receiving allTransactions)
- [x] Notes support per transaction (no character limit, textarea with expand-to-read)

**Status: ✅ Complete**

---

## Phase 7 — Dashboard

- [x] Create `components/dashboard/StatCard.tsx` — reusable label/value/icon card with accent colour support
- [x] Create `components/dashboard/RecentTransactions.tsx` — last 5 expenses widget with category dot + "View all" link
- [x] Current income display — `IncomeInput` on dashboard, editable inline
- [x] 50/30/20 allocation summary — `AllocationSummary` with 3 bucket cards + overall progress bar
- [x] Remaining budget — shown in AllocationSummary + stat cards
- [x] Recent expenses — `RecentTransactions` widget showing last 5
- [x] Budget usage (progress/percent) — per-node and overall progress bars
- [x] Full `app/(dashboard)/dashboard/page.tsx` — greeting, quick-add expense, all sections wired together
- [x] Create `app/(dashboard)/transactions/page.tsx` — full expense history page with filter bar

**Status: ✅ Complete**

---

## Phase 8 — Review

- [x] Security review — RLS on all 4 tables, `getUser()` (not `getSession()`) for server-side auth validation, middleware guards both server + client side, `NEXT_PUBLIC_` env vars only expose the anon key (safe by design), no secrets logged or exposed
- [x] TypeScript strict mode — zero `any` usage across all files, all types derived from `Database` schema, `ServiceResult<T>` discriminated union used consistently
- [x] Edge case handling — `mounted` flag in `AuthContext` prevents `setState` after unmount, optimistic delete/reorder reverts on DB failure, `isLoading` guards prevent premature renders, `maybeSingle()` used for nullable income fetch
- [x] Performance review — `useMemo` on `allocation`/`nodeTree`/`remainingBudget`, `useTransition` on filter changes (non-blocking), `Promise.all` for parallel data loading, no unnecessary re-renders
- [x] Fix: removed unused `Metadata` import from `transactions/page.tsx` (client component)
- [x] Fix: replaced `Parameters<typeof tx.addTransaction>[0]` cast with explicit `TransactionInsert` import in `dashboard/page.tsx`

**Status: ✅ Complete**

---

## Notes

- Indian Rupee (`en-IN`) locale used throughout for all currency formatting
- `syncRootAllocations()` matches root nodes by title ("Needs", "Wants", "Investments") — renaming root nodes in the DB will break auto-sync; document this constraint for future maintainers
- Email confirmation is handled gracefully in `SignupForm` — works whether Supabase has it enabled or disabled
- `000_full_migration.sql` is the single file to run; individual numbered files are for reference only

# FINET — Project Summary

## What is FINET?

FINET is a personal finance management web app built with Next.js 16, React 19, TypeScript, Supabase, and Tailwind CSS v4. It helps users track income, plan budgets using the 50/30/20 rule, log expenses, and discuss financial habits with a community.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 |
| Backend / Auth / DB | Supabase (PostgreSQL + Auth + RLS) |
| Supabase Client | `@supabase/supabase-js` + `@supabase/ssr` |
| Locale | Indian Rupee (`en-IN`) |

---

## Project Structure

```
Finet/
├── app/
│   ├── (auth)/            # Login & Signup pages
│   ├── (dashboard)/       # Protected app pages
│   │   ├── dashboard/     # Main dashboard
│   │   ├── transactions/  # Full expense history
│   │   └── community/     # Community feed + user profiles
│   ├── layout.tsx         # Root layout with AuthProvider
│   └── page.tsx           # Root redirect (→ /dashboard or /login)
├── components/
│   ├── auth/              # LoginForm, SignupForm
│   ├── budget/            # BudgetNodeCard, BudgetNodeForm, IncomeInput, AllocationSummary
│   ├── transactions/      # TransactionForm, TransactionList, TransactionItem
│   ├── dashboard/         # StatCard, RecentTransactions
│   ├── community/         # CommunityFeed, CommunityPost, CreatePost, VoteButtons, CommentSection, FeedFilters, LabelBadge
│   └── ui/                # LoadingSpinner, ErrorMessage
├── contexts/
│   └── AuthContext.tsx    # Global auth state (user, profile, isAuthenticated, signOut)
├── hooks/
│   ├── useBudget.ts       # Income + budget nodes, allocation memos, optimistic reorder
│   ├── useTransactions.ts # Transactions with client-side filters + optimistic delete
│   ├── useCommunityFeed.ts# Feed pagination, optimistic votes/posts
│   └── useComments.ts     # Comments for a single post, optimistic add/remove
├── services/
│   ├── authService.ts     # signUp, signIn, signOut, getCurrentUser
│   ├── profileService.ts  # getProfile, createProfile, updateProfile, upsertProfile
│   ├── budgetService.ts   # income CRUD, budget node CRUD, reorderBudgetNodes, syncRootAllocations
│   ├── transactionService.ts # getTransactions (paginated+filtered), createTransaction, updateTransaction, deleteTransaction, getRecentTransactions
│   └── community/
│       ├── postService.ts    # getFeedPosts, createPost, softDeletePost, getUserPosts, getPublicProfile, getAuthorStats
│       ├── voteService.ts    # upsertVote, removeVote, getUserVotes
│       └── commentService.ts # getComments, createComment, deleteComment
├── lib/supabase/
│   ├── client.ts          # Browser Supabase client
│   ├── server.ts          # Server-side Supabase client
│   └── middleware.ts      # Session refresh helper
├── supabase/migrations/   # SQL migrations (see Database section)
└── utils/
    └── allocation.ts      # calculate503020(), buildNodeTree(), formatCurrency(), etc.
```

---

## Features

### 1. Authentication
- Email + password sign up and sign in via Supabase Auth
- On signup, a profile row and three default budget nodes (Needs / Wants / Investments) are auto-seeded by a Postgres trigger
- Middleware guards all dashboard routes — unauthenticated users are redirected to `/login`
- Server-side auth uses `getUser()` (token-validated), not `getSession()` (cache-only)

### 2. Budget Engine (50/30/20)
- Users enter their monthly income; the app auto-splits it into Needs (50%), Wants (30%), Investments (20%)
- Budget nodes form a tree: root nodes are the three buckets; users can add custom sub-categories under each
- Each node tracks allocated amount, spent amount (sum of linked transactions), and remaining amount
- A DB trigger (`check_children_allocation`) and client-side validation both enforce that children never exceed the parent's allocation
- `syncRootAllocations()` recalculates root node amounts whenever income changes

### 3. Expense Tracking
- Users log expenses with a title, amount, date, category (any budget node), and optional notes
- The transactions page supports filtering by search text, category, and date range
- Expenses automatically reduce the remaining allocation of their linked budget node
- Optimistic delete with rollback on failure

### 4. Dashboard
- Greeting with user's name
- Inline income editor with live 50/30/20 preview
- AllocationSummary — three bucket cards + overall spending progress bar
- Budget node tree with per-node progress bars and colour thresholds
- Recent Transactions widget (last 5 expenses)
- Quick-add expense form

### 5. Community
- Feed of short posts (max 280 chars) labelled by topic (e.g. Budgeting, Investing, Savings)
- Upvote / downvote per post; same-vote click removes the vote, opposite vote swaps it
- Comment section per post (max 1000 chars); optimistic add and remove
- Soft delete for posts (`deleted_at` field; all feed queries filter it out)
- Infinite scroll via `IntersectionObserver`
- Filter by label or search text
- Public user profile pages showing stats (total posts, total upvotes) and post history

---

## Database Schema

| Table | Purpose |
|---|---|
| `profiles` | One row per user — `id` (FK → `auth.users`), `full_name`, `email` |
| `income` | Monthly income records per user |
| `budget_nodes` | Self-referencing tree — root nodes are 50/30/20 buckets; children are sub-categories |
| `transactions` | Expense records linked to a budget node |
| `community_posts` | Short posts with soft delete (`deleted_at`) |
| `community_votes` | 1 or -1 per user per post (UNIQUE constraint) |
| `community_comments` | Comments on posts; `parent_comment_id` reserved for future nesting |

Row Level Security is enabled on every table — users can only read and write their own data. Community posts and comments are readable by all authenticated users.

---

## Security

- RLS enforced at the Postgres level on all tables
- Server components call `getUser()` (not `getSession()`) to validate the JWT with Supabase on every request
- Middleware refreshes sessions and redirects unauthenticated requests before they reach any page
- Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are exposed to the browser (safe by Supabase design)
- No secrets are logged or exposed in responses
- Profiles public-read policy exposes only `id` and `full_name` — never email

---

## Data Flow

```
User Action
    │
    ▼
React Component
    │  calls
    ▼
Custom Hook  (useBudget / useTransactions / useCommunityFeed)
    │  optimistic update → then
    ▼
Service Function  (budgetService / transactionService / postService …)
    │  Supabase client call
    ▼
Supabase PostgreSQL
    │  RLS check + optional DB trigger
    ▼
Result returned → Hook updates state (or rolls back on error)
```

---

## Running the Project

```bash
npm install
# Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
# Run 000_full_migration.sql in the Supabase SQL Editor
npm run dev        # http://localhost:3000
npm run build      # Production build
npm run lint       # ESLint check
```

---

## Key Design Decisions

- **50/30/20 auto-sync** — root nodes are matched by title ("Needs", "Wants", "Investments"). Renaming them in the DB will break `syncRootAllocations()`.
- **Tree built in the hook** — `budget_nodes` is stored as a flat list; `buildNodeTree()` in `utils/allocation.ts` assembles the tree client-side.
- **Optimistic UI everywhere** — votes, posts, comments, transactions, and node reordering all update the UI immediately and revert if the server call fails.
- **`useTransition` for filters** — filter state changes are wrapped in `useTransition` so heavy re-renders don't block typing.
- **Labels as text** — community labels are stored as plain text (not a Postgres enum), so adding a new label only requires editing `COMMUNITY_LABELS` in `types/index.ts` — no migration needed.
- **Indian Rupee locale** — all currency formatting uses `Intl.NumberFormat` with `en-IN` locale and `INR` currency.

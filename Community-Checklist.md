# FINET Community Feature — Checklist

> Auto-updated after each phase. Check before proceeding.

---

## Phase A — Database Migration + Types

- [x] Create `supabase/migrations/005_community.sql`
  - [x] `community_posts` table (content max 280, soft delete via deleted_at)
  - [x] `community_votes` table (1/-1, UNIQUE post_id+user_id)
  - [x] `community_comments` table (parent_comment_id nullable for future nesting)
  - [x] Indexes (author_id, created_at, label, deleted_at partial)
  - [x] RLS: posts — everyone reads live, owner writes/soft-deletes
  - [x] RLS: votes — authenticated read/write own vote
  - [x] RLS: comments — everyone reads, authenticated creates, owner edits/deletes
  - [x] Add public profile read policy (id + full_name only, not email)
  - [x] Reuse existing `set_updated_at()` trigger function
- [x] Extend `types/database.ts` with 3 new table interfaces
- [x] Extend `types/index.ts` with community types + `COMMUNITY_LABELS` constant

**Status: ✅ Complete**

---

## Phase B — Services

- [x] Create `services/community/postService.ts`
  - [x] `getFeedPosts()` — paginated, label filter, search, deleted_at IS NULL
  - [x] `createPost()`
  - [x] `softDeletePost()`
  - [x] `getUserPosts()` — for profile page
  - [x] `getAuthorStats()` — totalPosts + totalUpvotes
- [x] Create `services/community/voteService.ts`
  - [x] `upsertVote()` — ON CONFLICT update
  - [x] `removeVote()` — delete own vote
  - [x] `getUserVotes()` — all votes by current user
- [x] Create `services/community/commentService.ts`
  - [x] `getComments()` — first-level, joined author profile
  - [x] `createComment()`
  - [x] `deleteComment()`

**Status: ✅ Complete**

---

## Phase C — Hooks

- [x] Create `hooks/useCommunityFeed.ts`
  - [x] Feed state + pagination with offsetRef
  - [x] Label filter + search via useTransition
  - [x] loadMore for infinite scroll
  - [x] Optimistic vote toggle (same vote removes, different vote swaps)
  - [x] Optimistic addPost / deletePost with revert
- [x] Create `hooks/useComments.ts`
  - [x] Comments for a single post
  - [x] Optimistic addComment (placeholder replaced by real data)
  - [x] Optimistic removeComment with revert

**Status: ✅ Complete**

---

## Phase D — Components

- [x] Create `components/community/LabelBadge.tsx` — colour from COMMUNITY_LABELS, optional onClick
- [x] Create `components/community/VoteButtons.tsx` — up/down with score, green/red active state
- [x] Create `components/community/CommunityPost.tsx` — avatar, timeAgo, vote, comment toggle, delete own
- [x] Create `components/community/CreatePost.tsx` — collapsible, 280-char counter, label picker
- [x] Create `components/community/CommentSection.tsx` — list + add form, optimistic, 1000-char limit
- [x] Create `components/community/FeedFilters.tsx` — search + label pills + clear
- [x] Create `components/community/CommunityFeed.tsx` — IntersectionObserver infinite scroll

**Status: ✅ Complete**

---

## Phase E — Pages + Navigation

- [x] Create `app/(dashboard)/community/page.tsx` — feed page wiring CreatePost + FeedFilters + CommunityFeed
- [x] Create `app/(dashboard)/community/user/[id]/page.tsx` — profile card + stats + posts list
- [x] Update `app/(dashboard)/layout.tsx` — Dashboard / Expenses / Community nav links with active state

**Status: ✅ Complete**

---

## Notes

- Labels stored as `text` (not enum) — extensible by editing `COMMUNITY_LABELS` in `types/index.ts`, no migration needed
- Soft delete: `deleted_at` nullable, all feed queries filter `deleted_at IS NULL`
- Vote score aggregated at query time via joined rows in `getFeedPosts`
- `profiles` public read policy added (id + full_name only, email never exposed)
- `/community` is automatically protected by existing middleware (not in PUBLIC_ROUTES)
- Schema is future-ready: `parent_comment_id` on comments, `share` button placeholder in post card

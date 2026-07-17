import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Database } from './database'

// ─── Re-export Supabase User ────────────────────────────────────────────────
export type { SupabaseUser }

// ─── Database row helpers ───────────────────────────────────────────────────
type Tables = Database['public']['Tables']

// ─── Profile ────────────────────────────────────────────────────────────────
export type Profile = Tables['profiles']['Row']
export type ProfileInsert = Tables['profiles']['Insert']
export type ProfileUpdate = Tables['profiles']['Update']

// ─── Income ─────────────────────────────────────────────────────────────────
export type Income = Tables['income']['Row']
export type IncomeInsert = Tables['income']['Insert']
export type IncomeUpdate = Tables['income']['Update']

// ─── Budget Node ─────────────────────────────────────────────────────────────
export type BudgetNode = Tables['budget_nodes']['Row']
export type BudgetNodeInsert = Tables['budget_nodes']['Insert']
export type BudgetNodeUpdate = Tables['budget_nodes']['Update']

/**
 * A BudgetNode enriched with runtime-computed allocation figures.
 * These are never stored — they are derived from transactions each render.
 */
export interface BudgetNodeWithStats extends BudgetNode {
  spent_amount: number
  remaining_amount: number
  percent_used: number
  children: BudgetNodeWithStats[]
}

// ─── Transaction ─────────────────────────────────────────────────────────────
export type Transaction = Tables['transactions']['Row']
export type TransactionInsert = Tables['transactions']['Insert']
export type TransactionUpdate = Tables['transactions']['Update']

// ─── 50/30/20 Allocation ─────────────────────────────────────────────────────
export interface Allocation {
  income: number
  needs: number        // 50%
  wants: number        // 30%
  investments: number  // 20%
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthState {
  user: SupabaseUser | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
}

// ─── Form inputs ─────────────────────────────────────────────────────────────
export interface LoginFormValues {
  email: string
  password: string
}

export interface SignupFormValues {
  full_name: string
  email: string
  password: string
  confirmPassword: string
}

// ─── Generic service result wrapper ──────────────────────────────────────────
export type ServiceResult<T> =
  | { data: T; error: null }
  | { data: null; error: string }

// ════════════════════════════════════════════════════════════
// COMMUNITY
// ════════════════════════════════════════════════════════════

// ─── Community Labels ─────────────────────────────────────────────────────────
// Single source of truth — add new labels here only, no DB migration needed.

export interface CommunityLabel {
  value: string
  color: string       // tailwind bg class
  textColor: string   // tailwind text class
}

export const COMMUNITY_LABELS: CommunityLabel[] = [
  { value: 'Discussion',    color: 'bg-zinc-100 dark:bg-zinc-800',       textColor: 'text-zinc-700 dark:text-zinc-300' },
  { value: 'Question',      color: 'bg-blue-100 dark:bg-blue-950',       textColor: 'text-blue-700 dark:text-blue-300' },
  { value: 'Success Story', color: 'bg-emerald-100 dark:bg-emerald-950', textColor: 'text-emerald-700 dark:text-emerald-300' },
  { value: 'Tip',           color: 'bg-amber-100 dark:bg-amber-950',     textColor: 'text-amber-700 dark:text-amber-300' },
  { value: 'Investment',    color: 'bg-violet-100 dark:bg-violet-950',   textColor: 'text-violet-700 dark:text-violet-300' },
  { value: 'Budget',        color: 'bg-orange-100 dark:bg-orange-950',   textColor: 'text-orange-700 dark:text-orange-300' },
  { value: 'Saving',        color: 'bg-teal-100 dark:bg-teal-950',       textColor: 'text-teal-700 dark:text-teal-300' },
  { value: 'Debt',          color: 'bg-red-100 dark:bg-red-950',         textColor: 'text-red-700 dark:text-red-300' },
  { value: 'Tax',           color: 'bg-pink-100 dark:bg-pink-950',       textColor: 'text-pink-700 dark:text-pink-300' },
  { value: 'Beginner',      color: 'bg-sky-100 dark:bg-sky-950',         textColor: 'text-sky-700 dark:text-sky-300' },
]

// ─── Community Post ───────────────────────────────────────────────────────────
export type CommunityPost = Tables['community_posts']['Row']
export type CommunityPostInsert = Tables['community_posts']['Insert']
export type CommunityPostUpdate = Tables['community_posts']['Update']

/** Post enriched with author profile, vote counts, and comment count */
export interface CommunityPostWithMeta extends CommunityPost {
  author: Pick<Profile, 'id' | 'full_name'>
  upvotes: number
  downvotes: number
  score: number             // upvotes - downvotes
  comment_count: number
  user_vote: 1 | -1 | null  // current user's vote, null if none / unauthenticated
}

// ─── Community Vote ───────────────────────────────────────────────────────────
export type CommunityVote = Tables['community_votes']['Row']
export type CommunityVoteInsert = Tables['community_votes']['Insert']
export type CommunityVoteUpdate = Tables['community_votes']['Update']

// ─── Community Comment ────────────────────────────────────────────────────────
export type CommunityComment = Tables['community_comments']['Row']
export type CommunityCommentInsert = Tables['community_comments']['Insert']
export type CommunityCommentUpdate = Tables['community_comments']['Update']

/** Comment enriched with author display name */
export interface CommunityCommentWithAuthor extends CommunityComment {
  author: Pick<Profile, 'id' | 'full_name'>
}

// ─── Feed filter state ────────────────────────────────────────────────────────
export interface CommunityFeedFilters {
  label: string | null   // null = all labels
  search: string         // '' = no search
  sort: 'newest'         // 'trending' is a future placeholder
}

// ════════════════════════════════════════════════════════════
// EXPERT CONSULTATION
// ════════════════════════════════════════════════════════════

// ─── Enums (mirror DB enums) ──────────────────────────────────────────────────
export type BookingStatus = 'confirmed' | 'completed' | 'cancelled'
export type SessionType = 'chat' | 'video'
export type SessionStatus = 'waiting' | 'active' | 'ended'

// ─── Expert Profile ───────────────────────────────────────────────────────────
export type ExpertProfile = Tables['expert_profiles']['Row']
export type ExpertProfileInsert = Tables['expert_profiles']['Insert']
export type ExpertProfileUpdate = Tables['expert_profiles']['Update']

/**
 * Expert profile enriched with computed review stats.
 * avg_rating and review_count are derived at query time — never stored.
 */
export interface ExpertProfileWithStats extends ExpertProfile {
  avg_rating: number | null   // null if no reviews yet
  review_count: number
}

// ─── Expert Availability ──────────────────────────────────────────────────────
export type ExpertAvailability = Tables['expert_availability']['Row']
export type ExpertAvailabilityInsert = Tables['expert_availability']['Insert']
export type ExpertAvailabilityUpdate = Tables['expert_availability']['Update']

// ─── Appointment ──────────────────────────────────────────────────────────────
export type Appointment = Tables['appointments']['Row']
export type AppointmentInsert = Tables['appointments']['Insert']
export type AppointmentUpdate = Tables['appointments']['Update']

/**
 * Appointment enriched with expert profile and session (if started).
 * Used in the appointment dashboard and session views.
 */
export interface AppointmentWithDetails extends Appointment {
  expert: Pick<ExpertProfile, 'id' | 'full_name' | 'avatar_url' | 'specializations' | 'fee_per_session' | 'currency'>
  session: ConsultationSession | null
  review: ConsultationReview | null
}

// ─── Consultation Session ──────────────────────────────────────────────────────
export type ConsultationSession = Tables['consultation_sessions']['Row']
export type ConsultationSessionInsert = Tables['consultation_sessions']['Insert']
export type ConsultationSessionUpdate = Tables['consultation_sessions']['Update']

// ─── Consultation Review ──────────────────────────────────────────────────────
export type ConsultationReview = Tables['consultation_reviews']['Row']
export type ConsultationReviewInsert = Tables['consultation_reviews']['Insert']
export type ConsultationReviewUpdate = Tables['consultation_reviews']['Update']

/**
 * Review enriched with reviewer display name — shown on expert profiles.
 */
export interface ConsultationReviewWithReviewer extends ConsultationReview {
  reviewer: Pick<Profile, 'id' | 'full_name'>
}

// ─── Expert listing filters ───────────────────────────────────────────────────
export interface ExpertListingFilters {
  specialization: string | null   // null = all specializations
  search: string                  // '' = no search
}

// ─── Chat Message ─────────────────────────────────────────────────────────────
export type ChatMessage = Tables['chat_messages']['Row']
export type ChatMessageInsert = Tables['chat_messages']['Insert']

// ════════════════════════════════════════════════════════════
// NEWS
// ════════════════════════════════════════════════════════════

/** A single article normalised from newsdata.io */
export interface NewsArticle {
  id: string
  title: string
  url: string
  description: string | null
  content: string | null
  image: string | null
  published_at: string | null
  source: string | null
  category: string[] | null
  author: string | null
}

/** Filter state for the news feed */
export interface NewsFeedFilters {
  category: string    // '' = all
  search: string      // '' = no search
}

/** Available categories supported by newsdata.io */
export const NEWS_CATEGORIES = [
  { value: '',              label: 'Top' },
  { value: 'business',      label: 'Business' },
  { value: 'technology',    label: 'Technology' },
  { value: 'politics',      label: 'Politics' },
  { value: 'sports',        label: 'Sports' },
  { value: 'entertainment', label: 'Entertainment' },
] as const

export type NewsCategoryValue = typeof NEWS_CATEGORIES[number]['value']

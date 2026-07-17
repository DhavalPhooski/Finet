import { createClient } from '@/lib/supabase/client'
import type {
  ExpertProfile,
  ExpertProfileWithStats,
  ExpertAvailability,
  Appointment,
  AppointmentInsert,
  AppointmentWithDetails,
  ConsultationReviewWithReviewer,
  ConsultationSession,
  ConsultationReview,
  ServiceResult,
  ExpertListingFilters,
} from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

export const EXPERTS_PAGE_SIZE = 12

// ─── Raw row shapes ───────────────────────────────────────────────────────────
// Supabase cannot infer joined shapes without full Relationships declarations,
// so we cast joined query results to these local interfaces.

interface ExpertWithReviewsRow extends ExpertProfile {
  consultation_reviews: { rating: number }[] | null
}

interface AppointmentRow extends Appointment {
  expert: Pick<ExpertProfile, 'id' | 'full_name' | 'avatar_url' | 'specializations' | 'fee_per_session' | 'currency'> | null
  session: ConsultationSession | null
  review: ConsultationReview | null
}

interface ReviewWithReviewerRow extends ConsultationReview {
  reviewer: { id: string; full_name: string | null } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeExpertStats(
  reviews: { rating: number }[] | null
): Pick<ExpertProfileWithStats, 'avg_rating' | 'review_count'> {
  const list = reviews ?? []
  if (list.length === 0) return { avg_rating: null, review_count: 0 }
  const sum = list.reduce((acc, r) => acc + r.rating, 0)
  return {
    avg_rating: Math.round((sum / list.length) * 10) / 10,
    review_count: list.length,
  }
}

function mapExpertRow(row: ExpertWithReviewsRow): ExpertProfileWithStats {
  const { consultation_reviews, ...expert } = row
  return {
    ...expert,
    ...computeExpertStats(consultation_reviews),
  }
}

// ════════════════════════════════════════════════════════════
// EXPERT LISTING
// ════════════════════════════════════════════════════════════

/**
 * Fetch a paginated list of verified, active experts.
 * Each expert includes their average rating and review count,
 * computed from joined consultation_reviews rows.
 */
export async function getExperts(
  filters: ExpertListingFilters = { specialization: null, search: '' },
  options: { limit?: number; offset?: number } = {}
): Promise<ServiceResult<{ experts: ExpertProfileWithStats[]; hasMore: boolean }>> {
  const supabase = createClient()
  const limit = options.limit ?? EXPERTS_PAGE_SIZE
  const offset = options.offset ?? 0

  let query = supabase
    .from('expert_profiles')
    .select('*, consultation_reviews(rating)')
    .eq('is_verified', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit)

  if (filters.search.trim()) {
    const term = filters.search.trim()
    query = query.or(`full_name.ilike.%${term}%,bio.ilike.%${term}%`)
  }

  if (filters.specialization) {
    // Postgres array contains operator: specializations @> '{value}'
    query = query.contains('specializations', [filters.specialization])
  }

  const { data, error } = await query

  if (error) return { data: null, error: error.message }

  const raw = (data ?? []) as unknown as ExpertWithReviewsRow[]
  const hasMore = raw.length > limit
  const experts = raw.slice(0, limit).map(mapExpertRow)

  return { data: { experts, hasMore }, error: null }
}

/**
 * Fetch a single expert profile by ID with avg rating and review count.
 */
export async function getExpertById(
  expertId: string
): Promise<ServiceResult<ExpertProfileWithStats>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('expert_profiles')
    .select('*, consultation_reviews(rating)')
    .eq('id', expertId)
    .eq('is_verified', true)
    .eq('is_active', true)
    .single()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Expert not found.' }

  const row = data as unknown as ExpertWithReviewsRow
  return { data: mapExpertRow(row), error: null }
}

// ════════════════════════════════════════════════════════════
// AVAILABILITY
// ════════════════════════════════════════════════════════════

/**
 * Fetch all unbooked future availability slots for a given expert,
 * ordered by slot_start ascending so the earliest slots appear first.
 */
export async function getExpertAvailability(
  expertId: string
): Promise<ServiceResult<ExpertAvailability[]>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('expert_availability')
    .select('*')
    .eq('expert_id', expertId)
    .eq('is_booked', false)
    .gte('slot_start', new Date().toISOString())
    .order('slot_start', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

// ════════════════════════════════════════════════════════════
// BOOKING
// ════════════════════════════════════════════════════════════

/**
 * Book an available slot for the current user.
 *
 * Dev phase: every booking is immediately set to 'confirmed'.
 *
 * Payment extensibility: when payments are introduced, the
 * calling service will pass booking_status = 'pending_payment'
 * here, then flip it to 'confirmed' after payment succeeds.
 * No changes to this function's signature are needed.
 */
export async function bookAppointment(
  payload: Omit<AppointmentInsert, 'booking_status'>
): Promise<ServiceResult<Appointment>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      ...payload,
      booking_status: 'confirmed', // auto-confirm in dev phase
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Failed to book appointment.' }

  return { data, error: null }
}

/**
 * Cancel an existing appointment owned by the current user.
 * The DB trigger automatically frees the availability slot.
 */
export async function cancelAppointment(
  appointmentId: string
): Promise<ServiceResult<Appointment>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('appointments')
    .update({ booking_status: 'cancelled' })
    .eq('id', appointmentId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Failed to cancel appointment.' }

  return { data, error: null }
}

// ════════════════════════════════════════════════════════════
// APPOINTMENT DASHBOARD
// ════════════════════════════════════════════════════════════

/**
 * Fetch all appointments for the current user, enriched with
 * expert profile, consultation session, and review (if any).
 * Ordered by slot_start descending (most recent first).
 */
export async function getUserAppointments(
  userId: string
): Promise<ServiceResult<AppointmentWithDetails[]>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('appointments')
    .select(
      `
      *,
      expert:expert_profiles!appointments_expert_id_fkey(
        id, full_name, avatar_url, specializations, fee_per_session, currency
      ),
      session:consultation_sessions(
        id, appointment_id, session_type, status, room_id,
        provider_name, started_at, ended_at, created_at, updated_at
      ),
      review:consultation_reviews(
        id, appointment_id, expert_id, reviewer_id,
        rating, review_text, created_at, updated_at
      )
      `
    )
    .eq('user_id', userId)
    .order('slot_start', { ascending: false })

  if (error) return { data: null, error: error.message }

  const raw = (data ?? []) as unknown as AppointmentRow[]
  const appointments: AppointmentWithDetails[] = raw.map((row) => ({
    ...row,
    expert: row.expert ?? {
      id: row.expert_id,
      full_name: 'Unknown Expert',
      avatar_url: null,
      specializations: [],
      fee_per_session: 0,
      currency: 'INR',
    },
    // Supabase returns one-to-one relations as an array — unwrap to single or null
    session: Array.isArray(row.session)
      ? (row.session[0] ?? null)
      : (row.session ?? null),
    review: Array.isArray(row.review)
      ? (row.review[0] ?? null)
      : (row.review ?? null),
  }))

  return { data: appointments, error: null }
}

/**
 * Fetch a single appointment by ID, enriched with expert, session, and review.
 * Used on the session page and confirmation page.
 */
export async function getAppointmentById(
  appointmentId: string
): Promise<ServiceResult<AppointmentWithDetails>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('appointments')
    .select(
      `
      *,
      expert:expert_profiles!appointments_expert_id_fkey(
        id, full_name, avatar_url, specializations, fee_per_session, currency
      ),
      session:consultation_sessions(
        id, appointment_id, session_type, status, room_id,
        provider_name, started_at, ended_at, created_at, updated_at
      ),
      review:consultation_reviews(
        id, appointment_id, expert_id, reviewer_id,
        rating, review_text, created_at, updated_at
      )
      `
    )
    .eq('id', appointmentId)
    .single()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Appointment not found.' }

  const row = data as unknown as AppointmentRow
  const appointment: AppointmentWithDetails = {
    ...row,
    expert: row.expert ?? {
      id: row.expert_id,
      full_name: 'Unknown Expert',
      avatar_url: null,
      specializations: [],
      fee_per_session: 0,
      currency: 'INR',
    },
    session: Array.isArray(row.session)
      ? (row.session[0] ?? null)
      : (row.session ?? null),
    review: Array.isArray(row.review)
      ? (row.review[0] ?? null)
      : (row.review ?? null),
  }

  return { data: appointment, error: null }
}

// ════════════════════════════════════════════════════════════
// REVIEWS
// ════════════════════════════════════════════════════════════

/**
 * Fetch paginated reviews for an expert, with reviewer display name.
 * Shown on the expert's public profile page.
 */
export async function getExpertReviews(
  expertId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<ServiceResult<{ reviews: ConsultationReviewWithReviewer[]; hasMore: boolean }>> {
  const supabase = createClient()
  const limit = options.limit ?? 10
  const offset = options.offset ?? 0

  const { data, error } = await supabase
    .from('consultation_reviews')
    .select(
      `
      *,
      reviewer:profiles!consultation_reviews_reviewer_id_fkey(id, full_name)
      `
    )
    .eq('expert_id', expertId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit)

  if (error) return { data: null, error: error.message }

  const raw = (data ?? []) as unknown as ReviewWithReviewerRow[]
  const hasMore = raw.length > limit
  const reviews: ConsultationReviewWithReviewer[] = raw
    .slice(0, limit)
    .map((row) => ({
      ...row,
      reviewer: row.reviewer ?? { id: row.reviewer_id, full_name: null },
    }))

  return { data: { reviews, hasMore }, error: null }
}

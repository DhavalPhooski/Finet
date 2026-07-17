import { createClient } from '@/lib/supabase/client'
import type {
  ConsultationReview,
  ConsultationReviewInsert,
  ConsultationReviewUpdate,
  ServiceResult,
} from '@/types'

/**
 * Review service — create and update post-session reviews.
 * Reviews are tied to appointments (one per appointment, enforced by DB UNIQUE).
 */

// ─── Create review ────────────────────────────────────────────────────────────

export async function createReview(
  payload: ConsultationReviewInsert
): Promise<ServiceResult<ConsultationReview>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('consultation_reviews')
    .insert(payload)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Failed to submit review.' }
  return { data, error: null }
}

// ─── Update review ────────────────────────────────────────────────────────────

export async function updateReview(
  reviewId: string,
  updates: ConsultationReviewUpdate
): Promise<ServiceResult<ConsultationReview>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('consultation_reviews')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', reviewId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Failed to update review.' }
  return { data, error: null }
}

// ─── Get review for an appointment ───────────────────────────────────────────

export async function getReviewByAppointment(
  appointmentId: string
): Promise<ServiceResult<ConsultationReview | null>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('consultation_reviews')
    .select('*')
    .eq('appointment_id', appointmentId)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

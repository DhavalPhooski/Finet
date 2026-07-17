'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useAppointments } from '@/hooks/useAppointments'
import {
  createReview,
  updateReview,
  getReviewByAppointment,
} from '@/services/reviewService'
import { getAppointmentById } from '@/services/expertService'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import { FullPageLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import type { AppointmentWithDetails, ConsultationReview } from '@/types'

/**
 * /appointments/[id]/review — Post-session review page.
 *
 * Reached via:
 *  - Automatic redirect when the session timer expires (Task 8)
 *  - "Leave a Review" button on AppointmentCard (Task 7)
 *
 * Handles both create (new review) and update (edit existing) in one page.
 */
export default function ReviewPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const { refresh } = useAppointments()

  const appointmentId = Array.isArray(id) ? id[0] : id

  const [appointment, setAppointment] = useState<AppointmentWithDetails | null>(null)
  const [existingReview, setExistingReview] = useState<ConsultationReview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)

  // ── Load appointment + existing review ────────────────────

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setPageError(null)

      const [apptResult, reviewResult] = await Promise.all([
        getAppointmentById(appointmentId),
        getReviewByAppointment(appointmentId),
      ])

      if (apptResult.error || !apptResult.data) {
        setPageError(apptResult.error ?? 'Appointment not found.')
        setIsLoading(false)
        return
      }

      setAppointment(apptResult.data)

      if (reviewResult.data) {
        setExistingReview(reviewResult.data)
      }

      setIsLoading(false)
    }

    load()
  }, [appointmentId])

  // ── Submit handler ─────────────────────────────────────────

  async function handleSubmit(
    rating: number,
    reviewText: string
  ): Promise<string | null> {
    if (!user || !appointment) return 'Something went wrong. Please try again.'

    setIsSubmitting(true)

    let err: string | null = null

    if (existingReview) {
      // Update existing review
      const result = await updateReview(existingReview.id, {
        rating,
        review_text: reviewText || null,
      })
      if (result.error) err = result.error
      else setExistingReview(result.data)
    } else {
      // Create new review
      const result = await createReview({
        appointment_id: appointmentId,
        expert_id: appointment.expert_id,
        reviewer_id: user.id,
        rating,
        review_text: reviewText || null,
      })
      if (result.error) err = result.error
      else setExistingReview(result.data)
    }

    setIsSubmitting(false)

    if (err) return err

    // Refresh appointment list so the review badge updates on the dashboard
    await refresh()
    setSubmitted(true)
    return null
  }

  // ── Guards ─────────────────────────────────────────────────

  if (!user) return null

  if (isLoading) {
    return <FullPageLoader label="Loading…" />
  }

  if (pageError) {
    return (
      <div className="space-y-4">
        <ErrorMessage message={pageError} />
        <Link
          href="/appointments"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Back to appointments
        </Link>
      </div>
    )
  }

  if (!appointment) return null

  const expertName = appointment.expert.full_name

  // ── Success state ──────────────────────────────────────────

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-5xl" aria-hidden="true">⭐</span>
        <h2 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Thank you for your feedback!
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Your review helps others find great financial experts.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/appointments"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            My Appointments
          </Link>
          <Link
            href="/experts"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Browse Experts
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <Link
        href="/appointments"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <ArrowLeftIcon />
        Back to appointments
      </Link>

      {/* Page card */}
      <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="mb-6 text-center">
          <span className="text-3xl" aria-hidden="true">
            {existingReview ? '✏️' : '⭐'}
          </span>
          <h1 className="mt-3 text-xl font-bold text-zinc-900 dark:text-zinc-50">
            {existingReview ? 'Edit your review' : 'Leave a review'}
          </h1>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Session on{' '}
            {new Date(appointment.slot_start).toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>

        <ReviewForm
          expertName={expertName}
          existingRating={existingReview?.rating}
          existingText={existingReview?.review_text ?? ''}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M8.75 2.625L4.375 7l4.375 4.375"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

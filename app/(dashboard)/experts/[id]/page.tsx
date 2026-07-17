'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useExpertProfile } from '@/hooks/useExpertProfile'
import { useAppointments } from '@/hooks/useAppointments'
import { useToast } from '@/contexts/ToastContext'
import { ExpertProfileHeader } from '@/components/experts/ExpertProfileHeader'
import { AvailabilitySlotPicker } from '@/components/experts/AvailabilitySlotPicker'
import { ExpertReviewList } from '@/components/experts/ExpertReviewList'
import { FullPageLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import type { ExpertAvailability } from '@/types'

/**
 * /experts/[id] — Expert profile page.
 * Shows expert info, available slots to book, and past reviews.
 */
export default function ExpertProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()

  const expertId = Array.isArray(id) ? id[0] : id

  const {
    expert,
    availability,
    reviews,
    isLoadingExpert,
    isLoadingAvailability,
    isLoadingReviews,
    isLoadingMoreReviews,
    hasMoreReviews,
    error,
    loadMoreReviews,
    refresh,
  } = useExpertProfile(expertId)

  const { book } = useAppointments()
  const { showToast } = useToast()

  const [isBooking, setIsBooking] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [bookingSuccess, setBookingSuccess] = useState(false)

  // ── Handle slot booking ────────────────────────────────────────

  async function handleBook(slot: ExpertAvailability) {
    if (!user) {
      router.push('/login')
      return
    }

    setIsBooking(true)
    setBookingError(null)

    const err = await book({
      user_id: user.id,
      expert_id: expertId,
      availability_id: slot.id,
      slot_start: slot.slot_start,
      duration_minutes: slot.duration_minutes,
    })

    setIsBooking(false)

    if (err) {
      setBookingError(err)
      showToast(err, 'error')
      return
    }

    setBookingSuccess(true)
    showToast('Appointment confirmed! 🎉', 'success')
    // Refresh availability so the booked slot disappears
    refresh()
  }

  // ── Loading / error states ─────────────────────────────────────

  if (isLoadingExpert) {
    return <FullPageLoader label="Loading expert profile…" />
  }

  if (error && !expert) {
    return (
      <div className="space-y-4">
        <ErrorMessage message={error} />
        <Link
          href="/experts"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <ArrowLeftIcon />
          Back to experts
        </Link>
      </div>
    )
  }

  if (!expert) return null

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/experts"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <ArrowLeftIcon />
        All experts
      </Link>

      {/* Expert profile header */}
      <ExpertProfileHeader expert={expert} />

      {/* Booking success banner */}
      {bookingSuccess && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950">
          <div className="flex items-center gap-2">
            <span className="text-base" aria-hidden="true">✅</span>
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                Appointment confirmed!
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Head to your appointment dashboard to manage it.
              </p>
            </div>
          </div>
          <Link
            href="/appointments"
            className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-800 dark:bg-emerald-500 dark:hover:bg-emerald-400"
          >
            View Dashboard
          </Link>
        </div>
      )}

      {/* Booking error */}
      <ErrorMessage message={bookingError} />

      {/* Availability slot picker */}
      {!bookingSuccess && (
        <AvailabilitySlotPicker
          slots={availability}
          isLoading={isLoadingAvailability}
          onBook={handleBook}
          isBooking={isBooking}
        />
      )}

      {/* Reviews section */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Reviews
          {expert.review_count > 0 && (
            <span className="ml-2 text-sm font-normal text-zinc-400">
              ({expert.review_count})
            </span>
          )}
        </h2>

        <ExpertReviewList
          reviews={reviews}
          isLoading={isLoadingReviews}
          isLoadingMore={isLoadingMoreReviews}
          hasMore={hasMoreReviews}
          onLoadMore={loadMoreReviews}
        />
      </div>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

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

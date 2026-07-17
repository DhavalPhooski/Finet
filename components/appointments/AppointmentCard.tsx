'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useToast } from '@/contexts/ToastContext'
import type { AppointmentWithDetails } from '@/types'

interface AppointmentCardProps {
  appointment: AppointmentWithDetails
  onCancel: (id: string) => Promise<string | null>
}

/**
 * Single appointment card for the dashboard.
 * Shows expert info, slot time, status badge, and context-aware action buttons.
 *
 * Actions:
 *  - Upcoming + time reached → "Start Session" (links to /appointments/[id]/session)
 *  - Upcoming + future → "Cancel"
 *  - Past + no review → "Leave Review" (future task placeholder)
 *  - Completed + reviewed → read-only
 *  - Cancelled → read-only
 */
export function AppointmentCard({ appointment, onCancel }: AppointmentCardProps) {
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const { showToast } = useToast()

  const { expert, booking_status, slot_start, duration_minutes } = appointment

  const slotDate = new Date(slot_start)
  const now = new Date()
  const slotEnd = new Date(slotDate.getTime() + duration_minutes * 60 * 1000)

  // DEV MODE: set to true to make all confirmed appointments immediately startable.
  // Flip to false before deploying to production.
  const DEV_BYPASS_TIME_CHECK = true

  // Session is "startable" from 5 minutes before the slot until it ends.
  // In dev mode the time check is skipped so you can test any booked appointment.
  const canStart =
    booking_status === 'confirmed' &&
    (DEV_BYPASS_TIME_CHECK ||
      (now >= new Date(slotDate.getTime() - 5 * 60 * 1000) && now <= slotEnd))

  const isFuture = booking_status === 'confirmed' && (DEV_BYPASS_TIME_CHECK || slotDate > now)
  const needsReview =
    booking_status === 'completed' && !appointment.review

  const expertInitials = expert.full_name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  async function handleCancel() {
    if (!confirm('Cancel this appointment?')) return
    setIsCancelling(true)
    setCancelError(null)
    const err = await onCancel(appointment.id)
    if (err) {
      setCancelError(err)
      showToast(err, 'error')
      setIsCancelling(false)
    } else {
      showToast('Appointment cancelled.', 'info')
    }
  }

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header — expert info + status badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Expert avatar */}
          {expert.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={expert.avatar_url}
              alt={expert.full_name}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900"
              aria-hidden="true"
            >
              {expertInitials}
            </div>
          )}

          <div className="min-w-0">
            <Link
              href={`/experts/${expert.id}`}
              className="block truncate text-sm font-semibold text-zinc-900 hover:underline dark:text-zinc-50"
            >
              {expert.full_name}
            </Link>
            {expert.specializations.length > 0 && (
              <p className="truncate text-xs text-zinc-400 dark:text-zinc-500">
                {expert.specializations.slice(0, 2).join(' · ')}
              </p>
            )}
          </div>
        </div>

        {/* Status badge */}
        <StatusBadge status={booking_status} />
      </div>

      {/* Slot details */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800">
        <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
          <CalendarIcon />
          <span>
            {slotDate.toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
          <ClockIcon />
          <span>
            {slotDate.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })}
            {' '}· {duration_minutes} min
          </span>
        </div>

        {/* Session type badge if session exists */}
        {appointment.session && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
            {appointment.session.session_type === 'chat' ? (
              <><ChatIcon /> Chat</>
            ) : (
              <><VideoIcon /> Video</>
            )}
          </div>
        )}
      </div>

      {/* Cancel error */}
      {cancelError && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{cancelError}</p>
      )}

      {/* Action buttons */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {/* Start session — visible when slot time is reached */}
        {canStart && (
          <Link
            href={`/appointments/${appointment.id}/session`}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Start Session →
          </Link>
        )}

        {/* Cancel — only for future confirmed appointments */}
        {isFuture && !canStart && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={isCancelling}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 transition hover:bg-red-50 hover:border-red-200 hover:text-red-600 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-red-950 dark:hover:text-red-400"
          >
            {isCancelling ? 'Cancelling…' : 'Cancel Appointment'}
          </button>
        )}

        {/* Leave review placeholder — wired in Task 9 (review task) */}
        {needsReview && (
          <Link
            href={`/appointments/${appointment.id}/review`}
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400 dark:hover:bg-amber-900"
          >
            ✍️ Leave a Review
          </Link>
        )}

        {/* Reviewed indicator */}
        {appointment.review && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <span aria-hidden="true">✓</span>
            <span>Reviewed · {appointment.review.rating}/5</span>
          </div>
        )}
      </div>
    </article>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    confirmed:  'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    completed:  'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    cancelled:  'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  }
  const labels: Record<string, string> = {
    confirmed: '● Confirmed',
    completed: '✓ Completed',
    cancelled: '✕ Cancelled',
  }

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        styles[status] ?? styles.confirmed
      }`}
    >
      {labels[status] ?? status}
    </span>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <rect x="1.5" y="2.5" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1.5 5.5h10M4.5 1.5v2M8.5 1.5v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6.5 4v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M11.5 6.5A4.5 4.5 0 112 8.8L1.75 11l2.1-.3A4.5 4.5 0 0011.5 6.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function VideoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <rect x="1" y="3.5" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9 5.5l3-1.5v5l-3-1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

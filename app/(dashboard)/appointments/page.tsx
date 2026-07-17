'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAppointments } from '@/hooks/useAppointments'
import { AppointmentCard } from '@/components/appointments/AppointmentCard'
import { AppointmentTabs, type AppointmentTab } from '@/components/appointments/AppointmentTabs'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

/**
 * /appointments — Appointment dashboard.
 * Lists all of the user's appointments, tabbed by status.
 */
export default function AppointmentsPage() {
  const {
    upcomingAppointments,
    pastAppointments,
    cancelledAppointments,
    isLoading,
    error,
    cancel,
  } = useAppointments()

  const [activeTab, setActiveTab] = useState<AppointmentTab>('upcoming')

  const tabContent = {
    upcoming:  upcomingAppointments,
    past:      pastAppointments,
    cancelled: cancelledAppointments,
  }

  const visibleAppointments = tabContent[activeTab]

  const emptyMessages: Record<AppointmentTab, { icon: string; text: string; sub: string }> = {
    upcoming: {
      icon: '📅',
      text: 'No upcoming appointments',
      sub: 'Browse our verified experts and book a session.',
    },
    past: {
      icon: '🕐',
      text: 'No past appointments',
      sub: 'Completed sessions will appear here.',
    },
    cancelled: {
      icon: '✕',
      text: 'No cancelled appointments',
      sub: '',
    },
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            My Appointments
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Manage your expert consultation sessions.
          </p>
        </div>

        <Link
          href="/experts"
          className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-700 sm:mt-0 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          <span aria-hidden="true">+</span>
          Book a session
        </Link>
      </div>

      {/* Error */}
      <ErrorMessage message={error} />

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="lg" label="Loading appointments…" />
        </div>
      )}

      {!isLoading && (
        <>
          {/* Tabs */}
          <AppointmentTabs
            active={activeTab}
            counts={{
              upcoming:  upcomingAppointments.length,
              past:      pastAppointments.length,
              cancelled: cancelledAppointments.length,
            }}
            onChange={setActiveTab}
          />

          {/* Appointment list */}
          {visibleAppointments.length === 0 ? (
            <EmptyState
              icon={emptyMessages[activeTab].icon}
              text={emptyMessages[activeTab].text}
              sub={emptyMessages[activeTab].sub}
              showCTA={activeTab === 'upcoming'}
            />
          ) : (
            <div className="space-y-4" role="list" aria-label={`${activeTab} appointments`}>
              {visibleAppointments.map((appt) => (
                <div key={appt.id} role="listitem">
                  <AppointmentCard
                    appointment={appt}
                    onCancel={cancel}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  icon,
  text,
  sub,
  showCTA,
}: {
  icon: string
  text: string
  sub: string
  showCTA: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
      <span className="text-3xl" aria-hidden="true">{icon}</span>
      <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">{text}</p>
      {sub && (
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{sub}</p>
      )}
      {showCTA && (
        <Link
          href="/experts"
          className="mt-5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Browse Experts
        </Link>
      )}
    </div>
  )
}

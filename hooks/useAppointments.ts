'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getUserAppointments,
  bookAppointment,
  cancelAppointment,
} from '@/services/expertService'
import type {
  AppointmentWithDetails,
  AppointmentInsert,
  BookingStatus,
} from '@/types'

// ─── Hook return shape ────────────────────────────────────────────────────────

export interface UseAppointmentsReturn {
  // All appointments
  appointments: AppointmentWithDetails[]

  // Derived subsets for dashboard tabs
  upcomingAppointments: AppointmentWithDetails[]
  pastAppointments: AppointmentWithDetails[]
  cancelledAppointments: AppointmentWithDetails[]

  isLoading: boolean
  error: string | null

  // Actions — return null on success, error string on failure
  book: (payload: Omit<AppointmentInsert, 'booking_status'>) => Promise<string | null>
  cancel: (appointmentId: string) => Promise<string | null>

  // Get a single appointment from local state (avoids a separate fetch)
  getById: (appointmentId: string) => AppointmentWithDetails | undefined

  refresh: () => Promise<void>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAppointments(): UseAppointmentsReturn {
  const { user } = useAuth()

  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Load ───────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError(null)

    const result = await getUserAppointments(user.id)

    if (result.error) {
      setError(result.error)
    } else {
      setAppointments(result.data ?? [])
    }

    setIsLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  // ── Derived lists ──────────────────────────────────────────

  const now = new Date().toISOString()

  const upcomingAppointments = useMemo(
    () =>
      appointments.filter(
        (a) =>
          a.booking_status === 'confirmed' && a.slot_start >= now
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appointments]
  )

  const pastAppointments = useMemo(
    () =>
      appointments.filter(
        (a) =>
          a.booking_status === 'completed' ||
          (a.booking_status === 'confirmed' && a.slot_start < now)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appointments]
  )

  const cancelledAppointments = useMemo(
    () => appointments.filter((a) => a.booking_status === 'cancelled'),
    [appointments]
  )

  // ── Book appointment ────────────────────────────────────────

  const book = useCallback(
    async (
      payload: Omit<AppointmentInsert, 'booking_status'>
    ): Promise<string | null> => {
      const result = await bookAppointment(payload)
      if (result.error) return result.error

      // Reload to get the enriched AppointmentWithDetails shape
      await load()
      return null
    },
    [load]
  )

  // ── Cancel appointment (optimistic) ────────────────────────

  const cancel = useCallback(
    async (appointmentId: string): Promise<string | null> => {
      // Optimistic update
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId
            ? { ...a, booking_status: 'cancelled' as BookingStatus }
            : a
        )
      )

      const result = await cancelAppointment(appointmentId)
      if (result.error) {
        // Revert on failure
        await load()
        return result.error
      }

      return null
    },
    [load]
  )

  // ── Get single from local state ─────────────────────────────

  const getById = useCallback(
    (appointmentId: string) =>
      appointments.find((a) => a.id === appointmentId),
    [appointments]
  )

  return {
    appointments,
    upcomingAppointments,
    pastAppointments,
    cancelledAppointments,
    isLoading,
    error,
    book,
    cancel,
    getById,
    refresh: load,
  }
}

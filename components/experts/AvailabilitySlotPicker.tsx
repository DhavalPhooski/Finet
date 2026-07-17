'use client'

import { useState, useMemo } from 'react'
import type { ExpertAvailability } from '@/types'

interface AvailabilitySlotPickerProps {
  slots: ExpertAvailability[]
  isLoading: boolean
  onBook: (slot: ExpertAvailability) => void
  isBooking: boolean
}

/**
 * Groups available slots by date and lets the user select one.
 * Calls onBook with the selected slot when the user confirms.
 */
export function AvailabilitySlotPicker({
  slots,
  isLoading,
  onBook,
  isBooking,
}: AvailabilitySlotPickerProps) {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)

  // ── Group slots by local date ──────────────────────────────────
  const slotsByDate = useMemo(() => {
    const map = new Map<string, ExpertAvailability[]>()
    for (const slot of slots) {
      const dateKey = new Date(slot.slot_start).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
      if (!map.has(dateKey)) map.set(dateKey, [])
      map.get(dateKey)!.push(slot)
    }
    return map
  }, [slots])

  const selectedSlot = slots.find((s) => s.id === selectedSlotId) ?? null

  function handleConfirm() {
    if (!selectedSlot) return
    onBook(selectedSlot)
  }

  // ── Loading skeleton ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Available Slots
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-24 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
            />
          ))}
        </div>
      </div>
    )
  }

  // ── Empty state ────────────────────────────────────────────────
  if (slots.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Available Slots
        </h2>
        <div className="mt-4 flex flex-col items-center py-6 text-center">
          <span className="text-2xl" aria-hidden="true">📅</span>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            No available slots at the moment.
          </p>
          <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
            Check back later — new slots are added regularly.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Available Slots
      </h2>
      <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
        All sessions are 60 minutes. Select a slot to book.
      </p>

      {/* Slots grouped by date */}
      <div className="mt-4 space-y-5">
        {Array.from(slotsByDate.entries()).map(([dateLabel, dateSlots]) => (
          <div key={dateLabel}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              {dateLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              {dateSlots.map((slot) => {
                const time = new Date(slot.slot_start).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })
                const isSelected = slot.id === selectedSlotId

                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() =>
                      setSelectedSlotId((prev) =>
                        prev === slot.id ? null : slot.id
                      )
                    }
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-400/20 ${
                      isSelected
                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-500'
                    }`}
                    aria-pressed={isSelected}
                  >
                    {time}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Confirm booking CTA */}
      {selectedSlot && (
        <div className="mt-5 flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
          <div>
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Selected
            </p>
            <p className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {new Date(selectedSlot.slot_start).toLocaleString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
              {' '}· 60 min
            </p>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isBooking}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isBooking ? 'Booking…' : 'Book Appointment'}
          </button>
        </div>
      )}
    </div>
  )
}

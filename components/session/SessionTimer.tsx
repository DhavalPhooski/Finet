'use client'

import { useState, useEffect, useCallback } from 'react'

const SESSION_DURATION_SECONDS = 60 * 60 // 60 minutes

interface SessionTimerProps {
  startedAt: string | null   // ISO timestamp — null means not yet started
  onExpire: () => void        // called once when the timer hits 00:00
}

/**
 * Live countdown timer for a 60-minute consultation session.
 * - Calculates remaining time from `startedAt` so it survives page refreshes.
 * - Calls `onExpire` once when time runs out.
 * - Shows a warning colour when under 5 minutes remain.
 */
export function SessionTimer({ startedAt, onExpire }: SessionTimerProps) {
  const getRemaining = useCallback((): number => {
    if (!startedAt) return SESSION_DURATION_SECONDS
    const elapsed = Math.floor(
      (Date.now() - new Date(startedAt).getTime()) / 1000
    )
    return Math.max(0, SESSION_DURATION_SECONDS - elapsed)
  }, [startedAt])

  const [remaining, setRemaining] = useState<number>(getRemaining)
  const [hasExpired, setHasExpired] = useState(false)

  useEffect(() => {
    // Resync when startedAt changes (e.g. session just activated)
    setRemaining(getRemaining())
    setHasExpired(false)
  }, [startedAt, getRemaining])

  useEffect(() => {
    if (hasExpired) return

    const interval = setInterval(() => {
      const r = getRemaining()
      setRemaining(r)

      if (r === 0 && !hasExpired) {
        setHasExpired(true)
        onExpire()
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [getRemaining, hasExpired, onExpire])

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const label = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const isWarning = remaining <= 5 * 60 && remaining > 0
  const isExpiredState = remaining === 0

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-mono font-semibold tabular-nums ${
        isExpiredState
          ? 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'
          : isWarning
          ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
      }`}
      aria-label={isExpiredState ? 'Session ended' : `Time remaining: ${label}`}
      aria-live="off"  // avoid announcing every second
    >
      <ClockIcon isWarning={isWarning && !isExpiredState} />
      {isExpiredState ? 'Session ended' : label}
    </div>
  )
}

function ClockIcon({ isWarning }: { isWarning: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className={isWarning ? 'animate-pulse' : ''}
    >
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M7 4.5V7l1.5 1.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useAppointments } from '@/hooks/useAppointments'
import {
  getSession,
  createSession,
  activateSession,
  endSession,
} from '@/services/sessionService'
import { SessionTypePicker } from '@/components/session/SessionTypePicker'
import { SessionTimer } from '@/components/session/SessionTimer'
import { ChatRoom } from '@/components/session/ChatRoom'
import { VideoRoom } from '@/components/session/VideoRoom'
import { FullPageLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import type { ConsultationSession, SessionType } from '@/types'

/**
 * /appointments/[id]/session — The live consultation session page.
 *
 * Flow:
 *  1. Load appointment + check it belongs to current user.
 *  2. If no session exists → show SessionTypePicker.
 *  3. User picks Chat or Video → createSession() → show room.
 *  4. SessionTimer counts down 60 min → calls endSession() on expire.
 *  5. After session ends → redirect to review page.
 */
export default function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const { user, profile } = useAuth()
  const router = useRouter()

  const appointmentId = Array.isArray(id) ? id[0] : id

  const { getById, refresh } = useAppointments()
  const appointment = getById(appointmentId)

  const [session, setSession] = useState<ConsultationSession | null>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [isEnded, setIsEnded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Load existing session on mount ────────────────────────

  useEffect(() => {
    async function load() {
      setIsLoadingSession(true)
      const result = await getSession(appointmentId)
      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        setSession(result.data)
        if (result.data.status === 'ended') setIsEnded(true)
      }
      setIsLoadingSession(false)
    }
    load()
  }, [appointmentId])

  // ── Activate session when component mounts with a session ──

  useEffect(() => {
    if (!session || session.status !== 'waiting') return

    async function activate() {
      if (!session) return
      const result = await activateSession(session.id)
      if (result.data) setSession(result.data)
    }
    activate()
  }, [session?.id, session?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle session type selection ─────────────────────────

  async function handleSelectType(type: SessionType) {
    setIsCreatingSession(true)
    setError(null)

    const result = await createSession(appointmentId, type)

    if (result.error) {
      setError(result.error)
      setIsCreatingSession(false)
      return
    }

    setSession(result.data)
    setIsCreatingSession(false)
  }

  // ── Handle session expiry ──────────────────────────────────

  const handleExpire = useCallback(async () => {
    if (!session || isEnded) return
    setIsEnded(true)

    await endSession(session.id, appointmentId)
    await refresh()

    // Redirect to review page after a short delay
    setTimeout(() => {
      router.push(`/appointments/${appointmentId}/review`)
    }, 2500)
  }, [session, isEnded, appointmentId, refresh, router])

  // ── Guards ─────────────────────────────────────────────────

  if (!user) return null

  if (isLoadingSession) {
    return <FullPageLoader label="Loading session…" />
  }

  if (!appointment && !isLoadingSession) {
    return (
      <div className="space-y-4">
        <ErrorMessage message="Appointment not found." />
        <Link href="/appointments" className="text-sm text-zinc-500 hover:underline">
          ← Back to appointments
        </Link>
      </div>
    )
  }

  const expertName = appointment?.expert.full_name ?? 'Your Expert'

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/appointments"
            className="text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
            aria-label="Back to appointments"
          >
            ← Back
          </Link>
          <div>
            <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Session with {expertName}
            </h1>
            {session && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 capitalize">
                {session.session_type} session
              </p>
            )}
          </div>
        </div>

        {/* Timer — only shown once session is active */}
        {session && !isLoadingSession && (
          <SessionTimer
            startedAt={session.started_at}
            onExpire={handleExpire}
          />
        )}
      </div>

      {/* Error */}
      <ErrorMessage message={error} />

      {/* Session ended banner */}
      {isEnded && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm dark:border-emerald-800 dark:bg-emerald-950">
          <p className="font-semibold text-emerald-800 dark:text-emerald-300">
            ✅ Session complete!
          </p>
          <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-400">
            Redirecting you to leave a review…
          </p>
        </div>
      )}

      {/* Step 1 — no session yet: pick type */}
      {!session && !isCreatingSession && (
        <SessionTypePicker
          onSelect={handleSelectType}
          isLoading={isCreatingSession}
          expertName={expertName}
        />
      )}

      {isCreatingSession && (
        <div className="flex justify-center py-16">
          <FullPageLoader label="Setting up your session…" />
        </div>
      )}

      {/* Step 2 — session created: show room */}
      {session && !isCreatingSession && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ height: 'calc(100vh - 220px)', minHeight: '480px' }}
        >
          {session.session_type === 'chat' ? (
            <ChatRoom
              session={session}
              currentUserId={user.id}
              currentUserName={profile?.full_name ?? 'You'}
              isEnded={isEnded}
            />
          ) : (
            <VideoRoom
              session={session}
              isEnded={isEnded}
            />
          )}
        </div>
      )}
    </div>
  )
}

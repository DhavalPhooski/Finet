'use client'

import type { ConsultationSession } from '@/types'

interface VideoRoomProps {
  session: ConsultationSession
  isEnded: boolean
}

/**
 * Abstract video room shell.
 *
 * Architecture — provider-swappable design:
 *  This component is the single integration point for video providers.
 *  To add a real provider (Daily, Agora, Jitsi, Stream Video):
 *    1. Install their SDK.
 *    2. Read `session.provider_name` to decide which adapter to use.
 *    3. Pass `session.room_id` as the provider room identifier.
 *    4. Replace the placeholder <div> below with the provider's component.
 *
 *  The rest of the app (session page, timer, session service) never needs
 *  to change — only this file.
 *
 * Current state: renders a placeholder UI so the full session flow works
 * end-to-end before a real provider is integrated.
 */
export function VideoRoom({ session, isEnded }: VideoRoomProps) {
  if (isEnded) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-4xl" aria-hidden="true">📹</span>
        <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Session ended
        </p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          The video call has concluded.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-zinc-200 bg-zinc-900 dark:border-zinc-800">
      {/* Provider mount point ─────────────────────────────────────────────
          Replace everything inside this div with your video provider's
          component. E.g.:
            <DailyProvider url={roomUrl}><DailyVideo /></DailyProvider>
          or
            <AgoraRTCProvider client={client}><VideoCall /></AgoraRTCProvider>
      ─────────────────────────────────────────────────────────────────── */}
      <div
        className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center"
        data-room-id={session.room_id}
        data-provider={session.provider_name ?? 'unset'}
      >
        <span className="text-5xl" aria-hidden="true">📹</span>

        <div>
          <p className="text-sm font-semibold text-zinc-200">
            Video call ready
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Room: <code className="font-mono text-zinc-300">{session.room_id}</code>
          </p>
          {session.provider_name && (
            <p className="mt-0.5 text-xs text-zinc-500">
              Provider: {session.provider_name}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-xs text-zinc-400">
          <p className="font-semibold text-zinc-300 mb-1">Integrate a video provider here</p>
          <p>Daily · Agora · Jitsi · Stream Video</p>
          <p className="mt-1 text-zinc-500">
            See <code>components/session/VideoRoom.tsx</code> for instructions.
          </p>
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-center gap-3 border-t border-zinc-800 p-3">
        <ControlButton label="Mute" icon="🎤" disabled />
        <ControlButton label="Camera" icon="📷" disabled />
        <ControlButton label="End Call" icon="📵" variant="danger" disabled />
      </div>
    </div>
  )
}

function ControlButton({
  label,
  icon,
  variant = 'default',
  disabled,
}: {
  label: string
  icon: string
  variant?: 'default' | 'danger'
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-xs font-medium transition disabled:opacity-40 ${
        variant === 'danger'
          ? 'bg-red-600 text-white hover:bg-red-500'
          : 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600'
      }`}
      aria-label={label}
    >
      <span className="text-lg" aria-hidden="true">{icon}</span>
      {label}
    </button>
  )
}

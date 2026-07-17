'use client'

import type { SessionType } from '@/types'

interface SessionTypePickerProps {
  onSelect: (type: SessionType) => void
  isLoading: boolean
  expertName: string
}

/**
 * Full-screen overlay asking the user to choose Chat or Video.
 * Shown once per appointment — after selection the session is created.
 */
export function SessionTypePicker({
  onSelect,
  isLoading,
  expertName,
}: SessionTypePickerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-4xl" aria-hidden="true">🎯</span>

        <h2 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Start your session
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          with <span className="font-semibold text-zinc-700 dark:text-zinc-300">{expertName}</span>
        </p>
        <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
          Choose how you'd like to connect. The session lasts 60 minutes.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4">
          {/* Chat option */}
          <button
            type="button"
            onClick={() => onSelect('chat')}
            disabled={isLoading}
            className="flex flex-col items-center gap-3 rounded-xl border-2 border-zinc-200 bg-zinc-50 p-6 transition hover:border-zinc-900 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-400 dark:hover:bg-zinc-700"
          >
            <span className="text-3xl" aria-hidden="true">💬</span>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Chat
              </p>
              <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                Text-based, real-time
              </p>
            </div>
          </button>

          {/* Video option */}
          <button
            type="button"
            onClick={() => onSelect('video')}
            disabled={isLoading}
            className="flex flex-col items-center gap-3 rounded-xl border-2 border-zinc-200 bg-zinc-50 p-6 transition hover:border-zinc-900 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-400 dark:hover:bg-zinc-700"
          >
            <span className="text-3xl" aria-hidden="true">📹</span>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Video Call
              </p>
              <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                Face-to-face video
              </p>
            </div>
          </button>
        </div>

        {isLoading && (
          <p className="mt-6 text-xs text-zinc-400 dark:text-zinc-500">
            Setting up your session…
          </p>
        )}
      </div>
    </div>
  )
}

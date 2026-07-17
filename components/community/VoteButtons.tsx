'use client'

import { useState } from 'react'

interface VoteButtonsProps {
  postId: string
  upvotes: number
  downvotes: number
  score: number
  userVote: 1 | -1 | null
  onVote: (postId: string, value: 1 | -1) => Promise<string | null>
  disabled?: boolean
}

/**
 * Up / down vote buttons with live score display.
 * Optimistic updates are handled in useCommunityFeed — this component
 * just fires the callback and shows a transient error if it fails.
 */
export function VoteButtons({
  postId,
  score,
  userVote,
  onVote,
  disabled = false,
}: VoteButtonsProps) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleVote(value: 1 | -1) {
    if (disabled || isPending) return
    setIsPending(true)
    setError(null)
    const err = await onVote(postId, value)
    if (err) setError(err)
    setIsPending(false)
  }

  return (
    <div className="flex items-center gap-1">
      {/* Upvote */}
      <button
        type="button"
        onClick={() => handleVote(1)}
        disabled={disabled || isPending}
        aria-label="Upvote"
        aria-pressed={userVote === 1}
        className={`flex h-7 w-7 items-center justify-center rounded-md transition
          ${
            userVote === 1
              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
              : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'
          }
          disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <UpArrow />
      </button>

      {/* Score */}
      <span
        className={`min-w-[1.5rem] text-center text-sm font-semibold tabular-nums
          ${
            score > 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : score < 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
        aria-label={`Score: ${score}`}
      >
        {score}
      </span>

      {/* Downvote */}
      <button
        type="button"
        onClick={() => handleVote(-1)}
        disabled={disabled || isPending}
        aria-label="Downvote"
        aria-pressed={userVote === -1}
        className={`flex h-7 w-7 items-center justify-center rounded-md transition
          ${
            userVote === -1
              ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'
              : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'
          }
          disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <DownArrow />
      </button>

      {error && (
        <span className="ml-1 text-xs text-red-500 dark:text-red-400">{error}</span>
      )}
    </div>
  )
}

function UpArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 11V3M3 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DownArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 3v8M3 7l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

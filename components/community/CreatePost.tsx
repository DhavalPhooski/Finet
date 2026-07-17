'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { LabelBadge } from './LabelBadge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { COMMUNITY_LABELS } from '@/types'
import type { CommunityPostInsert } from '@/types'

const MAX_LENGTH = 280

interface CreatePostProps {
  onSubmit: (payload: CommunityPostInsert) => Promise<string | null>
}

export function CreatePost({ onSubmit }: CreatePostProps) {
  const { user } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [content, setContent] = useState('')
  const [label, setLabel] = useState(COMMUNITY_LABELS[0].value)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remaining = MAX_LENGTH - content.length
  const isOverLimit = remaining < 0
  const canSubmit = content.trim().length > 0 && !isOverLimit && !isSubmitting

  function handleCancel() {
    setContent('')
    setLabel(COMMUNITY_LABELS[0].value)
    setError(null)
    setIsExpanded(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !canSubmit) return
    setIsSubmitting(true)
    setError(null)

    const payload: CommunityPostInsert = {
      author_id: user.id,
      content: content.trim(),
      label,
    }

    const err = await onSubmit(payload)

    if (err) {
      setError(err)
      setIsSubmitting(false)
    } else {
      handleCancel()
    }
  }

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
          {(user?.email ?? '?').charAt(0).toUpperCase()}
        </div>
        <span className="text-sm text-zinc-400 dark:text-zinc-500">
          Share a financial tip, question, or win…
        </span>
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      aria-label="Create post"
    >
      {/* Content textarea */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share a financial tip, question, or win…"
        rows={4}
        maxLength={MAX_LENGTH + 20}   // allow over-typing, validate on submit
        disabled={isSubmitting}
        autoFocus
        className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:bg-zinc-900"
      />

      {/* Character counter */}
      <div className="mt-1 flex justify-end">
        <span
          className={`text-xs tabular-nums ${
            isOverLimit
              ? 'font-semibold text-red-600 dark:text-red-400'
              : remaining <= 20
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-zinc-400 dark:text-zinc-500'
          }`}
        >
          {remaining}
        </span>
      </div>

      {/* Label picker */}
      <div className="mt-3">
        <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Label
        </p>
        <div className="flex flex-wrap gap-1.5">
          {COMMUNITY_LABELS.map((lbl) => (
            <button
              key={lbl.value}
              type="button"
              onClick={() => setLabel(lbl.value)}
              aria-pressed={label === lbl.value}
              className={`transition ${label === lbl.value ? 'ring-2 ring-offset-1 ring-zinc-400' : 'opacity-60 hover:opacity-100'}`}
            >
              <LabelBadge label={lbl.value} size="md" />
            </button>
          ))}
        </div>
      </div>

      <ErrorMessage message={error} className="mt-3" />

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {isSubmitting ? (
            <><LoadingSpinner size="sm" /><span>Posting…</span></>
          ) : (
            'Post'
          )}
        </button>
      </div>
    </form>
  )
}

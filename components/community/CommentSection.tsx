'use client'

import { useState } from 'react'
import { useComments } from '@/hooks/useComments'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

interface CommentSectionProps {
  postId: string
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { user } = useAuth()
  const { comments, isLoading, error, addComment, removeComment } =
    useComments(postId)

  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setIsSubmitting(true)
    setSubmitError(null)
    const err = await addComment(content)
    if (err) {
      setSubmitError(err)
    } else {
      setContent('')
    }
    setIsSubmitting(false)
  }

  return (
    <div className="flex flex-col gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        {comments.length > 0 ? `${comments.length} comment${comments.length > 1 ? 's' : ''}` : 'Comments'}
      </h3>

      {/* Comment list */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="sm" label="Loading comments…" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : comments.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          No comments yet. Be the first to comment.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              {/* Avatar */}
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                {(comment.author.full_name ?? '?').charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {comment.author.full_name ?? 'Anonymous'}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {timeAgo(comment.created_at)}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>

              {/* Delete own comment */}
              {user?.id === comment.author_id && (
                <button
                  type="button"
                  onClick={() => removeComment(comment.id)}
                  className="mt-0.5 shrink-0 text-xs text-zinc-400 transition hover:text-red-500 dark:hover:text-red-400"
                  aria-label="Delete comment"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Add comment form */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
              {(user.email ?? '?').charAt(0).toUpperCase()}
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add a comment…"
              rows={2}
              maxLength={1000}
              disabled={isSubmitting}
              className="flex-1 resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          <ErrorMessage message={submitError} />
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">{content.length}/1000</span>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {isSubmitting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          Sign in to leave a comment.
        </p>
      )}
    </div>
  )
}

// ─── Relative time helper ─────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

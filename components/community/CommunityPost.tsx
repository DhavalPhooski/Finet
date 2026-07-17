'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { LabelBadge } from './LabelBadge'
import { VoteButtons } from './VoteButtons'
import { CommentSection } from './CommentSection'
import type { CommunityPostWithMeta } from '@/types'
import type { UseCommunityFeedReturn } from '@/hooks/useCommunityFeed'

interface CommunityPostProps {
  post: CommunityPostWithMeta
  onVote: UseCommunityFeedReturn['vote']
  onDelete: UseCommunityFeedReturn['deletePost']
  onLabelClick?: (label: string) => void
}

/**
 * Full post card — author info, content, label, vote buttons,
 * comment count toggle, and inline comment section.
 */
export function CommunityPost({
  post,
  onVote,
  onDelete,
  onLabelClick,
}: CommunityPostProps) {
  const { user } = useAuth()
  const [showComments, setShowComments] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isOwner = user?.id === post.author_id
  const authorName = post.author.full_name ?? 'Anonymous'
  const initials = authorName.charAt(0).toUpperCase()

  async function handleDelete() {
    if (!confirm('Delete this post? This cannot be undone.')) return
    setIsDeleting(true)
    await onDelete(post.id)
    // Component unmounts on success (post removed from feed)
    setIsDeleting(false)
  }

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Avatar */}
          <Link
            href={`/community/user/${post.author_id}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700 transition hover:opacity-80 dark:bg-zinc-700 dark:text-zinc-200"
            aria-label={`View ${authorName}'s profile`}
          >
            {initials}
          </Link>

          <div className="min-w-0">
            <Link
              href={`/community/user/${post.author_id}`}
              className="block truncate text-sm font-semibold text-zinc-900 hover:underline dark:text-zinc-50"
            >
              {authorName}
            </Link>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {timeAgo(post.created_at)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <LabelBadge
            label={post.label}
            onClick={onLabelClick ? () => onLabelClick(post.label) : undefined}
          />
          {isOwner && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded p-1 text-zinc-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-950 dark:hover:text-red-400"
              aria-label="Delete post"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="mt-3 text-sm leading-relaxed text-zinc-800 whitespace-pre-wrap break-words dark:text-zinc-200">
        {post.content}
      </p>

      {/* Footer */}
      <div className="mt-3 flex items-center gap-4">
        <VoteButtons
          postId={post.id}
          upvotes={post.upvotes}
          downvotes={post.downvotes}
          score={post.score}
          userVote={post.user_vote}
          onVote={onVote}
          disabled={!user}
        />

        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
          aria-expanded={showComments}
        >
          <CommentIcon />
          <span>
            {post.comment_count > 0
              ? `${post.comment_count} comment${post.comment_count > 1 ? 's' : ''}`
              : 'Comment'}
          </span>
        </button>

        {/* Share placeholder */}
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
          aria-label="Share (coming soon)"
          title="Share — coming soon"
          disabled
        >
          <ShareIcon />
          <span>Share</span>
        </button>
      </div>

      {/* Inline comments */}
      {showComments && (
        <div className="mt-4">
          <CommentSection postId={post.id} />
        </div>
      )}
    </article>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1.75 3.5h10.5M5.25 3.5V2.333A.583.583 0 015.833 1.75h2.334a.583.583 0 01.583.583V3.5m1.75 0v8.167a.583.583 0 01-.583.583H4.083a.583.583 0 01-.583-.583V3.5h8.167z"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M12.25 7A5.25 5.25 0 112.1 9.8L1.75 12.25l2.45-.35A5.25 5.25 0 0112.25 7z"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M10.5 4.667a1.167 1.167 0 100-2.334 1.167 1.167 0 000 2.334zM3.5 7.583a1.167 1.167 0 100-2.333 1.167 1.167 0 000 2.333zM10.5 11.667a1.167 1.167 0 100-2.334 1.167 1.167 0 000 2.334zM4.606 6.535l4.795-2.737M4.606 7.465l4.795 2.737"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

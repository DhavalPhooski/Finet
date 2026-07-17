'use client'

import { useEffect, useRef } from 'react'
import { CommunityPost } from './CommunityPost'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import type { UseCommunityFeedReturn } from '@/hooks/useCommunityFeed'

interface CommunityFeedProps {
  feed: UseCommunityFeedReturn
  onLabelClick?: (label: string) => void
}

/**
 * Renders the list of posts with infinite scroll.
 * Hands feed state and actions down from the parent page via props —
 * keeps this component pure and easily testable.
 */
export function CommunityFeed({ feed, onLabelClick }: CommunityFeedProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  // ── Infinite scroll via IntersectionObserver ──────────────────

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && feed.hasMore && !feed.isLoadingMore) {
          feed.loadMore()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [feed])

  // ── Loading state ──────────────────────────────────────────────

  if (feed.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" label="Loading community posts…" />
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────

  if (feed.error) {
    return <ErrorMessage message={feed.error} />
  }

  // ── Empty state ────────────────────────────────────────────────

  if (feed.posts.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          {feed.filters.label || feed.filters.search
            ? 'No posts match your filters.'
            : 'No posts yet. Be the first to share something!'}
        </p>
      </div>
    )
  }

  // ── Feed ───────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {feed.posts.map((post) => (
        <CommunityPost
          key={post.id}
          post={post}
          onVote={feed.vote}
          onDelete={feed.deletePost}
          onLabelClick={onLabelClick}
        />
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} aria-hidden="true" />

      {/* Load-more spinner */}
      {feed.isLoadingMore && (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="md" label="Loading more posts…" />
        </div>
      )}

      {/* End of feed */}
      {!feed.hasMore && feed.posts.length > 0 && (
        <p className="py-4 text-center text-xs text-zinc-400 dark:text-zinc-600">
          You&apos;ve reached the end.
        </p>
      )}
    </div>
  )
}

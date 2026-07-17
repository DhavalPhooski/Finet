'use client'

import type { ConsultationReviewWithReviewer } from '@/types'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface ExpertReviewListProps {
  reviews: ConsultationReviewWithReviewer[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  onLoadMore: () => void
}

/**
 * Paginated list of reviews for an expert.
 * Shown at the bottom of the expert profile page.
 */
export function ExpertReviewList({
  reviews,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
}: ExpertReviewListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="md" label="Loading reviews…" />
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 py-10 text-center dark:border-zinc-700">
        <span className="text-2xl" aria-hidden="true">✨</span>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          No reviews yet. Be the first to leave one after your session.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            {isLoadingMore ? (
              <LoadingSpinner size="sm" label="Loading more reviews…" />
            ) : (
              'Load more reviews'
            )}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Individual review card ───────────────────────────────────────────────────

function ReviewCard({ review }: { review: ConsultationReviewWithReviewer }) {
  const reviewerName = review.reviewer.full_name ?? 'Anonymous'
  const initials = reviewerName.charAt(0).toUpperCase()

  const dateStr = new Date(review.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        {/* Reviewer identity */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
            aria-hidden="true"
          >
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {reviewerName}
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">{dateStr}</p>
          </div>
        </div>

        {/* Star rating */}
        <StarRating rating={review.rating} />
      </div>

      {/* Review text */}
      {review.review_text && (
        <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {review.review_text}
        </p>
      )}
    </article>
  )
}

// ─── Star rating display ──────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
      role="img"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="13"
          height="13"
          viewBox="0 0 13 13"
          fill={i < rating ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={i < rating ? 0 : 1}
          className={i < rating ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-600'}
          aria-hidden="true"
        >
          <path d="M6.5 1l1.545 3.13 3.455.502-2.5 2.437.59 3.44L6.5 8.885 4.41 10.51l.59-3.44L2.5 4.632l3.455-.503L6.5 1z" />
        </svg>
      ))}
    </div>
  )
}

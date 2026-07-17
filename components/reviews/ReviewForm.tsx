'use client'

import { useState } from 'react'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

const MAX_REVIEW_LENGTH = 1000

interface ReviewFormProps {
  expertName: string
  existingRating?: number
  existingText?: string
  isSubmitting: boolean
  onSubmit: (rating: number, reviewText: string) => Promise<string | null>
}

/**
 * Post-session review form.
 * Interactive 1–5 star picker with hover preview + optional text field.
 */
export function ReviewForm({
  expertName,
  existingRating,
  existingText,
  isSubmitting,
  onSubmit,
}: ReviewFormProps) {
  const [rating, setRating] = useState<number>(existingRating ?? 0)
  const [hovered, setHovered] = useState<number>(0)
  const [reviewText, setReviewText] = useState(existingText ?? '')
  const [error, setError] = useState<string | null>(null)

  const displayRating = hovered || rating

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      setError('Please select a star rating before submitting.')
      return
    }
    setError(null)
    const err = await onSubmit(rating, reviewText.trim())
    if (err) setError(err)
  }

  const ratingLabels: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Expert info */}
      <div className="text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          How was your session with
        </p>
        <p className="mt-0.5 text-base font-bold text-zinc-900 dark:text-zinc-50">
          {expertName}
        </p>
      </div>

      {/* Star picker */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="flex items-center gap-2"
          role="group"
          aria-label="Rating"
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
              aria-pressed={rating === star}
              className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 rounded"
            >
              <StarIcon filled={star <= displayRating} size={36} />
            </button>
          ))}
        </div>

        {/* Rating label */}
        <p
          className={`text-sm font-semibold transition-opacity ${
            displayRating > 0
              ? 'text-amber-500 opacity-100'
              : 'opacity-0'
          }`}
          aria-live="polite"
        >
          {ratingLabels[displayRating] ?? ''}
        </p>
      </div>

      {/* Review text */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="review-text"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Share your experience{' '}
          <span className="font-normal text-zinc-400">(optional)</span>
        </label>
        <textarea
          id="review-text"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="What did you find most helpful? What could be improved?"
          rows={4}
          maxLength={MAX_REVIEW_LENGTH}
          disabled={isSubmitting}
          className="resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <div className="flex justify-end">
          <span className="text-xs text-zinc-400">
            {reviewText.length}/{MAX_REVIEW_LENGTH}
          </span>
        </div>
      </div>

      {/* Error */}
      <ErrorMessage message={error} />

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isSubmitting ? 'Submitting…' : existingRating ? 'Update Review' : 'Submit Review'}
      </button>
    </form>
  )
}

// ─── Star icon ────────────────────────────────────────────────────────────────

function StarIcon({ filled, size = 24 }: { filled: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
      className={filled ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-600'}
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

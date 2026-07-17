import Link from 'next/link'
import type { ExpertProfileWithStats } from '@/types'

interface ExpertCardProps {
  expert: ExpertProfileWithStats
}

/**
 * Card shown in the expert listing grid.
 * Displays avatar initials, name, specializations, avg rating, and session fee.
 */
export function ExpertCard({ expert }: ExpertCardProps) {
  const initials = expert.full_name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const feeDisplay =
    expert.fee_per_session === 0
      ? 'Free'
      : `₹${(expert.fee_per_session / 100).toLocaleString('en-IN')} / session`

  return (
    <article className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
      {/* Header — avatar + name + verified badge */}
      <div className="flex items-start gap-3">
        {expert.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={expert.avatar_url}
            alt={expert.full_name}
            className="h-12 w-12 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white dark:bg-zinc-100 dark:text-zinc-900"
            aria-hidden="true"
          >
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {expert.full_name}
            </h3>
            {/* Verified badge */}
            <VerifiedIcon />
          </div>

          {expert.years_experience > 0 && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {expert.years_experience} yr{expert.years_experience !== 1 ? 's' : ''} experience
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {expert.bio && (
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          {expert.bio}
        </p>
      )}

      {/* Specializations */}
      {expert.specializations.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {expert.specializations.slice(0, 3).map((spec) => (
            <span
              key={spec}
              className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {spec}
            </span>
          ))}
          {expert.specializations.length > 3 && (
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
              +{expert.specializations.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer — rating + fee + CTA */}
      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          {/* Rating */}
          <div className="flex items-center gap-1">
            <StarIcon />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {expert.avg_rating !== null ? expert.avg_rating.toFixed(1) : '—'}
            </span>
            {expert.review_count > 0 && (
              <span className="text-xs text-zinc-400">
                ({expert.review_count})
              </span>
            )}
          </div>

          {/* Fee */}
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {feeDisplay}
          </span>
        </div>

        <Link
          href={`/experts/${expert.id}`}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          View Profile
        </Link>
      </div>
    </article>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function VerifiedIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-label="Verified expert"
      role="img"
    >
      <circle cx="7" cy="7" r="6" fill="#22c55e" />
      <path
        d="M4.5 7l1.75 1.75L9.5 5.5"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="currentColor"
      className="text-amber-400"
      aria-hidden="true"
    >
      <path d="M6.5 1l1.545 3.13 3.455.502-2.5 2.437.59 3.44L6.5 8.885 4.41 10.51l.59-3.44L2.5 4.632l3.455-.503L6.5 1z" />
    </svg>
  )
}

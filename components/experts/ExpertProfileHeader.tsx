import type { ExpertProfileWithStats } from '@/types'

interface ExpertProfileHeaderProps {
  expert: ExpertProfileWithStats
}

/**
 * Full expert profile header card.
 * Shows avatar, name, verified badge, bio, specializations, and key stats.
 */
export function ExpertProfileHeader({ expert }: ExpertProfileHeaderProps) {
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
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      {/* Top row — avatar + identity */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* Avatar */}
        {expert.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={expert.avatar_url}
            alt={expert.full_name}
            className="h-20 w-20 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-2xl font-bold text-white dark:bg-zinc-100 dark:text-zinc-900"
            aria-hidden="true"
          >
            {initials}
          </div>
        )}

        {/* Name + verified + experience */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {expert.full_name}
            </h1>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <VerifiedIcon />
              Verified Expert
            </span>
          </div>

          {expert.years_experience > 0 && (
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {expert.years_experience} year{expert.years_experience !== 1 ? 's' : ''} of experience
            </p>
          )}

          {/* Bio */}
          {expert.bio && (
            <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {expert.bio}
            </p>
          )}

          {/* Specializations */}
          {expert.specializations.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {expert.specializations.map((spec) => (
                <span
                  key={spec}
                  className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {spec}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-zinc-100 pt-5 sm:grid-cols-4 dark:border-zinc-800">
        <StatItem
          icon="⭐"
          label="Avg Rating"
          value={
            expert.avg_rating !== null
              ? `${expert.avg_rating.toFixed(1)} / 5`
              : 'No reviews yet'
          }
        />
        <StatItem
          icon="💬"
          label="Reviews"
          value={String(expert.review_count)}
        />
        <StatItem
          icon="🎓"
          label="Experience"
          value={
            expert.years_experience > 0
              ? `${expert.years_experience} yr${expert.years_experience !== 1 ? 's' : ''}`
              : '—'
          }
        />
        <StatItem
          icon="💳"
          label="Session Fee"
          value={feeDisplay}
        />
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatItem({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-800">
      <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        <span aria-hidden="true">{icon}</span>
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  )
}

function VerifiedIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5" fill="#22c55e" />
      <path
        d="M3.5 6l1.75 1.75L8.5 4.5"
        stroke="white"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

'use client'

import { COMMUNITY_LABELS } from '@/types'
import type { CommunityFeedFilters } from '@/types'

interface FeedFiltersProps {
  filters: CommunityFeedFilters
  onFilterChange: (partial: Partial<CommunityFeedFilters>) => void
  onReset: () => void
  isPending: boolean
}

/**
 * Feed filter bar — label selector + search input.
 * Labels are pulled from COMMUNITY_LABELS (single source of truth).
 */
export function FeedFilters({
  filters,
  onFilterChange,
  onReset,
  isPending,
}: FeedFiltersProps) {
  const isActive = !!(filters.label || filters.search)

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400">
          <SearchIcon />
        </span>
        <input
          type="search"
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          placeholder="Search posts…"
          aria-label="Search community posts"
          className={`w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 ${isPending ? 'opacity-60' : ''}`}
        />
      </div>

      {/* Label pills */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onFilterChange({ label: null })}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            filters.label === null
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
          }`}
        >
          All
        </button>

        {COMMUNITY_LABELS.map((lbl) => (
          <button
            key={lbl.value}
            type="button"
            onClick={() =>
              onFilterChange({
                label: filters.label === lbl.value ? null : lbl.value,
              })
            }
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filters.label === lbl.value
                ? `${lbl.color} ${lbl.textColor} ring-2 ring-offset-1 ring-current`
                : `${lbl.color} ${lbl.textColor} opacity-70 hover:opacity-100`
            }`}
          >
            {lbl.value}
          </button>
        ))}

        {isActive && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

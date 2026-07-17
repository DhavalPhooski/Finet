'use client'

import type { ExpertListingFilters } from '@/types'

// ─── Known specializations ────────────────────────────────────────────────────
// Single source of truth for the filter pills.
// Add new tags here as new experts are onboarded — no DB migration needed.
export const EXPERT_SPECIALIZATIONS = [
  'Tax Planning',
  'Mutual Funds',
  'Retirement',
  'Insurance',
  'Stock Market',
  'Budgeting',
  'Debt Management',
  'Real Estate',
  'Crypto',
  'NRI Finance',
]

interface ExpertFiltersProps {
  filters: ExpertListingFilters
  onFilterChange: (partial: Partial<ExpertListingFilters>) => void
  onReset: () => void
  isPending: boolean
}

/**
 * Filter bar for the expert listing page.
 * Search input + specialization pills.
 */
export function ExpertFilters({
  filters,
  onFilterChange,
  onReset,
  isPending,
}: ExpertFiltersProps) {
  const isActive = !!(filters.specialization || filters.search.trim())

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
          placeholder="Search experts by name or expertise…"
          aria-label="Search financial experts"
          className={`w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400 ${
            isPending ? 'opacity-60' : ''
          }`}
        />
      </div>

      {/* Specialization pills */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by specialization">
        <button
          type="button"
          onClick={() => onFilterChange({ specialization: null })}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            filters.specialization === null
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
          }`}
        >
          All
        </button>

        {EXPERT_SPECIALIZATIONS.map((spec) => (
          <button
            key={spec}
            type="button"
            onClick={() =>
              onFilterChange({
                specialization: filters.specialization === spec ? null : spec,
              })
            }
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filters.specialization === spec
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            {spec}
          </button>
        ))}

        {isActive && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Clear filters
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

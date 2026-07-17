'use client'

import { useEffect, useRef } from 'react'
import { useExperts } from '@/hooks/useExperts'
import { ExpertCard } from '@/components/experts/ExpertCard'
import { ExpertCardSkeleton } from '@/components/experts/ExpertCardSkeleton'
import { ExpertFilters } from '@/components/experts/ExpertFilters'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

/**
 * Expert listing page — /experts
 * Browse verified financial experts, filter by specialization or search by name.
 */
export default function ExpertsPage() {
  const {
    experts,
    isLoading,
    isLoadingMore,
    isFiltering,
    hasMore,
    error,
    filters,
    setFilters,
    resetFilters,
    loadMore,
  } = useExperts()

  // ── Infinite scroll sentinel ───────────────────────────────────
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Financial Experts
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Book a one-on-one consultation with a verified financial advisor.
        </p>
      </div>

      {/* Filters */}
      <ExpertFilters
        filters={filters}
        onFilterChange={setFilters}
        onReset={resetFilters}
        isPending={isFiltering}
      />

      {/* Error */}
      <ErrorMessage message={error} />

      {/* Loading state — skeleton grid */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ExpertCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && experts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
          <span className="text-3xl" aria-hidden="true">🔍</span>
          <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            No experts found
          </p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Try adjusting your search or filters.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 rounded-lg border border-zinc-300 px-4 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Expert grid */}
      {!isLoading && experts.length > 0 && (
        <div
          className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
            isFiltering ? 'opacity-60 transition-opacity' : ''
          }`}
        >
          {experts.map((expert) => (
            <ExpertCard key={expert.id} expert={expert} />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel + load-more spinner */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {isLoadingMore && <LoadingSpinner size="md" label="Loading more experts…" />}
        </div>
      )}

      {/* End of list */}
      {!isLoading && !hasMore && experts.length > 0 && (
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
          Showing all {experts.length} expert{experts.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}

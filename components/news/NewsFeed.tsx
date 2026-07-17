'use client'

import { useEffect, useRef } from 'react'
import { NewsCard } from './NewsCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { NEWS_CATEGORIES } from '@/types'
import type { UseNewsReturn } from '@/hooks/useNews'

interface NewsFeedProps {
  news: UseNewsReturn
}

/**
 * Renders the filtered news feed with category tabs, search bar,
 * article grid, and infinite scroll.
 */
export function NewsFeed({ news }: NewsFeedProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  // ── Infinite scroll ────────────────────────────────────────────

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && news.hasMore && !news.isLoadingMore) {
          news.loadMore()
        }
      },
      { rootMargin: '300px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [news])

  return (
    <div className="flex flex-col gap-5">
      {/* ── Search bar ──────────────────────────────────────────── */}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400">
          <SearchIcon />
        </span>
        <input
          type="search"
          value={news.filters.search}
          onChange={(e) => news.setFilters({ search: e.target.value })}
          placeholder="Search financial news…"
          aria-label="Search news"
          className={`w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 ${news.isFiltering ? 'opacity-60' : ''}`}
        />
      </div>

      {/* ── Category tabs ───────────────────────────────────────── */}
      <div
        className="flex gap-1.5 overflow-x-auto pb-1"
        role="tablist"
        aria-label="News categories"
      >
        {NEWS_CATEGORIES.map(({ value, label }) => {
          const isActive = news.filters.category === value
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => news.setFilters({ category: value })}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* ── Error ───────────────────────────────────────────────── */}
      <ErrorMessage message={news.error} />

      {/* ── Loading (initial) ────────────────────────────────────── */}
      {news.isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" label="Loading news…" />
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────── */}
      {!news.isLoading && !news.error && news.articles.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            {news.filters.search || news.filters.category
              ? 'No articles match your filters.'
              : 'No news articles available right now.'}
          </p>
          <button
            type="button"
            onClick={news.refresh}
            className="mt-3 text-sm font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Try again
          </button>
        </div>
      )}

      {/* ── Article grid ─────────────────────────────────────────── */}
      {!news.isLoading && news.articles.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {news.articles.map((article) => (
            <NewsCard key={article.article_id} article={article} />
          ))}
        </div>
      )}

      {/* ── Infinite scroll sentinel ─────────────────────────────── */}
      <div ref={sentinelRef} aria-hidden="true" />

      {/* ── Load more spinner ────────────────────────────────────── */}
      {news.isLoadingMore && (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="md" label="Loading more articles…" />
        </div>
      )}

      {/* ── End of feed ──────────────────────────────────────────── */}
      {!news.hasMore && news.articles.length > 0 && !news.isLoading && (
        <p className="py-4 text-center text-xs text-zinc-400 dark:text-zinc-600">
          You&apos;ve reached the end.
        </p>
      )}
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

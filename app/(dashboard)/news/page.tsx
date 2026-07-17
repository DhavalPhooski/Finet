'use client'

import { useEffect } from 'react'
import { useNews } from '@/hooks/useNews'
import { NewsFeed } from '@/components/news/NewsFeed'

/**
 * /news — financial news page.
 * Fetches articles from our /api/news proxy (which calls newsdata.io server-side).
 */
export default function NewsPage() {
  const news = useNews()

  // Load on mount
  useEffect(() => {
    news.refresh()
    // refresh is stable — safe to call once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Financial News
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Latest business, economy, and market news from India
          </p>
        </div>

        <button
          type="button"
          onClick={news.refresh}
          disabled={news.isLoading}
          className="flex h-9 items-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          aria-label="Refresh news"
        >
          <RefreshIcon spinning={news.isLoading} />
          Refresh
        </button>
      </div>

      {/* Feed */}
      <NewsFeed news={news} />
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className={spinning ? 'animate-spin' : ''}
    >
      <path
        d="M12.25 7A5.25 5.25 0 112.45 4.375"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M2.5 1.75v2.625H5.125"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

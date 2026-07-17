'use client'

import { useState, useCallback, useTransition } from 'react'
import type { NewsArticle, NewsFeedFilters } from '@/types'

// ─── Default filters ──────────────────────────────────────────────────────────

const DEFAULT_FILTERS: NewsFeedFilters = {
  category: '',
  search: '',
}

// ─── Hook return shape ────────────────────────────────────────────────────────

export interface UseNewsReturn {
  articles: NewsArticle[]
  isLoading: boolean
  isLoadingMore: boolean
  isFiltering: boolean
  hasMore: boolean
  error: string | null

  filters: NewsFeedFilters
  setFilters: (partial: Partial<NewsFeedFilters>) => void
  resetFilters: () => void

  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

// ─── Parse newsdata.io response ───────────────────────────────────────────────
// newsdata.io shape: { status, totalResults, results: Article[], nextPage }

interface NewsDataArticle {
  article_id?: string
  title?: string
  link?: string
  source_id?: string
  source_name?: string | null
  source_icon?: string | null
  description?: string | null
  content?: string | null
  pubDate?: string | null
  image_url?: string | null
  category?: string[] | null
  [key: string]: unknown
}

interface NewsDataResponse {
  status: string
  results?: NewsDataArticle[]
  nextPage?: string | null
}

function parseResponse(json: unknown): { articles: NewsArticle[]; nextCursor: string | null } {
  const obj = json as NewsDataResponse
  if (!obj || obj.status !== 'success') return { articles: [], nextCursor: null }

  const articles: NewsArticle[] = (obj.results ?? [])
    .filter((r) => r.title && r.link)
    .map((r) => ({
      id: r.article_id ?? r.link ?? r.title ?? Math.random().toString(),
      title: r.title ?? 'Untitled',
      url: r.link ?? '',
      description: r.description ?? null,
      content: r.content ?? null,
      image: r.image_url ?? null,
      published_at: r.pubDate ?? null,
      source: r.source_name ?? r.source_id ?? null,
      category: r.category ?? null,
      author: null,
    }))

  return { articles, nextCursor: obj.nextPage ?? null }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNews(): UseNewsReturn {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [filters, setFiltersState] = useState<NewsFeedFilters>(DEFAULT_FILTERS)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isFiltering, startFilterTransition] = useTransition()

  // ── Internal fetch ─────────────────────────────────────────

  const fetchNews = useCallback(async (
    currentFilters: NewsFeedFilters,
    cursor: string | null,
    append: boolean
  ) => {
    const params = new URLSearchParams()
    if (currentFilters.category) params.set('category', currentFilters.category)
    if (currentFilters.search.trim()) params.set('q', currentFilters.search.trim())
    if (cursor) params.set('page', cursor)

    const res = await fetch(`/api/news?${params.toString()}`)
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string }
      throw new Error(body.error ?? `HTTP ${res.status}`)
    }

    const json: unknown = await res.json()
    const { articles: fetched, nextCursor: next } = parseResponse(json)

    setArticles((prev) => append ? [...prev, ...fetched] : fetched)
    setHasMore(!!next)
    setNextCursor(next)
  }, [])

  // ── Initial / filter load ──────────────────────────────────

  const load = useCallback(async (currentFilters: NewsFeedFilters) => {
    setIsLoading(true)
    setNextCursor(null)
    setError(null)
    try {
      await fetchNews(currentFilters, null, false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load news.')
    } finally {
      setIsLoading(false)
    }
  }, [fetchNews])

  // ── Filter actions ─────────────────────────────────────────

  const setFilters = useCallback((partial: Partial<NewsFeedFilters>) => {
    startFilterTransition(() => {
      setFiltersState((prev) => {
        const next = { ...prev, ...partial }
        setTimeout(() => load(next), 0)
        return next
      })
    })
  }, [load])

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), [setFilters])

  // ── Load more ──────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !nextCursor) return
    setIsLoadingMore(true)
    setError(null)
    try {
      await fetchNews(filters, nextCursor, true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more.')
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMore, nextCursor, filters, fetchNews])

  // ── Refresh ────────────────────────────────────────────────

  const refresh = useCallback(() => load(filters), [load, filters])

  return {
    articles,
    isLoading,
    isLoadingMore,
    isFiltering,
    hasMore,
    error,
    filters,
    setFilters,
    resetFilters,
    loadMore,
    refresh,
  }
}

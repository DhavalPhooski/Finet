'use client'

import {
  useState,
  useEffect,
  useCallback,
  useTransition,
  useRef,
} from 'react'
import {
  getExperts,
  EXPERTS_PAGE_SIZE,
} from '@/services/expertService'
import type {
  ExpertProfileWithStats,
  ExpertListingFilters,
} from '@/types'

// ─── Default filters ──────────────────────────────────────────────────────────

const DEFAULT_FILTERS: ExpertListingFilters = {
  specialization: null,
  search: '',
}

// ─── Hook return shape ────────────────────────────────────────────────────────

export interface UseExpertsReturn {
  experts: ExpertProfileWithStats[]
  isLoading: boolean
  isLoadingMore: boolean
  isFiltering: boolean
  hasMore: boolean
  error: string | null

  filters: ExpertListingFilters
  setFilters: (partial: Partial<ExpertListingFilters>) => void
  resetFilters: () => void

  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useExperts(): UseExpertsReturn {
  const [experts, setExperts] = useState<ExpertProfileWithStats[]>([])
  const [filters, setFiltersState] = useState<ExpertListingFilters>(DEFAULT_FILTERS)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFiltering, startFilterTransition] = useTransition()

  const offsetRef = useRef(0)

  // ── Initial / filter-driven load ──────────────────────────────

  const load = useCallback(async (currentFilters: ExpertListingFilters) => {
    setIsLoading(true)
    setError(null)
    offsetRef.current = 0

    const result = await getExperts(currentFilters, {
      limit: EXPERTS_PAGE_SIZE,
      offset: 0,
    })

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setExperts(result.data.experts)
      setHasMore(result.data.hasMore)
      offsetRef.current = result.data.experts.length
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    load(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  // ── Filter actions ─────────────────────────────────────────────

  const setFilters = useCallback((partial: Partial<ExpertListingFilters>) => {
    startFilterTransition(() => {
      setFiltersState((prev) => ({ ...prev, ...partial }))
    })
  }, [])

  const resetFilters = useCallback(() => {
    startFilterTransition(() => setFiltersState(DEFAULT_FILTERS))
  }, [])

  // ── Load more ──────────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)

    const result = await getExperts(filters, {
      limit: EXPERTS_PAGE_SIZE,
      offset: offsetRef.current,
    })

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setExperts((prev) => [...prev, ...result.data!.experts])
      setHasMore(result.data.hasMore)
      offsetRef.current += result.data.experts.length
    }

    setIsLoadingMore(false)
  }, [isLoadingMore, hasMore, filters])

  const refresh = useCallback(() => load(filters), [load, filters])

  return {
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
    refresh,
  }
}

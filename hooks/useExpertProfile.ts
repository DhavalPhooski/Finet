'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getExpertById,
  getExpertAvailability,
  getExpertReviews,
} from '@/services/expertService'
import type {
  ExpertProfileWithStats,
  ExpertAvailability,
  ConsultationReviewWithReviewer,
} from '@/types'

const REVIEWS_PAGE_SIZE = 10

// ─── Hook return shape ────────────────────────────────────────────────────────

export interface UseExpertProfileReturn {
  expert: ExpertProfileWithStats | null
  availability: ExpertAvailability[]
  reviews: ConsultationReviewWithReviewer[]

  isLoadingExpert: boolean
  isLoadingAvailability: boolean
  isLoadingReviews: boolean
  isLoadingMoreReviews: boolean
  hasMoreReviews: boolean

  error: string | null

  loadMoreReviews: () => Promise<void>
  refresh: () => Promise<void>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useExpertProfile(expertId: string): UseExpertProfileReturn {
  const [expert, setExpert] = useState<ExpertProfileWithStats | null>(null)
  const [availability, setAvailability] = useState<ExpertAvailability[]>([])
  const [reviews, setReviews] = useState<ConsultationReviewWithReviewer[]>([])

  const [isLoadingExpert, setIsLoadingExpert] = useState(true)
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true)
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const [isLoadingMoreReviews, setIsLoadingMoreReviews] = useState(false)
  const [hasMoreReviews, setHasMoreReviews] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const reviewOffsetRef = useRef(0)

  // ── Load expert profile ────────────────────────────────────────

  const loadExpert = useCallback(async () => {
    setIsLoadingExpert(true)
    const result = await getExpertById(expertId)
    if (result.error) {
      setError(result.error)
    } else {
      setExpert(result.data)
    }
    setIsLoadingExpert(false)
  }, [expertId])

  // ── Load availability slots ────────────────────────────────────

  const loadAvailability = useCallback(async () => {
    setIsLoadingAvailability(true)
    const result = await getExpertAvailability(expertId)
    if (result.error) {
      setError(result.error)
    } else {
      setAvailability(result.data ?? [])
    }
    setIsLoadingAvailability(false)
  }, [expertId])

  // ── Load first page of reviews ─────────────────────────────────

  const loadReviews = useCallback(async () => {
    setIsLoadingReviews(true)
    reviewOffsetRef.current = 0

    const result = await getExpertReviews(expertId, {
      limit: REVIEWS_PAGE_SIZE,
      offset: 0,
    })

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setReviews(result.data.reviews)
      setHasMoreReviews(result.data.hasMore)
      reviewOffsetRef.current = result.data.reviews.length
    }

    setIsLoadingReviews(false)
  }, [expertId])

  // ── Load more reviews ──────────────────────────────────────────

  const loadMoreReviews = useCallback(async () => {
    if (isLoadingMoreReviews || !hasMoreReviews) return
    setIsLoadingMoreReviews(true)

    const result = await getExpertReviews(expertId, {
      limit: REVIEWS_PAGE_SIZE,
      offset: reviewOffsetRef.current,
    })

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setReviews((prev) => [...prev, ...result.data!.reviews])
      setHasMoreReviews(result.data.hasMore)
      reviewOffsetRef.current += result.data.reviews.length
    }

    setIsLoadingMoreReviews(false)
  }, [expertId, isLoadingMoreReviews, hasMoreReviews])

  // ── Initial parallel load ──────────────────────────────────────
  // Load all three data sources simultaneously.

  const refresh = useCallback(async () => {
    setError(null)
    await Promise.all([loadExpert(), loadAvailability(), loadReviews()])
  }, [loadExpert, loadAvailability, loadReviews])

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expertId])

  return {
    expert,
    availability,
    reviews,
    isLoadingExpert,
    isLoadingAvailability,
    isLoadingReviews,
    isLoadingMoreReviews,
    hasMoreReviews,
    error,
    loadMoreReviews,
    refresh,
  }
}

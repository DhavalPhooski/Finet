'use client'

import {
  useState,
  useEffect,
  useCallback,
  useTransition,
  useRef,
} from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getFeedPosts,
  createPost,
  softDeletePost,
  FEED_PAGE_SIZE,
} from '@/services/community/postService'
import { upsertVote, removeVote } from '@/services/community/voteService'
import type {
  CommunityPostWithMeta,
  CommunityFeedFilters,
  CommunityPostInsert,
} from '@/types'

// ─── Default filter state ─────────────────────────────────────────────────────

const DEFAULT_FILTERS: CommunityFeedFilters = {
  label: null,
  search: '',
  sort: 'newest',
}

// ─── Hook return shape ────────────────────────────────────────────────────────

export interface UseCommunityFeedReturn {
  posts: CommunityPostWithMeta[]
  isLoading: boolean
  isLoadingMore: boolean
  isFiltering: boolean
  hasMore: boolean
  error: string | null

  filters: CommunityFeedFilters
  setFilters: (partial: Partial<CommunityFeedFilters>) => void
  resetFilters: () => void

  loadMore: () => Promise<void>
  refresh: () => Promise<void>

  // Post actions
  addPost: (payload: CommunityPostInsert) => Promise<string | null>
  deletePost: (id: string) => Promise<string | null>

  // Vote actions — optimistic
  vote: (postId: string, value: 1 | -1) => Promise<string | null>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCommunityFeed(): UseCommunityFeedReturn {
  const { user } = useAuth()

  const [posts, setPosts] = useState<CommunityPostWithMeta[]>([])
  const [filters, setFiltersState] = useState<CommunityFeedFilters>(DEFAULT_FILTERS)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFiltering, startFilterTransition] = useTransition()

  // Track current offset for pagination
  const offsetRef = useRef(0)

  // ── Initial / filter-driven load ──────────────────────────────

  const load = useCallback(
    async (currentFilters: CommunityFeedFilters) => {
      setIsLoading(true)
      setError(null)
      offsetRef.current = 0

      const result = await getFeedPosts(user?.id ?? null, {
        label: currentFilters.label,
        search: currentFilters.search,
        offset: 0,
        limit: FEED_PAGE_SIZE,
      })

      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        setPosts(result.data.posts)
        setHasMore(result.data.hasMore)
        offsetRef.current = result.data.posts.length
      }

      setIsLoading(false)
    },
    [user?.id]
  )

  // Reload when user or filters change
  useEffect(() => {
    load(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, filters])

  // ── Filter actions ─────────────────────────────────────────────

  const setFilters = useCallback(
    (partial: Partial<CommunityFeedFilters>) => {
      startFilterTransition(() => {
        setFiltersState((prev) => ({ ...prev, ...partial }))
      })
    },
    []
  )

  const resetFilters = useCallback(() => {
    startFilterTransition(() => setFiltersState(DEFAULT_FILTERS))
  }, [])

  // ── Load more (infinite scroll) ────────────────────────────────

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)

    const result = await getFeedPosts(user?.id ?? null, {
      label: filters.label,
      search: filters.search,
      offset: offsetRef.current,
      limit: FEED_PAGE_SIZE,
    })

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setPosts((prev) => [...prev, ...result.data!.posts])
      setHasMore(result.data.hasMore)
      offsetRef.current += result.data.posts.length
    }

    setIsLoadingMore(false)
  }, [isLoadingMore, hasMore, user?.id, filters])

  // ── Refresh ────────────────────────────────────────────────────

  const refresh = useCallback(() => load(filters), [load, filters])

  // ── Add post (optimistic prepend) ──────────────────────────────

  const addPost = useCallback(
    async (payload: CommunityPostInsert): Promise<string | null> => {
      const result = await createPost(payload)
      if (result.error) return result.error
      if (!result.data) return 'Failed to create post.'
      const created = result.data
      setPosts((prev) => [created, ...prev])
      return null
    },
    []
  )

  // ── Delete post (optimistic remove) ───────────────────────────

  const deletePost = useCallback(async (id: string): Promise<string | null> => {
    // Optimistic
    setPosts((prev) => prev.filter((p) => p.id !== id))
    const result = await softDeletePost(id)
    if (result.error) {
      // Revert
      await load(filters)
      return result.error
    }
    return null
  }, [load, filters])

  // ── Vote (optimistic update) ───────────────────────────────────

  const vote = useCallback(
    async (postId: string, value: 1 | -1): Promise<string | null> => {
      if (!user) return 'You must be logged in to vote.'

      // Find current state for optimistic update + potential revert
      const prev = posts.find((p) => p.id === postId)
      if (!prev) return null

      const isSameVote = prev.user_vote === value
      const wasUpvote = prev.user_vote === 1
      const wasDownvote = prev.user_vote === -1

      // Compute optimistic values
      let upvotes = prev.upvotes
      let downvotes = prev.downvotes
      let user_vote: 1 | -1 | null

      if (isSameVote) {
        // Toggle off
        if (value === 1) upvotes -= 1
        else downvotes -= 1
        user_vote = null
      } else {
        // Change or new vote
        if (value === 1) {
          upvotes += 1
          if (wasDownvote) downvotes -= 1
        } else {
          downvotes += 1
          if (wasUpvote) upvotes -= 1
        }
        user_vote = value
      }

      // Apply optimistic update
      setPosts((all) =>
        all.map((p) =>
          p.id === postId
            ? { ...p, upvotes, downvotes, score: upvotes - downvotes, user_vote }
            : p
        )
      )

      // Persist
      let err: string | null = null
      if (isSameVote) {
        const result = await removeVote(postId, user.id)
        err = result.error
      } else {
        const result = await upsertVote(postId, user.id, value)
        err = result.error
      }

      if (err) {
        // Revert to previous state
        setPosts((all) =>
          all.map((p) => (p.id === postId ? prev : p))
        )
        return err
      }

      return null
    },
    [posts, user]
  )

  return {
    posts,
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
    addPost,
    deletePost,
    vote,
  }
}

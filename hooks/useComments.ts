'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getComments,
  createComment,
  deleteComment,
} from '@/services/community/commentService'
import type { CommunityCommentWithAuthor, CommunityCommentInsert } from '@/types'

// ─── Hook return shape ────────────────────────────────────────────────────────

export interface UseCommentsReturn {
  comments: CommunityCommentWithAuthor[]
  isLoading: boolean
  error: string | null
  addComment: (content: string) => Promise<string | null>
  removeComment: (id: string) => Promise<string | null>
  refresh: () => Promise<void>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useComments(postId: string): UseCommentsReturn {
  const { user, profile } = useAuth()

  const [comments, setComments] = useState<CommunityCommentWithAuthor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Load ───────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const result = await getComments(postId)

    if (result.error) {
      setError(result.error)
    } else {
      setComments(result.data ?? [])
    }

    setIsLoading(false)
  }, [postId])

  useEffect(() => {
    load()
  }, [load])

  // ── Add comment (optimistic) ───────────────────────────────────

  const addComment = useCallback(
    async (content: string): Promise<string | null> => {
      if (!user) return 'You must be logged in to comment.'
      if (!content.trim()) return 'Comment cannot be empty.'
      if (content.length > 1000) return 'Comment cannot exceed 1000 characters.'

      const payload: CommunityCommentInsert = {
        post_id: postId,
        author_id: user.id,
        content: content.trim(),
      }

      // Optimistic: build a local version while the DB round-trip happens
      const optimisticComment: CommunityCommentWithAuthor = {
        id: `optimistic-${Date.now()}`,
        post_id: postId,
        author_id: user.id,
        content: content.trim(),
        parent_comment_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author: { id: user.id, full_name: profile?.full_name ?? null },
      }

      setComments((prev) => [...prev, optimisticComment])

      const result = await createComment(payload)

      if (result.error) {
        // Remove optimistic entry and show error
        setComments((prev) =>
          prev.filter((c) => c.id !== optimisticComment.id)
        )
        return result.error
      }

      if (!result.data) {
        setComments((prev) =>
          prev.filter((c) => c.id !== optimisticComment.id)
        )
        return 'Failed to post comment.'
      }

      // Replace optimistic entry with real data
      const realComment = result.data
      setComments((prev) =>
        prev.map((c) => (c.id === optimisticComment.id ? realComment : c))
      )

      return null
    },
    [user, profile, postId]
  )

  // ── Delete comment (optimistic) ────────────────────────────────

  const removeComment = useCallback(
    async (id: string): Promise<string | null> => {
      const backup = comments.find((c) => c.id === id)

      // Optimistic removal
      setComments((prev) => prev.filter((c) => c.id !== id))

      const result = await deleteComment(id)

      if (result.error) {
        // Revert
        if (backup) {
          setComments((prev) => {
            const idx = prev.findIndex((c) => c.created_at > backup.created_at)
            if (idx === -1) return [...prev, backup]
            return [...prev.slice(0, idx), backup, ...prev.slice(idx)]
          })
        }
        return result.error
      }

      return null
    },
    [comments]
  )

  return {
    comments,
    isLoading,
    error,
    addComment,
    removeComment,
    refresh: load,
  }
}

import { createClient } from '@/lib/supabase/client'
import type {
  CommunityCommentWithAuthor,
  CommunityCommentInsert,
  ServiceResult,
} from '@/types'

/**
 * Comment service — fetch, create, and delete first-level comments.
 * Schema supports future nested replies via parent_comment_id.
 */

// ─── Fetch comments for a post ────────────────────────────────────────────────

export async function getComments(
  postId: string
): Promise<ServiceResult<CommunityCommentWithAuthor[]>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('community_comments')
    .select(
      `
      *,
      author:profiles!community_comments_author_id_profiles_fkey(id, full_name)
      `
    )
    .eq('post_id', postId)
    .is('parent_comment_id', null)
    .order('created_at', { ascending: true })

  if (error) return { data: null, error: error.message }

  const comments: CommunityCommentWithAuthor[] = (data ?? []).map((row) => ({
    id: row.id,
    post_id: row.post_id,
    author_id: row.author_id,
    content: row.content,
    parent_comment_id: row.parent_comment_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: row.author as { id: string; full_name: string | null },
  }))

  return { data: comments, error: null }
}

// ─── Create comment ───────────────────────────────────────────────────────────

export async function createComment(
  payload: CommunityCommentInsert
): Promise<ServiceResult<CommunityCommentWithAuthor>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('community_comments')
    .insert(payload)
    .select(
      `
      *,
      author:profiles!community_comments_author_id_profiles_fkey(id, full_name)
      `
    )
    .single()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Failed to create comment.' }

  return {
    data: {
      ...data,
      author: data.author as { id: string; full_name: string | null },
    },
    error: null,
  }
}

// ─── Delete comment ───────────────────────────────────────────────────────────

export async function deleteComment(id: string): Promise<ServiceResult<null>> {
  const supabase = createClient()

  const { error } = await supabase
    .from('community_comments')
    .delete()
    .eq('id', id)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

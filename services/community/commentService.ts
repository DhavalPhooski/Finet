import { createClient } from '@/lib/supabase/client'
import type {
  CommunityCommentWithAuthor,
  CommunityCommentInsert,
  ServiceResult,
} from '@/types'

/**
 * Comment service — fetch, create, and delete first-level comments.
 * Schema supports future nested replies via parent_comment_id.
 *
 * NOTE: Queries that use relation joins (author:profiles!...) cast `data` to
 * `unknown` first because the Supabase typed client cannot infer joined shapes
 * without full Relationships declarations in database.ts.
 */

// ─── Raw row shape returned by the joined select ──────────────────────────────

interface CommentRow {
  id: string
  post_id: string
  author_id: string
  content: string
  parent_comment_id: string | null
  created_at: string
  updated_at: string
  author: { id: string; full_name: string | null } | null
}

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

  const rows = (data ?? []) as unknown as CommentRow[]

  const comments: CommunityCommentWithAuthor[] = rows.map((row) => ({
    id: row.id,
    post_id: row.post_id,
    author_id: row.author_id,
    content: row.content,
    parent_comment_id: row.parent_comment_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: row.author ?? { id: row.author_id, full_name: null },
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

  const row = data as unknown as CommentRow

  return {
    data: {
      id: row.id,
      post_id: row.post_id,
      author_id: row.author_id,
      content: row.content,
      parent_comment_id: row.parent_comment_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      author: row.author ?? { id: row.author_id, full_name: null },
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

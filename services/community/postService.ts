import { createClient } from '@/lib/supabase/client'
import type {
  CommunityPostWithMeta,
  CommunityPostInsert,
  ServiceResult,
} from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

export const FEED_PAGE_SIZE = 20

// ─── Feed ─────────────────────────────────────────────────────────────────────

export interface FeedOptions {
  label?: string | null
  search?: string
  offset?: number
  limit?: number
}

// ─── Raw row shapes ───────────────────────────────────────────────────────────
// Queries that use relation joins cast data to these interfaces because the
// Supabase typed client cannot infer joined shapes without full Relationships
// declarations in database.ts.

interface PostRow {
  id: string
  author_id: string
  content: string
  label: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  author: { id: string; full_name: string | null } | null
  votes: { post_id: string; user_id: string; vote: number }[] | null
  comments: { id: string }[] | null
}

interface ProfileRow {
  id: string
  full_name: string | null
  created_at: string
}

// ─── Helper: map a raw post row to CommunityPostWithMeta ─────────────────────

function mapPostRow(row: PostRow, currentUserId: string | null): CommunityPostWithMeta {
  const votes = row.votes ?? []
  const upvotes = votes.filter((v) => v.vote === 1).length
  const downvotes = votes.filter((v) => v.vote === -1).length
  const userVoteRow = currentUserId
    ? votes.find((v) => v.user_id === currentUserId)
    : null
  const user_vote = userVoteRow ? (userVoteRow.vote as 1 | -1) : null

  return {
    id: row.id,
    author_id: row.author_id,
    content: row.content,
    label: row.label,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
    author: row.author ?? { id: row.author_id, full_name: null },
    upvotes,
    downvotes,
    score: upvotes - downvotes,
    comment_count: row.comments?.length ?? 0,
    user_vote,
  }
}

/**
 * Fetch paginated community posts with author info, vote counts,
 * and comment count. Only returns non-deleted posts.
 */
export async function getFeedPosts(
  currentUserId: string | null,
  options: FeedOptions = {}
): Promise<ServiceResult<{ posts: CommunityPostWithMeta[]; hasMore: boolean }>> {
  const supabase = createClient()
  const limit = options.limit ?? FEED_PAGE_SIZE
  const offset = options.offset ?? 0

  let query = supabase
    .from('community_posts')
    .select(
      `
      *,
      author:profiles!community_posts_author_id_profiles_fkey(id, full_name),
      votes:community_votes(post_id, user_id, vote),
      comments:community_comments(id)
      `
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit)

  if (options.label) {
    query = query.eq('label', options.label)
  }

  if (options.search?.trim()) {
    const term = options.search.trim()
    query = query.or(`content.ilike.%${term}%,label.ilike.%${term}%`)
  }

  const { data, error } = await query

  if (error) return { data: null, error: error.message }

  const raw = (data ?? []) as unknown as PostRow[]
  const hasMore = raw.length > limit
  const posts = raw.slice(0, limit).map((row) => mapPostRow(row, currentUserId))

  return { data: { posts, hasMore }, error: null }
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createPost(
  payload: CommunityPostInsert
): Promise<ServiceResult<CommunityPostWithMeta>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('community_posts')
    .insert(payload)
    .select(
      `
      *,
      author:profiles!community_posts_author_id_profiles_fkey(id, full_name)
      `
    )
    .single()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Failed to create post.' }

  const row = data as unknown as PostRow

  const post: CommunityPostWithMeta = {
    id: row.id,
    author_id: row.author_id,
    content: row.content,
    label: row.label,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
    author: row.author ?? { id: row.author_id, full_name: null },
    upvotes: 0,
    downvotes: 0,
    score: 0,
    comment_count: 0,
    user_vote: null,
  }

  return { data: post, error: null }
}

// ─── Soft Delete ──────────────────────────────────────────────────────────────

export async function softDeletePost(id: string): Promise<ServiceResult<null>> {
  const supabase = createClient()

  const { error } = await supabase
    .from('community_posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

// ─── User posts (for profile page) ───────────────────────────────────────────

export async function getUserPosts(
  authorId: string,
  currentUserId: string | null,
  options: { offset?: number; limit?: number } = {}
): Promise<ServiceResult<{ posts: CommunityPostWithMeta[]; hasMore: boolean }>> {
  const supabase = createClient()
  const limit = options.limit ?? FEED_PAGE_SIZE
  const offset = options.offset ?? 0

  const { data, error } = await supabase
    .from('community_posts')
    .select(
      `
      *,
      author:profiles!community_posts_author_id_profiles_fkey(id, full_name),
      votes:community_votes(post_id, user_id, vote),
      comments:community_comments(id)
      `
    )
    .eq('author_id', authorId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit)

  if (error) return { data: null, error: error.message }

  const raw = (data ?? []) as unknown as PostRow[]
  const hasMore = raw.length > limit
  const posts = raw.slice(0, limit).map((row) => mapPostRow(row, currentUserId))

  return { data: { posts, hasMore }, error: null }
}

// ─── Public profile fetch (for community user page) ──────────────────────────

export async function getPublicProfile(
  userId: string
): Promise<ServiceResult<{ id: string; full_name: string | null; created_at: string }>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'User not found.' }

  const row = data as unknown as ProfileRow

  return {
    data: { id: row.id, full_name: row.full_name, created_at: row.created_at },
    error: null,
  }
}

// ─── Author stats ─────────────────────────────────────────────────────────────

export async function getAuthorStats(
  authorId: string
): Promise<ServiceResult<{ totalPosts: number; totalUpvotes: number }>> {
  const supabase = createClient()

  const postsRes = await supabase
    .from('community_posts')
    .select('id', { count: 'exact' })
    .eq('author_id', authorId)
    .is('deleted_at', null)

  if (postsRes.error) return { data: null, error: postsRes.error.message }

  const postIds = (postsRes.data ?? []).map((p) => p.id)

  let totalUpvotes = 0
  if (postIds.length > 0) {
    const votesRes = await supabase
      .from('community_votes')
      .select('id', { count: 'exact' })
      .in('post_id', postIds)
      .eq('vote', 1)

    if (votesRes.error) return { data: null, error: votesRes.error.message }
    totalUpvotes = votesRes.count ?? 0
  }

  return {
    data: {
      totalPosts: postsRes.count ?? 0,
      totalUpvotes,
    },
    error: null,
  }
}

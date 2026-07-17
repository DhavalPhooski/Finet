import { createClient } from '@/lib/supabase/client'
import type {
  CommunityPostWithMeta,
  CommunityPostInsert,
  CommunityPostUpdate,
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

/**
 * Fetch paginated community posts with author info, vote counts,
 * and comment count. Only returns non-deleted posts.
 *
 * Vote aggregation is done client-side from the joined rows to avoid
 * a custom DB function dependency.
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
    .range(offset, offset + limit)   // fetch limit+1 to detect hasMore

  if (options.label) {
    query = query.eq('label', options.label)
  }

  if (options.search?.trim()) {
    const term = options.search.trim()
    query = query.or(`content.ilike.%${term}%,label.ilike.%${term}%`)
  }

  const { data, error } = await query

  if (error) return { data: null, error: error.message }

  const raw = data ?? []
  const hasMore = raw.length > limit
  const slice = raw.slice(0, limit)

  const posts: CommunityPostWithMeta[] = slice.map((row) => {
    const votes = (row.votes as { post_id: string; user_id: string; vote: number }[]) ?? []
    const upvotes = votes.filter((v) => v.vote === 1).length
    const downvotes = votes.filter((v) => v.vote === -1).length
    const userVoteRow = currentUserId
      ? votes.find((v) => v.user_id === currentUserId)
      : null
    const user_vote = userVoteRow
      ? (userVoteRow.vote as 1 | -1)
      : null

    return {
      id: row.id,
      author_id: row.author_id,
      content: row.content,
      label: row.label,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at,
      author: row.author as { id: string; full_name: string | null },
      upvotes,
      downvotes,
      score: upvotes - downvotes,
      comment_count: (row.comments as { id: string }[])?.length ?? 0,
      user_vote,
    }
  })

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

  const post: CommunityPostWithMeta = {
    ...data,
    author: data.author as { id: string; full_name: string | null },
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
    .update({ deleted_at: new Date().toISOString() } as CommunityPostUpdate)
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

  const raw = data ?? []
  const hasMore = raw.length > limit

  const posts: CommunityPostWithMeta[] = raw.slice(0, limit).map((row) => {
    const votes = (row.votes as { post_id: string; user_id: string; vote: number }[]) ?? []
    const upvotes = votes.filter((v) => v.vote === 1).length
    const downvotes = votes.filter((v) => v.vote === -1).length
    const userVoteRow = currentUserId
      ? votes.find((v) => v.user_id === currentUserId)
      : null

    return {
      id: row.id,
      author_id: row.author_id,
      content: row.content,
      label: row.label,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at,
      author: row.author as { id: string; full_name: string | null },
      upvotes,
      downvotes,
      score: upvotes - downvotes,
      comment_count: (row.comments as { id: string }[])?.length ?? 0,
      user_vote: userVoteRow ? (userVoteRow.vote as 1 | -1) : null,
    }
  })

  return { data: { posts, hasMore }, error: null }
}

// ─── Author stats (for profile page) ─────────────────────────────────────────

export async function getAuthorStats(
  authorId: string
): Promise<ServiceResult<{ totalPosts: number; totalUpvotes: number }>> {
  const supabase = createClient()

  const [postsRes, votesRes] = await Promise.all([
    supabase
      .from('community_posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', authorId)
      .is('deleted_at', null),
    supabase
      .from('community_votes')
      .select('community_posts!inner(author_id)', { count: 'exact', head: true })
      .eq('community_posts.author_id', authorId)
      .eq('vote', 1),
  ])

  if (postsRes.error) return { data: null, error: postsRes.error.message }
  if (votesRes.error) return { data: null, error: votesRes.error.message }

  return {
    data: {
      totalPosts: postsRes.count ?? 0,
      totalUpvotes: votesRes.count ?? 0,
    },
    error: null,
  }
}

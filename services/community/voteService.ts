import { createClient } from '@/lib/supabase/client'
import type { CommunityVote, ServiceResult } from '@/types'

/**
 * Vote service — upsert, remove, and fetch votes.
 *
 * Business rules:
 * - One vote per user per post (enforced by DB UNIQUE constraint)
 * - Clicking the same vote again removes it (toggle)
 * - Changing vote direction updates the existing row
 */

// ─── Upsert vote ──────────────────────────────────────────────────────────────

export async function upsertVote(
  postId: string,
  userId: string,
  vote: 1 | -1
): Promise<ServiceResult<CommunityVote>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('community_votes')
    .upsert(
      { post_id: postId, user_id: userId, vote },
      { onConflict: 'post_id,user_id' }
    )
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Failed to record vote.' }
  return { data, error: null }
}

// ─── Remove vote ──────────────────────────────────────────────────────────────

export async function removeVote(
  postId: string,
  userId: string
): Promise<ServiceResult<null>> {
  const supabase = createClient()

  const { error } = await supabase
    .from('community_votes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

// ─── Get all votes by current user ───────────────────────────────────────────
// Used to hydrate feed vote state without re-fetching each post.

export async function getUserVotes(
  userId: string
): Promise<ServiceResult<CommunityVote[]>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('community_votes')
    .select('*')
    .eq('user_id', userId)

  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

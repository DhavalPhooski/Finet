'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getUserPosts, getAuthorStats } from '@/services/community/postService'
import { createClient } from '@/lib/supabase/client'
import { CommunityPost } from '@/components/community/CommunityPost'
import { useCommunityFeed } from '@/hooks/useCommunityFeed'
import { FullPageLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import type { CommunityPostWithMeta } from '@/types'

interface AuthorProfile {
  id: string
  full_name: string | null
  created_at: string
}

/**
 * /community/user/[id] — public user profile page.
 * Shows the author's name, join date, stats, and all their posts.
 */
export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  // We need the feed hook only for vote/delete actions on listed posts
  const feed = useCommunityFeed()

  const [profile, setProfile] = useState<AuthorProfile | null>(null)
  const [posts, setPosts] = useState<CommunityPostWithMeta[]>([])
  const [stats, setStats] = useState<{ totalPosts: number; totalUpvotes: number } | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    async function load() {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()

      // Fetch profile (only public fields)
      const profileRes = await supabase
        .from('profiles')
        .select('id, full_name, created_at')
        .eq('id', id)
        .single()

      if (profileRes.error || !profileRes.data) {
        setError('User not found.')
        setIsLoading(false)
        return
      }
      setProfile(profileRes.data as AuthorProfile)

      // Fetch posts + stats in parallel
      const [postsResult, statsResult] = await Promise.all([
        getUserPosts(id, user?.id ?? null),
        getAuthorStats(id),
      ])

      if (postsResult.error) setError(postsResult.error)
      else {
        setPosts(postsResult.data.posts)
        setHasMore(postsResult.data.hasMore)
      }

      if (statsResult.data) setStats(statsResult.data)

      setIsLoading(false)
    }

    load()
  }, [id, user?.id])

  if (isLoading) return <FullPageLoader label="Loading profile…" />
  if (error) return <ErrorMessage message={error} />
  if (!profile) return null

  const joinDate = new Date(profile.created_at).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Profile card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xl font-bold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
            {(profile.full_name ?? '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {profile.full_name ?? 'Anonymous'}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Member since {joinDate}
            </p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-800">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Posts
              </p>
              <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {stats.totalPosts}
              </p>
            </div>
            <div className="rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-800">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Upvotes received
              </p>
              <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.totalUpvotes}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Posts */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Posts
        </h2>

        {posts.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
            No posts yet.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <CommunityPost
                key={post.id}
                post={post}
                onVote={feed.vote}
                onDelete={async (postId) => {
                  const err = await feed.deletePost(postId)
                  if (!err) setPosts((prev) => prev.filter((p) => p.id !== postId))
                  return err
                }}
              />
            ))}
            {hasMore && (
              <p className="py-2 text-center text-xs text-zinc-400 dark:text-zinc-500">
                Showing first 20 posts.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

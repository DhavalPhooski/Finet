'use client'

import { useCommunityFeed } from '@/hooks/useCommunityFeed'
import { CommunityFeed } from '@/components/community/CommunityFeed'
import { CreatePost } from '@/components/community/CreatePost'
import { FeedFilters } from '@/components/community/FeedFilters'

/**
 * /community — main community feed page.
 * All state lives in useCommunityFeed; this page just wires it to UI.
 */
export default function CommunityPage() {
  const feed = useCommunityFeed()

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Community
        </h1>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          Tips, questions, and wins from the FINET community
        </p>
      </div>

      {/* Create post */}
      <CreatePost onSubmit={feed.addPost} />

      {/* Filters */}
      <FeedFilters
        filters={feed.filters}
        onFilterChange={feed.setFilters}
        onReset={feed.resetFilters}
        isPending={feed.isFiltering}
      />

      {/* Feed */}
      <CommunityFeed
        feed={feed}
        onLabelClick={(label) => feed.setFilters({ label })}
      />
    </div>
  )
}

/**
 * Skeleton placeholder for ExpertCard while data is loading.
 * Matches the exact layout of ExpertCard so there's no layout shift.
 */
export function ExpertCardSkeleton() {
  return (
    <div
      className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
      aria-hidden="true"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="h-12 w-12 shrink-0 rounded-full bg-zinc-200 animate-pulse dark:bg-zinc-700" />
        <div className="flex-1 space-y-2 pt-1">
          {/* Name */}
          <div className="h-3.5 w-32 rounded bg-zinc-200 animate-pulse dark:bg-zinc-700" />
          {/* Experience */}
          <div className="h-3 w-24 rounded bg-zinc-100 animate-pulse dark:bg-zinc-800" />
        </div>
      </div>

      {/* Bio lines */}
      <div className="mt-3 space-y-1.5">
        <div className="h-3 w-full rounded bg-zinc-100 animate-pulse dark:bg-zinc-800" />
        <div className="h-3 w-4/5 rounded bg-zinc-100 animate-pulse dark:bg-zinc-800" />
      </div>

      {/* Specialization pills */}
      <div className="mt-3 flex gap-1.5">
        <div className="h-5 w-16 rounded-full bg-zinc-100 animate-pulse dark:bg-zinc-800" />
        <div className="h-5 w-20 rounded-full bg-zinc-100 animate-pulse dark:bg-zinc-800" />
        <div className="h-5 w-14 rounded-full bg-zinc-100 animate-pulse dark:bg-zinc-800" />
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="h-3.5 w-12 rounded bg-zinc-100 animate-pulse dark:bg-zinc-800" />
          <div className="h-3.5 w-16 rounded bg-zinc-100 animate-pulse dark:bg-zinc-800" />
        </div>
        <div className="h-7 w-24 rounded-lg bg-zinc-200 animate-pulse dark:bg-zinc-700" />
      </div>
    </div>
  )
}

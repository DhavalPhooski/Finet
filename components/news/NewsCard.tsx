import type { NewsArticle } from '@/types'

interface NewsCardProps {
  article: NewsArticle
}

/**
 * Single news article card — links out to the original article.
 */
export function NewsCard({ article }: NewsCardProps) {
  if (!article.url) return null

  const pubDate = article.published_at ? formatDate(article.published_at) : null
  const category = article.category?.[0] ?? null

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
      aria-label={`Read: ${article.title}`}
    >
      {/* Thumbnail */}
      {article.image && (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.image}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {article.source && (
            <span className="font-medium text-zinc-500 dark:text-zinc-400">
              {article.source}
            </span>
          )}
          {pubDate && (
            <>
              {article.source && <span className="text-zinc-300 dark:text-zinc-700">·</span>}
              <span className="text-zinc-400 dark:text-zinc-500">{pubDate}</span>
            </>
          )}
          {category && (
            <>
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium capitalize text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {category}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 group-hover:text-zinc-700 dark:text-zinc-50 dark:group-hover:text-zinc-200">
          {article.title}
        </h3>

        {/* Description */}
        {article.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {article.description}
          </p>
        )}

        <span className="mt-1 flex items-center gap-1 text-xs font-medium text-zinc-400 transition group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
          Read article <ArrowIcon />
        </span>
      </div>
    </a>
  )
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

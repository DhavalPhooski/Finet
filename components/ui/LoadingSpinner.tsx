interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
}

/**
 * Accessible inline loading spinner.
 * Uses a visible border trick — no external icon library needed.
 */
export function LoadingSpinner({ size = 'md', label = 'Loading…' }: LoadingSpinnerProps) {
  return (
    <span role="status" aria-label={label} className="inline-flex items-center gap-2">
      <span
        className={`${sizeMap[size]} animate-spin rounded-full border-current border-t-transparent`}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}

/**
 * Full-page loading overlay — used while the auth session is initialising.
 */
export function FullPageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background"
      role="status"
      aria-label={label}
    >
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" label={label} />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      </div>
    </div>
  )
}

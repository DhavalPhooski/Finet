interface StatCardProps {
  label: string
  value: string
  subValue?: string
  accentColor?: string   // tailwind bg class e.g. 'bg-red-100 dark:bg-red-950'
  valueColor?: string    // tailwind text class e.g. 'text-red-700 dark:text-red-400'
  icon?: string          // emoji
}

/**
 * Reusable stat display card.
 * Used across the dashboard for income, allocation buckets, and remaining budget.
 */
export function StatCard({
  label,
  value,
  subValue,
  accentColor = 'bg-zinc-50 dark:bg-zinc-900',
  valueColor = 'text-zinc-900 dark:text-zinc-50',
  icon,
}: StatCardProps) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 ${accentColor}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
        {icon && (
          <span className="text-base leading-none" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <p className={`mt-2 text-2xl font-bold ${valueColor}`}>{value}</p>
      {subValue && (
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subValue}</p>
      )}
    </div>
  )
}

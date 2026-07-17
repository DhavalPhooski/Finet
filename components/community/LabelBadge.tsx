import { COMMUNITY_LABELS } from '@/types'

interface LabelBadgeProps {
  label: string
  size?: 'sm' | 'md'
  onClick?: () => void
}

/**
 * Coloured pill badge for a community post label.
 * Colour is driven by COMMUNITY_LABELS — single source of truth.
 */
export function LabelBadge({ label, size = 'sm', onClick }: LabelBadgeProps) {
  const config = COMMUNITY_LABELS.find((l) => l.value === label)
  const color = config?.color ?? 'bg-zinc-100 dark:bg-zinc-800'
  const textColor = config?.textColor ?? 'text-zinc-600 dark:text-zinc-400'

  const sizeClass = size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-xs'

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center rounded-full font-medium transition hover:opacity-80 ${color} ${textColor} ${sizeClass}`}
      >
        {label}
      </button>
    )
  }

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${color} ${textColor} ${sizeClass}`}>
      {label}
    </span>
  )
}

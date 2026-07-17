'use client'

export type AppointmentTab = 'upcoming' | 'past' | 'cancelled'

interface AppointmentTabsProps {
  active: AppointmentTab
  counts: { upcoming: number; past: number; cancelled: number }
  onChange: (tab: AppointmentTab) => void
}

const TABS: { key: AppointmentTab; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past',     label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
]

/**
 * Tab bar for the appointment dashboard.
 * Shows a count badge next to each tab label.
 */
export function AppointmentTabs({ active, counts, onChange }: AppointmentTabsProps) {
  return (
    <div
      className="flex gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900"
      role="tablist"
      aria-label="Appointment tabs"
    >
      {TABS.map(({ key, label }) => {
        const isActive = active === key
        const count = counts[key]

        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-400/20 ${
              isActive
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
            }`}
          >
            {label}
            {count > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200'
                    : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

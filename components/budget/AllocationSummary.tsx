'use client'

import { formatCurrency, formatPercent } from '@/utils/allocation'
import type { Allocation, BudgetNodeWithStats } from '@/types'

interface AllocationSummaryProps {
  allocation: Allocation
  nodeTree: BudgetNodeWithStats[]
  remainingBudget: number
}

/**
 * Displays the 50/30/20 summary row with spent vs allocated per bucket,
 * plus a colour-coded progress bar across the full income.
 */
export function AllocationSummary({
  allocation,
  nodeTree,
  remainingBudget,
}: AllocationSummaryProps) {
  if (allocation.income <= 0) return null

  // Aggregate spent per root bucket (matched by sort_order: 0=Needs,1=Wants,2=Investments)
  const buckets: BucketConfig[] = [
    {
      label: 'Needs',
      subLabel: '50%',
      allocated: allocation.needs,
      color: 'bg-red-500',
      lightColor: 'bg-red-100 dark:bg-red-950',
      textColor: 'text-red-700 dark:text-red-400',
      node: nodeTree.find((n) => n.sort_order === 0) ?? null,
    },
    {
      label: 'Wants',
      subLabel: '30%',
      allocated: allocation.wants,
      color: 'bg-amber-400',
      lightColor: 'bg-amber-100 dark:bg-amber-950',
      textColor: 'text-amber-700 dark:text-amber-400',
      node: nodeTree.find((n) => n.sort_order === 1) ?? null,
    },
    {
      label: 'Investments',
      subLabel: '20%',
      allocated: allocation.investments,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-100 dark:bg-emerald-950',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      node: nodeTree.find((n) => n.sort_order === 2) ?? null,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Bucket cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {buckets.map((bucket) => {
          const spent = bucket.node?.spent_amount ?? 0
          const percentUsed =
            bucket.allocated > 0
              ? Math.min(100, (spent / bucket.allocated) * 100)
              : 0

          return (
            <div
              key={bucket.label}
              className={`rounded-xl p-4 ${bucket.lightColor}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${bucket.textColor}`}>
                    {bucket.label}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {bucket.subLabel} of income
                  </p>
                </div>
                <span className={`text-xs font-medium ${bucket.textColor}`}>
                  {formatPercent(percentUsed)}
                </span>
              </div>

              <p className="mt-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatCurrency(bucket.allocated)}
              </p>

              <div className="mt-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Spent: {formatCurrency(spent)}</span>
                <span>Left: {formatCurrency(bucket.allocated - spent)}</span>
              </div>

              {/* Mini progress bar */}
              <div
                className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/50 dark:bg-black/20"
                role="progressbar"
                aria-valuenow={Math.round(percentUsed)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${bucket.label} usage`}
              >
                <div
                  className={`h-full rounded-full transition-all ${bucket.color}`}
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Full-width remaining budget bar */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Total remaining budget
          </p>
          <p
            className={`text-base font-bold ${
              remainingBudget < 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {formatCurrency(remainingBudget)}
          </p>
        </div>

        {/* Overall spending bar */}
        {(() => {
          const totalSpent = allocation.income - remainingBudget
          const overallPercent =
            allocation.income > 0
              ? Math.min(100, (totalSpent / allocation.income) * 100)
              : 0
          const barColor =
            overallPercent >= 100
              ? 'bg-red-500'
              : overallPercent >= 80
              ? 'bg-amber-400'
              : 'bg-emerald-500'

          return (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-zinc-400">
                <span>{formatCurrency(totalSpent)} spent</span>
                <span>{formatCurrency(allocation.income)} income</span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
                role="progressbar"
                aria-valuenow={Math.round(overallPercent)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Overall budget usage"
              >
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface BucketConfig {
  label: string
  subLabel: string
  allocated: number
  color: string
  lightColor: string
  textColor: string
  node: BudgetNodeWithStats | null
}

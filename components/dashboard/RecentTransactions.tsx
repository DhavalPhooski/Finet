'use client'

import Link from 'next/link'
import { formatCurrency } from '@/utils/allocation'
import type { Transaction, BudgetNode } from '@/types'

interface RecentTransactionsProps {
  transactions: Transaction[]
  budgetNodes: BudgetNode[]
  isLoading: boolean
}

/**
 * Dashboard widget — shows the 5 most recent expenses.
 * A link to the full transactions page is shown at the bottom.
 */
export function RecentTransactions({
  transactions,
  budgetNodes,
  isLoading,
}: RecentTransactionsProps) {
  const recent = transactions.slice(0, 5)

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Recent expenses
        </h2>
        <Link
          href="/transactions"
          className="text-xs font-medium text-zinc-500 underline-offset-4 hover:underline dark:text-zinc-400"
        >
          View all
        </Link>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-700 dark:border-t-zinc-300" />
        </div>
      ) : recent.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
          No expenses yet.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {recent.map((tx) => {
            const node = budgetNodes.find((n) => n.id === tx.budget_node_id)
            const displayDate = new Date(tx.date + 'T00:00:00').toLocaleDateString(
              'en-IN',
              { day: 'numeric', month: 'short' }
            )

            return (
              <li key={tx.id} className="flex items-center gap-3 px-4 py-3">
                {/* Category dot */}
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: node?.color ?? '#a1a1aa' }}
                  aria-hidden="true"
                />

                {/* Title + meta */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {tx.title}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {displayDate}
                    {node && (
                      <>
                        {' · '}
                        {node.icon && (
                          <span aria-hidden="true">{node.icon} </span>
                        )}
                        {node.title}
                      </>
                    )}
                  </p>
                </div>

                {/* Amount */}
                <span className="shrink-0 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatCurrency(Number(tx.amount))}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

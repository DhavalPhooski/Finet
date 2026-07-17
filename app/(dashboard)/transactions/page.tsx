'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useBudget } from '@/hooks/useBudget'
import { useTransactions } from '@/hooks/useTransactions'
import { TransactionList } from '@/components/transactions/TransactionList'
import { FullPageLoader } from '@/components/ui/LoadingSpinner'

/**
 * Full expense history page — linked from the dashboard "View all" button.
 * Uses TransactionList which includes the full filter bar.
 */
export default function TransactionsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const tx = useTransactions()
  const budget = useBudget(tx.allTransactions)
  const [showAddForm, setShowAddForm] = useState(false)

  if (authLoading) return <FullPageLoader label="Loading…" />
  if (!user) return null

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Expenses
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            {tx.allTransactions.length}{' '}
            {tx.allTransactions.length === 1 ? 'transaction' : 'transactions'} total
          </p>
        </div>

        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex h-9 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          <span aria-hidden="true">+</span>
          Add expense
        </button>
      </div>

      {/* Transaction list with filter bar */}
      <TransactionList
        tx={tx}
        budgetNodes={budget.nodes}
        userId={user.id}
        showAddForm={showAddForm}
        onHideAddForm={() => setShowAddForm(false)}
      />
    </div>
  )
}

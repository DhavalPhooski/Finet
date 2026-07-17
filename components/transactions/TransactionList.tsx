'use client'

import { useState } from 'react'
import { TransactionItem } from './TransactionItem'
import { TransactionForm } from './TransactionForm'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import type { Transaction, BudgetNode } from '@/types'
import type { UseTransactionsReturn, TransactionFilterState } from '@/hooks/useTransactions'

interface TransactionListProps {
  tx: UseTransactionsReturn
  budgetNodes: BudgetNode[]
  userId: string
  /** When true, shows the inline add form at the top */
  showAddForm?: boolean
  onHideAddForm?: () => void
}

export function TransactionList({
  tx,
  budgetNodes,
  userId,
  showAddForm = false,
  onHideAddForm,
}: TransactionListProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // ── Handlers ───────────────────────────────────────────────

  async function handleAdd(
    payload: Parameters<UseTransactionsReturn['addTransaction']>[0]
  ): Promise<string | null> {
    setActionError(null)
    const err = await tx.addTransaction(payload)
    if (err) { setActionError(err); return err }
    onHideAddForm?.()
    return null
  }

  async function handleEdit(
    payload: Parameters<UseTransactionsReturn['editTransaction']>[1]
  ): Promise<string | null> {
    if (!editingTransaction) return null
    setActionError(null)
    const err = await tx.editTransaction(editingTransaction.id, payload)
    if (err) { setActionError(err); return err }
    setEditingTransaction(null)
    return null
  }

  async function handleDelete(id: string): Promise<string | null> {
    setActionError(null)
    const err = await tx.removeTransaction(id)
    if (err) setActionError(err)
    return err
  }

  // ── Loading ────────────────────────────────────────────────

  if (tx.isLoading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner size="lg" label="Loading expenses…" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Add form */}
      {showAddForm && (
        <TransactionForm
          budgetNodes={budgetNodes}
          userId={userId}
          onSubmit={handleAdd}
          onCancel={() => onHideAddForm?.()}
        />
      )}

      {/* Edit form (inline modal-like) */}
      {editingTransaction && (
        <TransactionForm
          transaction={editingTransaction}
          budgetNodes={budgetNodes}
          userId={userId}
          onSubmit={handleEdit}
          onCancel={() => setEditingTransaction(null)}
        />
      )}

      <ErrorMessage message={actionError} />

      {/* Filters */}
      <FilterBar
        filters={tx.filters}
        budgetNodes={budgetNodes}
        onFilterChange={tx.setFilters}
        onReset={tx.resetFilters}
        isPending={tx.isFiltering}
      />

      {/* List */}
      {tx.filteredTransactions.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
          {hasActiveFilters(tx.filters)
            ? 'No expenses match your filters.'
            : 'No expenses yet. Add your first expense above.'}
        </p>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <ul
            className="divide-y divide-zinc-100 dark:divide-zinc-800"
            aria-label="Expense list"
          >
            {tx.filteredTransactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                budgetNodes={budgetNodes}
                onEdit={setEditingTransaction}
                onDelete={handleDelete}
              />
            ))}
          </ul>

          {/* Count footer */}
          <div className="border-t border-zinc-100 px-4 py-2 dark:border-zinc-800">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {tx.filteredTransactions.length}{' '}
              {tx.filteredTransactions.length === 1 ? 'expense' : 'expenses'}
              {hasActiveFilters(tx.filters) &&
                ` (filtered from ${tx.allTransactions.length} total)`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  filters: TransactionFilterState
  budgetNodes: BudgetNode[]
  onFilterChange: (partial: Partial<TransactionFilterState>) => void
  onReset: () => void
  isPending: boolean
}

function FilterBar({
  filters,
  budgetNodes,
  onFilterChange,
  onReset,
  isPending,
}: FilterBarProps) {
  const isActive = hasActiveFilters(filters)

  // Category options for the select
  const roots = budgetNodes
    .filter((n) => n.parent_id === null)
    .sort((a, b) => a.sort_order - b.sort_order)

  const children = (parentId: string) =>
    budgetNodes
      .filter((n) => n.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="flex flex-col gap-2">
      {/* Search */}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400">
          <SearchIcon />
        </span>
        <input
          type="search"
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          placeholder="Search expenses…"
          aria-label="Search expenses"
          className={`w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 ${isPending ? 'opacity-60' : ''}`}
        />
      </div>

      {/* Category + date row */}
      <div className="flex flex-wrap gap-2">
        {/* Category */}
        <select
          value={filters.budgetNodeId ?? ''}
          onChange={(e) =>
            onFilterChange({ budgetNodeId: e.target.value || null })
          }
          aria-label="Filter by category"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          <option value="">All categories</option>
          {roots.map((root) => (
            <optgroup key={root.id} label={`${root.icon ?? ''} ${root.title}`.trim()}>
              <option value={root.id}>{root.title} (all)</option>
              {children(root.id).map((child) => (
                <option key={child.id} value={child.id}>
                  {child.icon ?? ''} {child.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* Date from */}
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => onFilterChange({ dateFrom: e.target.value })}
          aria-label="Filter from date"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        />

        {/* Date to */}
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => onFilterChange({ dateTo: e.target.value })}
          aria-label="Filter to date"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        />

        {/* Clear filters */}
        {isActive && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasActiveFilters(filters: TransactionFilterState): boolean {
  return !!(
    filters.search ||
    filters.budgetNodeId !== null ||
    filters.dateFrom ||
    filters.dateTo
  )
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

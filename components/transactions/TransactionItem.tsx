'use client'

import { useState } from 'react'
import { formatCurrency } from '@/utils/allocation'
import type { Transaction, BudgetNode } from '@/types'

interface TransactionItemProps {
  transaction: Transaction
  budgetNodes: BudgetNode[]
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => Promise<string | null>
}

export function TransactionItem({
  transaction,
  budgetNodes,
  onEdit,
  onDelete,
}: TransactionItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const node = budgetNodes.find((n) => n.id === transaction.budget_node_id)

  async function handleDelete() {
    if (!confirm(`Delete "${transaction.title}"?`)) return
    setIsDeleting(true)
    setDeleteError(null)
    const err = await onDelete(transaction.id)
    if (err) {
      setDeleteError(err)
      setIsDeleting(false)
    }
  }

  // Format date as "15 Jun 2026"
  const displayDate = new Date(transaction.date + 'T00:00:00').toLocaleDateString(
    'en-IN',
    { day: 'numeric', month: 'short', year: 'numeric' }
  )

  return (
    <li className="group flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Category colour dot */}
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: node?.color ?? '#a1a1aa' }}
          aria-hidden="true"
        />

        {/* Main info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsExpanded((v) => !v)}
              className="truncate text-left text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
              aria-expanded={isExpanded}
            >
              {transaction.title}
            </button>
            <span className="shrink-0 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {formatCurrency(Number(transaction.amount))}
            </span>
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-400 dark:text-zinc-500">
            <span>{displayDate}</span>
            {node && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  {node.icon && <span aria-hidden="true">{node.icon} </span>}
                  {node.title}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions — visible on hover / focus */}
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <button
            onClick={() => onEdit(transaction)}
            className="rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label={`Edit ${transaction.title}`}
          >
            <PencilIcon />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded p-1 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950 dark:hover:text-red-400"
            aria-label={`Delete ${transaction.title}`}
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* Expanded note */}
      {isExpanded && transaction.note && (
        <div className="mx-4 mb-3 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Note
          </p>
          <p className="whitespace-pre-wrap">{transaction.note}</p>
        </div>
      )}

      {deleteError && (
        <p className="mx-4 mb-2 text-xs text-red-600 dark:text-red-400">
          {deleteError}
        </p>
      )}
    </li>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M9.917 1.75a1.237 1.237 0 011.75 1.75L4.083 11.083 1.75 11.667l.583-2.334L9.917 1.75z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M1.75 3.5h10.5M5.25 3.5V2.333A.583.583 0 015.833 1.75h2.334a.583.583 0 01.583.583V3.5m1.75 0v8.167a.583.583 0 01-.583.583H4.083a.583.583 0 01-.583-.583V3.5h8.167z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

'use client'

import { useState } from 'react'
import { formatCurrency, formatPercent } from '@/utils/allocation'
import type { BudgetNodeWithStats, BudgetNodeUpdate } from '@/types'

interface BudgetNodeCardProps {
  node: BudgetNodeWithStats
  onEdit: (id: string, updates: BudgetNodeUpdate) => Promise<string | null>
  onDelete: (id: string) => Promise<string | null>
  onAddChild?: (parentId: string) => void
  /** True when this is a root node (Needs / Wants / Investments) */
  isRoot?: boolean
}

export function BudgetNodeCard({
  node,
  onEdit,
  onDelete,
  onAddChild,
  isRoot = false,
}: BudgetNodeCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const percentUsed = node.percent_used
  const isOverBudget = node.remaining_amount < 0

  // Progress bar colour
  const barColor =
    percentUsed >= 100
      ? 'bg-red-500'
      : percentUsed >= 80
      ? 'bg-amber-400'
      : 'bg-emerald-500'

  async function handleDelete() {
    if (!confirm(`Delete "${node.title}"? This cannot be undone.`)) return
    setIsDeleting(true)
    setDeleteError(null)
    const err = await onDelete(node.id)
    if (err) {
      setDeleteError(err)
      setIsDeleting(false)
    }
  }

  return (
    <div
      className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      style={{ borderLeftColor: node.color ?? undefined, borderLeftWidth: node.color ? 3 : undefined }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {node.icon && (
            <span className="text-lg leading-none" aria-hidden="true">
              {node.icon}
            </span>
          )}
          <span className="truncate font-medium text-zinc-900 dark:text-zinc-50">
            {node.title}
          </span>
          {isRoot && (
            <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              root
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          {onAddChild && (
            <button
              onClick={() => onAddChild(node.id)}
              className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              title="Add sub-category"
              aria-label={`Add sub-category to ${node.title}`}
            >
              <PlusIcon />
            </button>
          )}
          {!isRoot && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-md p-1 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950 dark:hover:text-red-400"
              title="Delete node"
              aria-label={`Delete ${node.title}`}
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </div>

      {/* Allocation figures */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat label="Allocated" value={formatCurrency(Number(node.allocated_amount))} />
        <Stat label="Spent" value={formatCurrency(node.spent_amount)} />
        <Stat
          label="Remaining"
          value={formatCurrency(node.remaining_amount)}
          valueClassName={isOverBudget ? 'text-red-600 dark:text-red-400' : undefined}
        />
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>{formatPercent(percentUsed)} used</span>
          {isOverBudget && (
            <span className="font-medium text-red-600 dark:text-red-400">Over budget!</span>
          )}
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
          role="progressbar"
          aria-valuenow={Math.min(percentUsed, 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${node.title} usage`}
        >
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(percentUsed, 100)}%` }}
          />
        </div>
      </div>

      {deleteError && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{deleteError}</p>
      )}

      {/* Children */}
      {node.children.length > 0 && (
        <div className="mt-3 flex flex-col gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          {node.children.map((child) => (
            <BudgetNodeCard
              key={child.id}
              node={child}
              onEdit={onEdit}
              onDelete={onDelete}
              isRoot={false}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div>
      <p className="text-xs text-zinc-400 dark:text-zinc-500">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50 ${valueClassName ?? ''}`}>
        {value}
      </p>
    </div>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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

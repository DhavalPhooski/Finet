'use client'

import { useState, type FormEvent } from 'react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatCurrency } from '@/utils/allocation'
import type { Transaction, TransactionInsert, TransactionUpdate, BudgetNode } from '@/types'

interface TransactionFormProps {
  /** Pass to pre-fill form when editing */
  transaction?: Transaction
  /** Flat list of all budget nodes for the category picker */
  budgetNodes: BudgetNode[]
  userId: string
  onSubmit: (
    payload: TransactionInsert | TransactionUpdate
  ) => Promise<string | null>
  onCancel: () => void
}

export function TransactionForm({
  transaction,
  budgetNodes,
  userId,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const isEditing = !!transaction

  const today = new Date().toISOString().split('T')[0]

  const [title, setTitle] = useState(transaction?.title ?? '')
  const [amount, setAmount] = useState(
    transaction ? String(transaction.amount) : ''
  )
  const [date, setDate] = useState(transaction?.date ?? today)
  const [budgetNodeId, setBudgetNodeId] = useState<string>(
    transaction?.budget_node_id ?? ''
  )
  const [note, setNote] = useState(transaction?.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Build category options: flat list with indentation for children
  const categoryOptions = buildCategoryOptions(budgetNodes)

  function validate(): string | null {
    if (!title.trim()) return 'Title is required.'
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) return 'Enter a valid amount greater than zero.'
    if (!date) return 'Date is required.'
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)

    const payload: TransactionInsert | TransactionUpdate = {
      title: title.trim(),
      amount: parseFloat(amount),
      date,
      budget_node_id: budgetNodeId || null,
      note: note.trim() || null,
      ...(isEditing ? {} : { user_id: userId }),
    }

    const err = await onSubmit(payload)
    if (err) {
      setError(err)
      setIsSubmitting(false)
    }
    // Parent closes the form on success
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
      aria-label={isEditing ? 'Edit expense' : 'Add expense'}
      noValidate
    >
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {isEditing ? 'Edit expense' : 'Add expense'}
      </p>

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="tx-title"
          className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
        >
          Title
        </label>
        <input
          id="tx-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Grocery run at DMart"
          disabled={isSubmitting}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      {/* Amount + Date (side by side on wide screens) */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="tx-amount"
            className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
          >
            Amount (₹)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-zinc-400">
              ₹
            </span>
            <input
              id="tx-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-7 pr-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="tx-date"
            className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
          >
            Date
          </label>
          <input
            id="tx-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={isSubmitting}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="tx-category"
          className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
        >
          Category <span className="text-zinc-400">(optional)</span>
        </label>
        <select
          id="tx-category"
          value={budgetNodeId}
          onChange={(e) => setBudgetNodeId(e.target.value)}
          disabled={isSubmitting}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="">Uncategorised</option>
          {categoryOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Note */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="tx-note"
          className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
        >
          Note <span className="text-zinc-400">(optional)</span>
        </label>
        <textarea
          id="tx-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={`e.g. "Paid electricity bill for June"`}
          rows={3}
          disabled={isSubmitting}
          className="resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <ErrorMessage message={error} />

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {isSubmitting ? (
            <><LoadingSpinner size="sm" /><span>Saving…</span></>
          ) : isEditing ? (
            'Save changes'
          ) : (
            'Add expense'
          )}
        </button>
      </div>
    </form>
  )
}

// ─── Category options builder ─────────────────────────────────────────────────

interface CategoryOption {
  id: string
  label: string
}

function buildCategoryOptions(nodes: BudgetNode[]): CategoryOption[] {
  const roots = nodes
    .filter((n) => n.parent_id === null)
    .sort((a, b) => a.sort_order - b.sort_order)

  const options: CategoryOption[] = []

  for (const root of roots) {
    options.push({ id: root.id, label: `${root.icon ?? ''} ${root.title}`.trim() })

    const children = nodes
      .filter((n) => n.parent_id === root.id)
      .sort((a, b) => a.sort_order - b.sort_order)

    for (const child of children) {
      options.push({
        id: child.id,
        label: `  └ ${child.icon ?? ''} ${child.title}`.trim(),
      })
    }
  }

  return options
}

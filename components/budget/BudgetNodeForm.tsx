'use client'

import { useState, type FormEvent } from 'react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatCurrency } from '@/utils/allocation'
import type { BudgetNode, BudgetNodeInsert, BudgetNodeUpdate } from '@/types'

// ─── Preset colours + icons ───────────────────────────────────────────────────

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
]

const PRESET_ICONS = ['🏠', '🍔', '🚗', '💡', '🎯', '🎬', '✈️', '👗', '📚', '💊', '📈', '💰']

// ─── Props ────────────────────────────────────────────────────────────────────

interface BudgetNodeFormProps {
  /** Editing an existing node */
  node?: BudgetNode
  /** Parent node — required when creating a child */
  parentNode?: BudgetNode
  /** All sibling nodes — used for available allocation calculation */
  siblings?: BudgetNode[]
  onSubmit: (payload: BudgetNodeInsert | BudgetNodeUpdate) => Promise<string | null>
  onCancel: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BudgetNodeForm({
  node,
  parentNode,
  siblings = [],
  onSubmit,
  onCancel,
}: BudgetNodeFormProps) {
  const isEditing = !!node

  const [title, setTitle] = useState(node?.title ?? '')
  const [amount, setAmount] = useState(
    node ? String(node.allocated_amount) : ''
  )
  const [color, setColor] = useState(node?.color ?? PRESET_COLORS[5])
  const [icon, setIcon] = useState(node?.icon ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Max available allocation for a child node
  const maxAvailable = parentNode
    ? Number(parentNode.allocated_amount) -
      siblings
        .filter((s) => s.id !== node?.id)
        .reduce((sum, s) => sum + Number(s.allocated_amount), 0)
    : null

  function validate(): string | null {
    if (!title.trim()) return 'Name is required.'
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed < 0) return 'Enter a valid amount.'
    if (maxAvailable !== null && parsed > maxAvailable) {
      return `Maximum available is ${formatCurrency(maxAvailable)}.`
    }
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

    const payload: BudgetNodeInsert | BudgetNodeUpdate = {
      title: title.trim(),
      allocated_amount: parseFloat(amount),
      color: color || null,
      icon: icon || null,
    }

    const err = await onSubmit(payload)
    if (err) {
      setError(err)
      setIsSubmitting(false)
    }
    // On success the parent closes the form
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      aria-label={isEditing ? 'Edit budget category' : 'Add budget category'}
    >
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
        {isEditing ? 'Edit category' : `Add sub-category${parentNode ? ` to ${parentNode.title}` : ''}`}
      </p>

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="node-title" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Name
        </label>
        <input
          id="node-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Rent"
          disabled={isSubmitting}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      {/* Amount */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="node-amount" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Allocated amount
          {maxAvailable !== null && (
            <span className="ml-1 text-zinc-400">
              (max {formatCurrency(maxAvailable)})
            </span>
          )}
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-zinc-400">
            ₹
          </span>
          <input
            id="node-amount"
            type="number"
            min="0"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            disabled={isSubmitting}
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-7 pr-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Icon picker */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Icon</span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_ICONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setIcon(icon === emoji ? '' : emoji)}
              className={`rounded-lg border px-2 py-1 text-base transition ${
                icon === emoji
                  ? 'border-zinc-900 bg-zinc-900 dark:border-zinc-100 dark:bg-zinc-100'
                  : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
              }`}
              aria-label={`Select icon ${emoji}`}
              aria-pressed={icon === emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Colour picker */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Colour</span>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => setColor(hex)}
              className={`h-6 w-6 rounded-full border-2 transition ${
                color === hex ? 'border-zinc-900 dark:border-zinc-100' : 'border-transparent'
              }`}
              style={{ backgroundColor: hex }}
              aria-label={`Select colour ${hex}`}
              aria-pressed={color === hex}
            />
          ))}
        </div>
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
            <>
              <LoadingSpinner size="sm" />
              <span>Saving…</span>
            </>
          ) : isEditing ? (
            'Save changes'
          ) : (
            'Add category'
          )}
        </button>
      </div>
    </form>
  )
}

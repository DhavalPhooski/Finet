'use client'

import { useState, type FormEvent } from 'react'
import { calculate5030020, formatCurrency } from '@/utils/allocation'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import type { Income } from '@/types'

interface IncomeInputProps {
  currentIncome: Income | null
  onSave: (amount: number, label?: string) => Promise<string | null>
}

export function IncomeInput({ currentIncome, onSave }: IncomeInputProps) {
  const [isEditing, setIsEditing] = useState(!currentIncome)
  const [amount, setAmount] = useState(
    currentIncome ? String(currentIncome.amount) : ''
  )
  const [label, setLabel] = useState(currentIncome?.label ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Live preview of 50/30/20 as user types
  const parsed = parseFloat(amount)
  const preview = !isNaN(parsed) && parsed > 0 ? calculate5030020(parsed) : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (isNaN(parsed) || parsed <= 0) {
      setError('Enter a valid income amount greater than zero.')
      return
    }

    setIsSubmitting(true)
    const err = await onSave(parsed, label.trim() || undefined)

    if (err) {
      setError(err)
      setIsSubmitting(false)
    } else {
      setIsEditing(false)
      setIsSubmitting(false)
    }
  }

  // ── Display mode ───────────────────────────────────────────
  if (!isEditing && currentIncome) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              Monthly income
            </p>
            <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {formatCurrency(Number(currentIncome.amount))}
            </p>
            {currentIncome.label && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {currentIncome.label}
              </p>
            )}
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Edit
          </button>
        </div>
      </div>
    )
  }

  // ── Edit / entry mode ──────────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      aria-label="Set monthly income"
    >
      <p className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
        {currentIncome ? 'Update income' : 'Set your monthly income'}
      </p>

      {/* Amount */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="income-amount" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Monthly income (₹)
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-zinc-400">
            ₹
          </span>
          <input
            id="income-amount"
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100000"
            disabled={isSubmitting}
            className="w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-7 pr-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            autoFocus
          />
        </div>
      </div>

      {/* Label */}
      <div className="mt-3 flex flex-col gap-1.5">
        <label htmlFor="income-label" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Label <span className="text-zinc-400">(optional)</span>
        </label>
        <input
          id="income-label"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Monthly salary"
          disabled={isSubmitting}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      {/* Live 50/30/20 preview */}
      {preview && (
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
          <PreviewItem label="Needs · 50%" value={formatCurrency(preview.needs)} color="text-red-600 dark:text-red-400" />
          <PreviewItem label="Wants · 30%" value={formatCurrency(preview.wants)} color="text-amber-600 dark:text-amber-400" />
          <PreviewItem label="Invest · 20%" value={formatCurrency(preview.investments)} color="text-emerald-600 dark:text-emerald-400" />
        </div>
      )}

      <ErrorMessage message={error} className="mt-3" />

      <div className="mt-4 flex gap-2">
        {currentIncome && (
          <button
            type="button"
            onClick={() => { setIsEditing(false); setError(null) }}
            disabled={isSubmitting}
            className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {isSubmitting ? (
            <><LoadingSpinner size="sm" /><span>Saving…</span></>
          ) : (
            'Save income'
          )}
        </button>
      </div>
    </form>
  )
}

function PreviewItem({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div className="text-center">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${color}`}>{value}</p>
    </div>
  )
}

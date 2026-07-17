'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useBudget } from '@/hooks/useBudget'
import { useTransactions } from '@/hooks/useTransactions'
import { StatCard } from '@/components/dashboard/StatCard'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { AllocationSummary } from '@/components/budget/AllocationSummary'
import { IncomeInput } from '@/components/budget/IncomeInput'
import { BudgetNodeList } from '@/components/budget/BudgetNodeList'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { FullPageLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatCurrency } from '@/utils/allocation'
import type { TransactionInsert } from '@/types'

export default function DashboardPage() {
  const { user, profile, isLoading: authLoading } = useAuth()

  // ── Transactions (loaded first so budget can use them for stats) ──
  const tx = useTransactions()

  // ── Budget (receives transactions to compute node stats) ──────────
  const budget = useBudget(tx.allTransactions)

  // ── Add expense form visibility ───────────────────────────────────
  const [showAddExpense, setShowAddExpense] = useState(false)

  // ── Guard: still loading auth ─────────────────────────────────────
  if (authLoading) return <FullPageLoader label="Loading dashboard…" />
  if (!user) return null

  const isLoading = budget.isLoading || tx.isLoading

  return (
    <div className="flex flex-col gap-8">
      {/* ── Greeting ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {greeting()},{' '}
            {profile?.full_name?.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Here&apos;s your financial overview for{' '}
            {new Date().toLocaleDateString('en-IN', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Quick-add expense button */}
        <button
          onClick={() => setShowAddExpense((v) => !v)}
          className="mt-3 flex h-9 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-700 sm:mt-0 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          <span aria-hidden="true">+</span>
          Add expense
        </button>
      </div>

      {/* ── Inline add-expense form ────────────────────────────── */}
      {showAddExpense && (
        <TransactionForm
          budgetNodes={budget.nodes}
          userId={user.id}
          onSubmit={async (payload) => {
            // TransactionForm passes TransactionInsert when no `transaction`
            // prop is provided (add mode). The userId prop ensures user_id is
            // set inside the form, so the cast to TransactionInsert is safe.
            const err = await tx.addTransaction(payload as TransactionInsert)
            if (!err) setShowAddExpense(false)
            return err
          }}
          onCancel={() => setShowAddExpense(false)}
        />
      )}

      {/* ── Error banners ──────────────────────────────────────── */}
      <ErrorMessage message={budget.error ?? tx.error} />

      {/* ── Income input ───────────────────────────────────────── */}
      <section aria-labelledby="income-heading">
        <h2
          id="income-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500"
        >
          Income
        </h2>
        <IncomeInput
          currentIncome={budget.income}
          onSave={budget.setIncome}
        />
      </section>

      {/* ── Top stat cards ─────────────────────────────────────── */}
      {budget.income && (
        <section aria-labelledby="overview-heading">
          <h2
            id="overview-heading"
            className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500"
          >
            Overview
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Monthly income"
              value={formatCurrency(Number(budget.income.amount))}
              subValue={budget.income.label ?? undefined}
              icon="💰"
            />
            <StatCard
              label="Needs · 50%"
              value={formatCurrency(budget.allocation.needs)}
              icon="🏠"
              accentColor="bg-red-50 dark:bg-red-950"
              valueColor="text-red-700 dark:text-red-400"
            />
            <StatCard
              label="Wants · 30%"
              value={formatCurrency(budget.allocation.wants)}
              icon="🎯"
              accentColor="bg-amber-50 dark:bg-amber-950"
              valueColor="text-amber-700 dark:text-amber-400"
            />
            <StatCard
              label="Investments · 20%"
              value={formatCurrency(budget.allocation.investments)}
              icon="📈"
              accentColor="bg-emerald-50 dark:bg-emerald-950"
              valueColor="text-emerald-700 dark:text-emerald-400"
            />
          </div>
        </section>
      )}

      {/* ── Allocation summary (50/30/20 + overall bar) ────────── */}
      {budget.income && (
        <section aria-labelledby="allocation-heading">
          <h2
            id="allocation-heading"
            className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500"
          >
            Budget usage
          </h2>
          <AllocationSummary
            allocation={budget.allocation}
            nodeTree={budget.nodeTree}
            remainingBudget={budget.remainingBudget}
          />
        </section>
      )}

      {/* ── Budget categories ──────────────────────────────────── */}
      <section aria-labelledby="categories-heading">
        <h2
          id="categories-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500"
        >
          Budget categories
        </h2>
        <BudgetNodeList
          nodeTree={budget.nodeTree}
          flatNodes={budget.nodes}
          isLoading={isLoading}
          budget={budget}
        />
      </section>

      {/* ── Recent transactions ────────────────────────────────── */}
      <section aria-labelledby="recent-heading">
        <h2
          id="recent-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500"
        >
          Recent expenses
        </h2>
        <RecentTransactions
          transactions={tx.allTransactions}
          budgetNodes={budget.nodes}
          isLoading={tx.isLoading}
        />
      </section>
    </div>
  )
}

// ─── Greeting helper ──────────────────────────────────────────────────────────

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useBudget } from '@/hooks/useBudget'
import { useTransactions } from '@/hooks/useTransactions'
import { useChat, SUGGESTED_PROMPTS } from '@/hooks/useChat'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { ChatInput } from '@/components/chat/ChatInput'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { FullPageLoader } from '@/components/ui/LoadingSpinner'

/**
 * /chat — FinetAI financial advisor chat page.
 * Passes the user's live budget + transaction data to the AI so every
 * response is personalised to their actual financial situation.
 */
export default function ChatPage() {
  const { user, isLoading: authLoading } = useAuth()
  const tx = useTransactions()
  const budget = useBudget(tx.allTransactions)

  const { messages, isLoading, error, sendMessage, clearChat } = useChat({
    income: budget.income,
    allocation: budget.allocation,
    nodeTree: budget.nodeTree,
    transactions: tx.allTransactions,
    remainingBudget: budget.income ? budget.remainingBudget : null,
  })

  // Auto-scroll to bottom on new messages
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (authLoading) return <FullPageLoader label="Loading…" />
  if (!user) return null

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-0">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            FinetAI
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Your personal financial advisor — powered by Gemini
          </p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearChat}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            New chat
          </button>
        )}
      </div>

      {/* ── Context badge ────────────────────────────────────── */}
      {budget.income && (
        <div className="mb-4 flex flex-wrap gap-2">
          <ContextBadge icon="💰" label={`Income set`} />
          {budget.nodeTree.length > 0 && (
            <ContextBadge icon="📊" label={`${budget.nodeTree.length} budget categories`} />
          )}
          {tx.allTransactions.length > 0 && (
            <ContextBadge icon="🧾" label={`${tx.allTransactions.length} transactions`} />
          )}
        </div>
      )}

      {/* ── Message area ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <EmptyState onPromptClick={sendMessage} hasFinancialData={!!budget.income} />
        ) : (
          <div className="flex flex-col gap-4 pb-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Error ────────────────────────────────────────────── */}
      {error && (
        <div className="py-2">
          <ErrorMessage message={error} />
        </div>
      )}

      {/* ── Input ────────────────────────────────────────────── */}
      <div className="pt-3">
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
        <p className="mt-2 text-center text-xs text-zinc-400 dark:text-zinc-600">
          FinetAI can make mistakes. Verify important financial decisions independently.
        </p>
      </div>
    </div>
  )
}

// ─── Empty state with suggested prompts ──────────────────────────────────────

function EmptyState({
  onPromptClick,
  hasFinancialData,
}: {
  onPromptClick: (msg: string) => void
  hasFinancialData: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8">
      {/* Logo */}
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl dark:bg-emerald-950">
        🤖
      </div>

      <div className="text-center">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Hi! I&apos;m FinetAI
        </h2>
        <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          {hasFinancialData
            ? "I can see your budget and transactions. Ask me anything about your finances."
            : "Ask me anything about personal finance. Set up your budget for personalised advice."}
        </p>
      </div>

      {/* Suggested prompts */}
      <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPromptClick(prompt)}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Small badge showing AI has context ──────────────────────────────────────

function ContextBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  )
}

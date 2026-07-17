'use client'

import { useState, useCallback, useRef } from 'react'
import type { BudgetNodeWithStats, Transaction, Income, Allocation } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

export interface UseChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
  clearChat: () => void
}

// ─── Suggested prompts shown on empty state ───────────────────────────────────

export const SUGGESTED_PROMPTS = [
  'Am I overspending in any category?',
  'How should I invest my savings this month?',
  'Give me a summary of my finances',
  'How can I improve my 50/30/20 balance?',
  'What are some good SIP options for beginners?',
  'How much should I keep as an emergency fund?',
]

// ─── Context builder ──────────────────────────────────────────────────────────

interface FinancialContext {
  income: Income | null
  allocation: Allocation | null
  nodeTree: BudgetNodeWithStats[]
  transactions: Transaction[]
  remainingBudget: number | null
}

function buildContext(ctx: FinancialContext) {
  return {
    income: ctx.income ? Number(ctx.income.amount) : null,
    currency: 'INR',
    allocation: ctx.allocation
      ? {
          needs: ctx.allocation.needs,
          wants: ctx.allocation.wants,
          investments: ctx.allocation.investments,
        }
      : null,
    budgetNodes: ctx.nodeTree.map((n) => ({
      title: n.title,
      allocated: Number(n.allocated_amount),
      spent: n.spent_amount,
      remaining: n.remaining_amount,
    })),
    recentTransactions: ctx.transactions.slice(0, 10).map((t) => ({
      title: t.title,
      amount: Number(t.amount),
      date: t.date,
      category: null as string | null,
    })),
    remainingBudget: ctx.remainingBudget,
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChat(financialCtx: FinancialContext): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return

      setError(null)

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
      }

      const modelMsgId = `model-${Date.now()}`
      const modelMsg: ChatMessage = {
        id: modelMsgId,
        role: 'assistant',
        content: '',
        isStreaming: true,
      }

      const updatedMessages = [...messages, userMsg]
      setMessages([...updatedMessages, modelMsg])
      setIsLoading(true)

      // Cancel any in-flight request
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            context: buildContext(financialCtx),
          }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string }
          throw new Error(body.error ?? `HTTP ${res.status}`)
        }

        if (!res.body) throw new Error('No response body')

        // Read the stream
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          accumulated += decoder.decode(value, { stream: true })

          // Update the streaming message in place
          setMessages((prev) =>
            prev.map((m) =>
              m.id === modelMsgId
                ? { ...m, content: accumulated }
                : m
            )
          )
        }

        // Mark streaming done
        setMessages((prev) =>
          prev.map((m) =>
            m.id === modelMsgId
              ? { ...m, content: accumulated, isStreaming: false }
              : m
          )
        )
      } catch (err) {
        if ((err as Error).name === 'AbortError') return

        const msg = err instanceof Error ? err.message : 'Something went wrong.'
        setError(msg)

        // Remove the empty model message on error
        setMessages((prev) => prev.filter((m) => m.id !== modelMsgId))
      } finally {
        setIsLoading(false)
      }
    },
    [messages, isLoading, financialCtx]
  )

  const clearChat = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setError(null)
  }, [])

  return { messages, isLoading, error, sendMessage, clearChat }
}

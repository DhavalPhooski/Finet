'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getIncome,
  createIncome,
  updateIncome,
  getBudgetNodes,
  createBudgetNode,
  updateBudgetNode,
  deleteBudgetNode,
  reorderBudgetNodes,
  syncRootAllocations,
} from '@/services/budgetService'
import {
  calculate5030020,
  buildNodeTree,
  computeRemainingBudget,
} from '@/utils/allocation'
import type {
  Income,
  BudgetNode,
  BudgetNodeInsert,
  BudgetNodeUpdate,
  BudgetNodeWithStats,
  Allocation,
  Transaction,
} from '@/types'

// ─── Hook return shape ────────────────────────────────────────────────────────

export interface UseBudgetReturn {
  // Data
  income: Income | null
  nodes: BudgetNode[]           // flat list
  nodeTree: BudgetNodeWithStats[] // nested tree with computed stats
  allocation: Allocation        // 50/30/20 figures
  remainingBudget: number

  // State
  isLoading: boolean
  error: string | null

  // Income actions
  setIncome: (amount: number, label?: string) => Promise<string | null>

  // Node actions
  addNode: (payload: BudgetNodeInsert) => Promise<string | null>
  editNode: (id: string, updates: BudgetNodeUpdate) => Promise<string | null>
  removeNode: (id: string) => Promise<string | null>
  reorderNodes: (updates: { id: string; sort_order: number }[]) => Promise<string | null>

  // Refresh
  refresh: () => Promise<void>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useBudget — central hook for all budget state.
 * Accepts the current user's transactions so it can compute node stats
 * without making duplicate DB calls.
 */
export function useBudget(transactions: Transaction[] = []): UseBudgetReturn {
  const { user } = useAuth()

  const [income, setIncomeState] = useState<Income | null>(null)
  const [nodes, setNodes] = useState<BudgetNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Load data ──────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError(null)

    const [incomeResult, nodesResult] = await Promise.all([
      getIncome(user.id),
      getBudgetNodes(user.id),
    ])

    if (incomeResult.error) setError(incomeResult.error)
    else setIncomeState(incomeResult.data)

    if (nodesResult.error) setError(nodesResult.error)
    else setNodes(nodesResult.data ?? [])

    setIsLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  // ── Derived values ─────────────────────────────────────────

  const incomeAmount = Number(income?.amount ?? 0)

  const allocation = useMemo<Allocation>(
    () => calculate5030020(incomeAmount),
    [incomeAmount]
  )

  const nodeTree = useMemo<BudgetNodeWithStats[]>(
    () => buildNodeTree(nodes, transactions),
    [nodes, transactions]
  )

  const remainingBudget = useMemo<number>(
    () => computeRemainingBudget(incomeAmount, transactions),
    [incomeAmount, transactions]
  )

  // ── Income action ──────────────────────────────────────────

  const setIncome = useCallback(
    async (amount: number, label?: string): Promise<string | null> => {
      if (!user) return 'Not authenticated.'
      if (amount < 0) return 'Income cannot be negative.'

      let result
      if (income) {
        result = await updateIncome(income.id, { amount, label })
      } else {
        result = await createIncome({ user_id: user.id, amount, label })
      }

      if (result.error) return result.error
      if (!result.data) return 'Failed to save income.'

      setIncomeState(result.data)

      // Sync root node allocations to the new income
      const rootNodes = nodes.filter((n) => n.parent_id === null)
      const syncResult = await syncRootAllocations(amount, rootNodes)
      if (syncResult.error) return syncResult.error

      // Reload nodes to reflect updated allocations
      const nodesResult = await getBudgetNodes(user.id)
      if (nodesResult.error) return nodesResult.error
      setNodes(nodesResult.data ?? [])

      return null
    },
    [user, income, nodes]
  )

  // ── Node actions ───────────────────────────────────────────

  const addNode = useCallback(
    async (payload: BudgetNodeInsert): Promise<string | null> => {
      const result = await createBudgetNode(payload, nodes)
      if (result.error) return result.error
      if (!result.data) return 'Failed to create budget node.'
      setNodes((prev) =>
        [...prev, result.data!].sort((a, b) => a.sort_order - b.sort_order)
      )
      return null
    },
    [nodes]
  )

  const editNode = useCallback(
    async (id: string, updates: BudgetNodeUpdate): Promise<string | null> => {
      const result = await updateBudgetNode(id, updates, nodes)
      if (result.error) return result.error
      if (!result.data) return 'Failed to update budget node.'
      const updated = result.data
      setNodes((prev) => prev.map((n) => (n.id === id ? updated : n)))
      return null
    },
    [nodes]
  )

  const removeNode = useCallback(async (id: string): Promise<string | null> => {
    const result = await deleteBudgetNode(id)
    if (result.error) return result.error
    // Remove node and all its descendants from local state
    setNodes((prev) => {
      const idsToRemove = new Set<string>()
      const collect = (nodeId: string) => {
        idsToRemove.add(nodeId)
        prev
          .filter((n) => n.parent_id === nodeId)
          .forEach((child) => collect(child.id))
      }
      collect(id)
      return prev.filter((n) => !idsToRemove.has(n.id))
    })
    return null
  }, [])

  const reorderNodes = useCallback(
    async (updates: { id: string; sort_order: number }[]): Promise<string | null> => {
      // Optimistic update
      setNodes((prev) =>
        prev
          .map((n) => {
            const upd = updates.find((u) => u.id === n.id)
            return upd ? { ...n, sort_order: upd.sort_order } : n
          })
          .sort((a, b) => a.sort_order - b.sort_order)
      )
      const result = await reorderBudgetNodes(updates)
      if (result.error) {
        // Revert on failure
        await load()
        return result.error
      }
      return null
    },
    [load]
  )

  return {
    income,
    nodes,
    nodeTree,
    allocation,
    remainingBudget,
    isLoading,
    error,
    setIncome,
    addNode,
    editNode,
    removeNode,
    reorderNodes,
    refresh: load,
  }
}

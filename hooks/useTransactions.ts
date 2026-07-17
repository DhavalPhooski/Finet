'use client'

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useTransition,
} from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getAllTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/services/transactionService'
import type {
  Transaction,
  TransactionInsert,
  TransactionUpdate,
} from '@/types'

// ─── Filter state ─────────────────────────────────────────────────────────────

export interface TransactionFilterState {
  search: string
  budgetNodeId: string | null  // null = all categories
  dateFrom: string             // '' = no lower bound
  dateTo: string               // '' = no upper bound
}

const DEFAULT_FILTERS: TransactionFilterState = {
  search: '',
  budgetNodeId: null,
  dateFrom: '',
  dateTo: '',
}

// ─── Hook return shape ────────────────────────────────────────────────────────

export interface UseTransactionsReturn {
  // All transactions (used by useBudget for node stats)
  allTransactions: Transaction[]

  // Filtered + searched subset for display
  filteredTransactions: Transaction[]

  // Filter state
  filters: TransactionFilterState
  setFilters: (filters: Partial<TransactionFilterState>) => void
  resetFilters: () => void

  // Loading / error
  isLoading: boolean
  isFiltering: boolean  // useTransition pending state for filter changes
  error: string | null

  // Actions — all return null on success, error string on failure
  addTransaction: (payload: TransactionInsert) => Promise<string | null>
  editTransaction: (id: string, updates: TransactionUpdate) => Promise<string | null>
  removeTransaction: (id: string) => Promise<string | null>

  // Refresh
  refresh: () => Promise<void>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTransactions(): UseTransactionsReturn {
  const { user } = useAuth()

  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [filters, setFiltersState] = useState<TransactionFilterState>(DEFAULT_FILTERS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFiltering, startFilterTransition] = useTransition()

  // ── Load ───────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError(null)

    const result = await getAllTransactions(user.id)

    if (result.error) {
      setError(result.error)
    } else {
      setAllTransactions(result.data)
    }

    setIsLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  // ── Filter state ───────────────────────────────────────────

  const setFilters = useCallback(
    (partial: Partial<TransactionFilterState>) => {
      startFilterTransition(() => {
        setFiltersState((prev) => ({ ...prev, ...partial }))
      })
    },
    []
  )

  const resetFilters = useCallback(() => {
    startFilterTransition(() => {
      setFiltersState(DEFAULT_FILTERS)
    })
  }, [])

  // ── Derived: filtered list ─────────────────────────────────

  const filteredTransactions = useMemo(() => {
    let list = allTransactions

    if (filters.budgetNodeId !== null) {
      list = list.filter((t) => t.budget_node_id === filters.budgetNodeId)
    }

    if (filters.dateFrom) {
      list = list.filter((t) => t.date >= filters.dateFrom)
    }

    if (filters.dateTo) {
      list = list.filter((t) => t.date <= filters.dateTo)
    }

    if (filters.search.trim()) {
      const term = filters.search.trim().toLowerCase()
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(term) ||
          (t.note ?? '').toLowerCase().includes(term)
      )
    }

    return list
  }, [allTransactions, filters])

  // ── Actions ────────────────────────────────────────────────

  const addTransaction = useCallback(
    async (payload: TransactionInsert): Promise<string | null> => {
      const result = await createTransaction(payload)
      if (result.error) return result.error
      // Prepend so it appears at the top (sorted by date desc)
      setAllTransactions((prev) => [result.data, ...prev])
      return null
    },
    []
  )

  const editTransaction = useCallback(
    async (id: string, updates: TransactionUpdate): Promise<string | null> => {
      const result = await updateTransaction(id, updates)
      if (result.error) return result.error
      setAllTransactions((prev) =>
        prev.map((t) => (t.id === id ? result.data : t))
      )
      return null
    },
    []
  )

  const removeTransaction = useCallback(
    async (id: string): Promise<string | null> => {
      // Optimistic removal
      setAllTransactions((prev) => prev.filter((t) => t.id !== id))
      const result = await deleteTransaction(id)
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
    allTransactions,
    filteredTransactions,
    filters,
    setFilters,
    resetFilters,
    isLoading,
    isFiltering,
    error,
    addTransaction,
    editTransaction,
    removeTransaction,
    refresh: load,
  }
}

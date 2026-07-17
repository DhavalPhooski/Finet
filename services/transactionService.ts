import { createClient } from '@/lib/supabase/client'
import type {
  Transaction,
  TransactionInsert,
  TransactionUpdate,
  ServiceResult,
} from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TransactionFilters {
  budgetNodeId?: string | null   // filter by category
  dateFrom?: string              // ISO date string YYYY-MM-DD
  dateTo?: string                // ISO date string YYYY-MM-DD
  search?: string                // matches title or note (case-insensitive)
  limit?: number                 // pagination page size
  offset?: number                // pagination offset
}

export interface TransactionPage {
  transactions: Transaction[]
  totalCount: number
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

/**
 * Fetch transactions for the current user with optional filters.
 * Returns a paginated result with total count for UI pagination.
 */
export async function getTransactions(
  userId: string,
  filters: TransactionFilters = {}
): Promise<ServiceResult<TransactionPage>> {
  const supabase = createClient()

  let query = supabase
    .from('transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters.budgetNodeId !== undefined && filters.budgetNodeId !== null) {
    query = query.eq('budget_node_id', filters.budgetNodeId)
  }
  if (filters.dateFrom) {
    query = query.gte('date', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('date', filters.dateTo)
  }
  if (filters.search?.trim()) {
    // Full-text style search across title and note
    const term = filters.search.trim()
    query = query.or(`title.ilike.%${term}%,note.ilike.%${term}%`)
  }
  if (filters.limit !== undefined) {
    query = query.limit(filters.limit)
  }
  if (filters.offset !== undefined) {
    query = query.range(
      filters.offset,
      filters.offset + (filters.limit ?? 50) - 1
    )
  }

  const { data, error, count } = await query

  if (error) return { data: null, error: error.message }

  return {
    data: {
      transactions: data ?? [],
      totalCount: count ?? 0,
    },
    error: null,
  }
}

/**
 * Fetch all transactions for a user (no pagination).
 * Used by useBudget to compute node stats without a separate call.
 */
export async function getAllTransactions(
  userId: string
): Promise<ServiceResult<Transaction[]>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createTransaction(
  payload: TransactionInsert
): Promise<ServiceResult<Transaction>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('transactions')
    .insert(payload)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Failed to create transaction.' }
  return { data, error: null }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateTransaction(
  id: string,
  updates: TransactionUpdate
): Promise<ServiceResult<Transaction>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('transactions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Failed to update transaction.' }
  return { data, error: null }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteTransaction(
  id: string
): Promise<ServiceResult<null>> {
  const supabase = createClient()
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

// ─── Recent ───────────────────────────────────────────────────────────────────

/**
 * Fetch the N most recent transactions — used on the dashboard.
 */
export async function getRecentTransactions(
  userId: string,
  limit = 5
): Promise<ServiceResult<Transaction[]>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

import { createClient } from '@/lib/supabase/client'
import { validateChildAllocation } from '@/utils/allocation'
import type {
  BudgetNode,
  BudgetNodeInsert,
  BudgetNodeUpdate,
  Income,
  IncomeInsert,
  IncomeUpdate,
  ServiceResult,
} from '@/types'

// ════════════════════════════════════════════════════════════
// INCOME
// ════════════════════════════════════════════════════════════

/** Fetch the most recent income record for the current user. */
export async function getIncome(userId: string): Promise<ServiceResult<Income | null>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('income')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Create a new income record. */
export async function createIncome(
  payload: IncomeInsert
): Promise<ServiceResult<Income>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('income')
    .insert(payload)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Failed to create income record.' }
  return { data, error: null }
}

/** Update an existing income record. */
export async function updateIncome(
  id: string,
  updates: IncomeUpdate
): Promise<ServiceResult<Income>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('income')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Failed to update income record.' }
  return { data, error: null }
}

/** Delete an income record. */
export async function deleteIncome(id: string): Promise<ServiceResult<null>> {
  const supabase = createClient()
  const { error } = await supabase.from('income').delete().eq('id', id)
  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

// ════════════════════════════════════════════════════════════
// BUDGET NODES
// ════════════════════════════════════════════════════════════

/** Fetch all budget nodes for the current user (flat list — tree built in hook). */
export async function getBudgetNodes(
  userId: string
): Promise<ServiceResult<BudgetNode[]>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('budget_nodes')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

/** Create a new budget node.
 *  Validates that the child allocation does not exceed the parent's budget. */
export async function createBudgetNode(
  payload: BudgetNodeInsert,
  allNodes: BudgetNode[]
): Promise<ServiceResult<BudgetNode>> {
  // Client-side validation (DB trigger is the final guard)
  if (payload.parent_id) {
    const parent = allNodes.find((n) => n.id === payload.parent_id)
    if (!parent) return { data: null, error: 'Parent node not found.' }

    const siblings = allNodes.filter((n) => n.parent_id === payload.parent_id)
    const validationError = validateChildAllocation(
      parent,
      siblings,
      null,
      Number(payload.allocated_amount)
    )
    if (validationError) return { data: null, error: validationError }
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('budget_nodes')
    .insert(payload)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Failed to create budget node.' }
  return { data, error: null }
}

/** Update a budget node (title, allocated_amount, color, icon, sort_order). */
export async function updateBudgetNode(
  id: string,
  updates: BudgetNodeUpdate,
  allNodes: BudgetNode[]
): Promise<ServiceResult<BudgetNode>> {
  // Validate allocation if it's changing and the node has a parent
  if (updates.allocated_amount !== undefined) {
    const node = allNodes.find((n) => n.id === id)
    if (node?.parent_id) {
      const parent = allNodes.find((n) => n.id === node.parent_id)
      if (parent) {
        const siblings = allNodes.filter(
          (n) => n.parent_id === node.parent_id && n.id !== id
        )
        const validationError = validateChildAllocation(
          parent,
          siblings,
          id,
          Number(updates.allocated_amount)
        )
        if (validationError) return { data: null, error: validationError }
      }
    }
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('budget_nodes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Failed to update budget node.' }
  return { data, error: null }
}

/** Delete a budget node.
 *  Children are cascade-deleted by the DB foreign key. */
export async function deleteBudgetNode(id: string): Promise<ServiceResult<null>> {
  const supabase = createClient()
  const { error } = await supabase.from('budget_nodes').delete().eq('id', id)
  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

/** Reorder nodes by updating their sort_order in a single batch. */
export async function reorderBudgetNodes(
  updates: { id: string; sort_order: number }[]
): Promise<ServiceResult<null>> {
  const supabase = createClient()

  const promises = updates.map(({ id, sort_order }) =>
    supabase
      .from('budget_nodes')
      .update({ sort_order, updated_at: new Date().toISOString() })
      .eq('id', id)
  )

  const results = await Promise.all(promises)
  const firstError = results.find((r) => r.error)
  if (firstError?.error) return { data: null, error: firstError.error.message }
  return { data: null, error: null }
}

/**
 * Sync root node allocations to match the 50/30/20 split for a given income.
 * Matches by title: "Needs" → 50%, "Wants" → 30%, "Investments" → 20%.
 */
export async function syncRootAllocations(
  income: number,
  rootNodes: BudgetNode[]
): Promise<ServiceResult<null>> {
  const RATIO_MAP: Record<string, number> = {
    Needs: 0.5,
    Wants: 0.3,
    Investments: 0.2,
  }

  const supabase = createClient()

  const promises = rootNodes.map((node) => {
    const ratio = RATIO_MAP[node.title]
    if (ratio === undefined) return Promise.resolve({ error: null })
    const allocated_amount = Math.round(income * ratio * 100) / 100
    return supabase
      .from('budget_nodes')
      .update({ allocated_amount, updated_at: new Date().toISOString() })
      .eq('id', node.id)
  })

  const results = await Promise.all(promises)
  const firstError = results.find((r) => r.error)
  if (firstError?.error) return { data: null, error: firstError.error.message }
  return { data: null, error: null }
}

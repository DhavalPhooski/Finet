import type { Allocation, BudgetNode, BudgetNodeWithStats, Transaction } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

export const ALLOCATION_RATIOS = {
  needs: 0.5,
  wants: 0.3,
  investments: 0.2,
} as const

// ─── 50/30/20 Calculation ─────────────────────────────────────────────────────

/**
 * Given a gross income figure, returns the ideal 50/30/20 allocation.
 * Pure function — no side effects, safe to call anywhere.
 */
export function calculate5030020(income: number): Allocation {
  if (income <= 0) {
    return { income: 0, needs: 0, wants: 0, investments: 0 }
  }

  return {
    income,
    needs: round2(income * ALLOCATION_RATIOS.needs),
    wants: round2(income * ALLOCATION_RATIOS.wants),
    investments: round2(income * ALLOCATION_RATIOS.investments),
  }
}

// ─── Node stats computation ───────────────────────────────────────────────────

/**
 * Computes the direct spent_amount for a single node —
 * only transactions assigned directly to this node's ID.
 * Parent rollup (including children) is handled in buildNodeTree.
 */
function computeDirectSpent(node: BudgetNode, transactions: Transaction[]): number {
  return round2(
    transactions
      .filter((t) => t.budget_node_id === node.id)
      .reduce((sum, t) => sum + Number(t.amount), 0)
  )
}

/**
 * Recomputes spent_amount, remaining_amount, and percent_used on an already-
 * enriched node using its current spent_amount (which may have been rolled up
 * from children).
 */
function computeStats(
  allocated: number,
  spent: number
): { remaining_amount: number; percent_used: number } {
  const remaining = round2(allocated - spent)
  const percent_used =
    allocated > 0 ? Math.min(100, round2((spent / allocated) * 100)) : 0
  return { remaining_amount: remaining, percent_used }
}

/**
 * Builds the full BudgetNodeWithStats tree with correct rollup logic:
 *
 * 1. Every node gets its own direct spent_amount (transactions pointing to it).
 * 2. After the tree is assembled, a bottom-up rollup pass adds each child's
 *    spent_amount into its parent — so a root node like "Needs" reflects the
 *    total spent across Rent, Food, Utilities, etc.
 * 3. remaining_amount and percent_used are recomputed after rollup.
 */
export function buildNodeTree(
  nodes: BudgetNode[],
  transactions: Transaction[]
): BudgetNodeWithStats[] {
  // Step 1 — build a flat map with direct spend only
  const map = new Map<string, BudgetNodeWithStats>()

  for (const node of nodes) {
    const directSpent = computeDirectSpent(node, transactions)
    const allocated = Number(node.allocated_amount)
    map.set(node.id, {
      ...node,
      spent_amount: directSpent,
      ...computeStats(allocated, directSpent),
      children: [],
    })
  }

  // Step 2 — wire up parent→child relationships
  const roots: BudgetNodeWithStats[] = []

  for (const enriched of map.values()) {
    if (enriched.parent_id === null) {
      roots.push(enriched)
    } else {
      const parent = map.get(enriched.parent_id)
      if (parent) {
        parent.children.push(enriched)
      }
    }
  }

  // Step 3 — sort children at every level
  const sortByOrder = (a: BudgetNodeWithStats, b: BudgetNodeWithStats) =>
    a.sort_order - b.sort_order

  roots.sort(sortByOrder)
  roots.forEach((root) => root.children.sort(sortByOrder))

  // Step 4 — bottom-up rollup: roll each child's spent_amount into its parent
  //   We process children before parents by walking roots after sorting.
  function rollup(node: BudgetNodeWithStats): void {
    // Recurse into children first (depth-first)
    for (const child of node.children) {
      rollup(child)
    }

    // Sum up all direct children's spent_amount into this node
    if (node.children.length > 0) {
      const childrenSpent = node.children.reduce(
        (sum, child) => sum + child.spent_amount,
        0
      )
      const totalSpent = round2(node.spent_amount + childrenSpent)
      const allocated = Number(node.allocated_amount)
      node.spent_amount = totalSpent
      Object.assign(node, computeStats(allocated, totalSpent))
    }
  }

  roots.forEach(rollup)

  return roots
}

/**
 * Computes spent_amount, remaining_amount, and percent_used for a single node
 * by summing the transactions that belong to it.
 * NOTE: does NOT include children — use buildNodeTree for the full rollup.
 */
export function computeNodeStats(
  node: BudgetNode,
  transactions: Transaction[]
): { spent_amount: number; remaining_amount: number; percent_used: number } {
  const spent = computeDirectSpent(node, transactions)
  const allocated = Number(node.allocated_amount)
  return {
    spent_amount: spent,
    ...computeStats(allocated, spent),
  }
}

/**
 * Validates that a proposed allocation for a child node does not exceed
 * the parent's allocated_amount minus other siblings' allocations.
 *
 * Returns an error string or null if valid.
 */
export function validateChildAllocation(
  parentNode: BudgetNode,
  siblings: BudgetNode[],
  currentNodeId: string | null,
  proposedAmount: number
): string | null {
  const siblingsTotal = siblings
    .filter((s) => s.id !== currentNodeId)
    .reduce((sum, s) => sum + Number(s.allocated_amount), 0)

  const available = Number(parentNode.allocated_amount) - siblingsTotal

  if (proposedAmount > available) {
    return `Maximum allocation for this category is ${formatCurrency(available)}.`
  }

  return null
}

// ─── Remaining budget ─────────────────────────────────────────────────────────

/**
 * Total remaining budget = income − total spent across all nodes.
 */
export function computeRemainingBudget(
  income: number,
  transactions: Transaction[]
): number {
  const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0)
  return round2(income - totalSpent)
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

/**
 * Formats a number as Indian Rupee currency.
 * e.g. 100000 → "₹1,00,000"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Formats a percentage for display.
 * e.g. 73.5 → "73.5%"
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

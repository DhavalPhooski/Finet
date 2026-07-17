'use client'

import { useState } from 'react'
import { BudgetNodeCard } from './BudgetNodeCard'
import { BudgetNodeForm } from './BudgetNodeForm'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import type { BudgetNodeWithStats, BudgetNode, BudgetNodeUpdate } from '@/types'
import type { UseBudgetReturn } from '@/hooks/useBudget'

interface BudgetNodeListProps {
  nodeTree: BudgetNodeWithStats[]
  flatNodes: BudgetNode[]
  isLoading: boolean
  budget: UseBudgetReturn
}

export function BudgetNodeList({
  nodeTree,
  flatNodes,
  isLoading,
  budget,
}: BudgetNodeListProps) {
  // Which parent's "add child" form is open
  const [addingChildTo, setAddingChildTo] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner size="lg" label="Loading budget…" />
      </div>
    )
  }

  if (nodeTree.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
        No budget categories yet. Add income above to get started.
      </p>
    )
  }

  async function handleEditNode(
    id: string,
    updates: BudgetNodeUpdate
  ): Promise<string | null> {
    setActionError(null)
    const err = await budget.editNode(id, updates)
    if (err) setActionError(err)
    return err
  }

  async function handleDeleteNode(id: string): Promise<string | null> {
    setActionError(null)
    const err = await budget.removeNode(id)
    if (err) setActionError(err)
    return err
  }

  async function handleAddChild(
    parentId: string,
    payload: Parameters<UseBudgetReturn['addNode']>[0]
  ): Promise<string | null> {
    setActionError(null)
    const err = await budget.addNode({ ...payload, parent_id: parentId })
    if (!err) setAddingChildTo(null)
    else setActionError(err)
    return err
  }

  return (
    <div className="flex flex-col gap-4">
      <ErrorMessage message={actionError} />

      {nodeTree.map((rootNode) => {
        const siblings = flatNodes.filter(
          (n) => n.parent_id === rootNode.id
        )

        return (
          <div key={rootNode.id} className="flex flex-col gap-2">
            <BudgetNodeCard
              node={rootNode}
              onEdit={handleEditNode}
              onDelete={handleDeleteNode}
              onAddChild={(parentId) => setAddingChildTo(parentId)}
              isRoot
            />

            {/* Inline add-child form */}
            {addingChildTo === rootNode.id && (
              <div className="ml-4">
                <BudgetNodeForm
                  parentNode={rootNode}
                  siblings={siblings}
                  onSubmit={async (payload) =>
                    handleAddChild(rootNode.id, {
                      ...(payload as Parameters<UseBudgetReturn['addNode']>[0]),
                      user_id: rootNode.user_id,
                    })
                  }
                  onCancel={() => setAddingChildTo(null)}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

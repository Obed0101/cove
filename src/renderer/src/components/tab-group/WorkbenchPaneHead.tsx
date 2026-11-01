import React from 'react'
import { Folder, GitBranch } from 'lucide-react'
import { useWorktreeById } from '@/store/selectors'
import { resolveWorktreeBranchLabel } from '@/lib/worktree-default-display-name'
import type { Tab } from '../../../../shared/tab-types'

// Cove: the workbench card opens with a branch / location crumb, like the design preview.
export function WorkbenchPaneHead({
  worktreeId,
  activeTab
}: {
  worktreeId: string
  activeTab: Tab | null | undefined
}): React.JSX.Element {
  const worktree = useWorktreeById(worktreeId, activeTab?.executionHostId)
  const branch = worktree ? resolveWorktreeBranchLabel(worktree) : ''
  const crumb = activeTab ? (activeTab.customLabel ?? activeTab.label) : ''
  const LeadingIcon = branch ? GitBranch : Folder

  return (
    <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border pr-3 pl-4 text-xs text-muted-foreground">
      <LeadingIcon className="size-4 shrink-0" aria-hidden="true" />
      {branch ? <span className="shrink-0">{branch}</span> : null}
      {branch && crumb ? <span className="shrink-0">/</span> : null}
      {crumb ? <span className="min-w-0 truncate font-mono text-foreground">{crumb}</span> : null}
    </div>
  )
}

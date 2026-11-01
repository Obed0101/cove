import React from 'react'
import { useAppStore } from '@/store'
import { translate } from '@/i18n/i18n'

// Cove: the current worktree row reports how many tabs it holds, like the design preview.
export function WorktreeCardTabCount({
  worktreeId
}: {
  worktreeId: string
}): React.JSX.Element | null {
  const tabCount = useAppStore((s) => s.unifiedTabsByWorktree[worktreeId]?.length ?? 0)
  if (tabCount === 0) {
    return null
  }
  return (
    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
      {tabCount === 1
        ? translate('auto.components.sidebar.WorktreeCardTabCount.one', '1 tab')
        : translate('auto.components.sidebar.WorktreeCardTabCount.many', '{{value0}} tabs', {
            value0: tabCount
          })}
    </span>
  )
}

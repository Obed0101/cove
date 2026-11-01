import React from 'react'
import { Inbox } from 'lucide-react'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import { translate } from '@/i18n/i18n'
import { useAgentBucketCounts } from '@/components/dashboard/useAgentBucketCounts'

// Cove: Inbox opens the Activity page in the card like Tasks; its count is agents that need you, else agents working.
export function SidebarInboxNavButton(): React.JSX.Element {
  const inboxActive = useAppStore((s) => s.activeView === 'activity')
  const openActivityPage = useAppStore((s) => s.openActivityPage)
  const closeActivityPage = useAppStore((s) => s.closeActivityPage)
  const setSidebarBody = useAppStore((s) => s.setSidebarBody)
  const counts = useAgentBucketCounts()
  const inboxCount = counts.attention || counts.working

  return (
    <button
      type="button"
      onClick={() => {
        if (inboxActive) {
          closeActivityPage()
          return
        }
        // The page lists the threads, so the sidebar returns to projects.
        setSidebarBody?.('workspaces')
        openActivityPage()
      }}
      aria-current={inboxActive ? 'page' : undefined}
      className={cn(
        'flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-left text-[13px] transition-colors',
        inboxActive
          ? 'bg-worktree-sidebar-accent text-worktree-sidebar-accent-foreground'
          : 'text-worktree-sidebar-foreground/60 hover:bg-worktree-sidebar-foreground/8'
      )}
    >
      <Inbox
        className={cn(
          'size-4 shrink-0',
          inboxActive
            ? 'text-worktree-sidebar-accent-foreground'
            : 'text-worktree-sidebar-foreground/60'
        )}
      />
      <span className="flex-1">
        {translate('auto.components.sidebar.SidebarNav.inbox', 'Inbox')}
      </span>
      {inboxCount > 0 ? (
        <span className="shrink-0 text-xs tabular-nums text-worktree-sidebar-foreground/60">
          {inboxCount > 99 ? '99+' : inboxCount}
        </span>
      ) : null}
    </button>
  )
}

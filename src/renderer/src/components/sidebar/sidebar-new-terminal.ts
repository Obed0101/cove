import { toast } from 'sonner'
import { useAppStore } from '@/store'
import type { AppState } from '@/store/types'
import { selectWorktreesByRepo } from '@/store/workspace-record-selectors'
import { activateAndRevealWorktree } from '@/lib/worktree-activation'

type SidebarTerminalTargetState = Pick<
  AppState,
  'activeWorktreeId' | 'activeRepoId' | 'repos' | 'worktreesByRepo'
>

/** The open workspace, else the project's main checkout, so a plain terminal never creates a worktree. */
export function resolveSidebarTerminalWorktreeId(state: SidebarTerminalTargetState): string | null {
  if (state.activeWorktreeId) {
    return state.activeWorktreeId
  }
  const repoId = state.activeRepoId ?? state.repos[0]?.id
  const worktrees = repoId ? (selectWorktreesByRepo(state)[repoId] ?? []) : []
  return (worktrees.find((worktree) => worktree.isMainWorktree) ?? worktrees[0])?.id ?? null
}

export function openSidebarTerminal(): void {
  const state = useAppStore.getState()
  const worktreeId = resolveSidebarTerminalWorktreeId(state)
  if (!worktreeId) {
    state.openModal('add-repo')
    return
  }
  const tabCountBefore = state.tabsByWorktree[worktreeId]?.length ?? 0
  if (state.activeWorktreeId !== worktreeId || state.activeView !== 'terminal') {
    activateAndRevealWorktree(worktreeId)
  }
  const next = useAppStore.getState()
  // Why: activating an empty workspace already seeds its first terminal; don't add a second one.
  if ((next.tabsByWorktree[worktreeId]?.length ?? 0) > tabCountBefore) {
    return
  }
  const groupId =
    next.activeGroupIdByWorktree[worktreeId] ?? next.groupsByWorktree[worktreeId]?.[0]?.id
  if (!groupId) {
    return
  }
  void next.openNewTerminalTabInActiveWorkspace(groupId).catch((error: unknown) => {
    toast.error(error instanceof Error ? error.message : String(error))
  })
}

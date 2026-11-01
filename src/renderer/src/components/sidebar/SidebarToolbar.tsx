import React from 'react'
import { Kanban } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { ScrollToCurrentWorkspaceToolbarButton } from './ScrollToCurrentWorkspaceToolbarButton'
import { SidebarSettingsHelpMenu } from './SidebarSettingsHelpMenu'
import { SidebarUpdateCheckRow } from './SidebarUpdateCheckRow'
import { translate } from '@/i18n/i18n'
import { useAppStore } from '@/store'
import { hasFeatureInteraction } from '../../../../shared/feature-interactions'

const WORKSPACE_BOARD_MOVED_HINT_STORAGE_KEY = 'orca.workspaceBoardMovedHintSeen.v1'
const WORKSPACE_BOARD_MOVED_HINT_DURATION_MS = 12000

type SidebarToolbarProps = {
  workspaceBoardOpen: boolean
  workspaceBoardDragPreviewOpen?: boolean
  onWorkspaceBoardToggle: () => void
}

const SidebarToolbar = React.memo(function SidebarToolbar({
  workspaceBoardOpen,
  workspaceBoardDragPreviewOpen = false,
  onWorkspaceBoardToggle
}: SidebarToolbarProps) {
  // Subscribe across this memo boundary so asynchronously applied locale changes relabel the toolbar and its children.
  useTranslation()
  const [workspaceBoardMovedHintOpen, setWorkspaceBoardMovedHintOpen] = React.useState(false)
  const movedHintEligibleRef = React.useRef<boolean | null>(null)
  const persistedUIReady = useAppStore((state) => state.persistedUIReady)
  const hasUsedWorkspaceBoard = useAppStore((state) =>
    hasFeatureInteraction(state.featureInteractions, 'workspace-board')
  )

  React.useEffect(() => {
    if (!persistedUIReady) {
      return
    }
    // Limit relocation hints to users who opened the board at its old location.
    if (movedHintEligibleRef.current === null) {
      movedHintEligibleRef.current = hasUsedWorkspaceBoard
    }
    if (!movedHintEligibleRef.current) {
      return
    }
    try {
      if (window.localStorage.getItem(WORKSPACE_BOARD_MOVED_HINT_STORAGE_KEY) === 'true') {
        return
      }
      window.localStorage.setItem(WORKSPACE_BOARD_MOVED_HINT_STORAGE_KEY, 'true')
    } catch {
      return
    }

    setWorkspaceBoardMovedHintOpen(true)
    const timeoutId = window.setTimeout(() => {
      setWorkspaceBoardMovedHintOpen(false)
    }, WORKSPACE_BOARD_MOVED_HINT_DURATION_MS)
    return () => window.clearTimeout(timeoutId)
  }, [hasUsedWorkspaceBoard, persistedUIReady])

  const handleWorkspaceBoardClick = (): void => {
    setWorkspaceBoardMovedHintOpen(false)
    onWorkspaceBoardToggle()
  }

  return (
    <div className="mt-auto flex shrink-0 flex-col gap-1 px-2 pt-1 pb-2">
      <SidebarUpdateCheckRow />
      <SidebarSettingsHelpMenu
        revealActions={
          workspaceBoardOpen || workspaceBoardDragPreviewOpen || workspaceBoardMovedHintOpen
        }
      >
        <ScrollToCurrentWorkspaceToolbarButton />
        <Tooltip open={workspaceBoardMovedHintOpen ? true : undefined}>
          <TooltipTrigger asChild>
            <Button
              variant={workspaceBoardOpen || workspaceBoardDragPreviewOpen ? 'secondary' : 'ghost'}
              size="icon-xs"
              type="button"
              aria-label={translate(
                'auto.components.sidebar.SidebarToolbar.49f62c5665',
                'Workspace board'
              )}
              aria-pressed={workspaceBoardOpen}
              data-workspace-board-trigger=""
              data-workspace-board-preview={workspaceBoardDragPreviewOpen ? 'true' : undefined}
              onClick={handleWorkspaceBoardClick}
              className="text-muted-foreground"
            >
              <Kanban className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={4}>
            {workspaceBoardMovedHintOpen
              ? translate(
                  'auto.components.sidebar.SidebarToolbar.87d0064026',
                  'Workspace board moved to the bottom bar'
                )
              : workspaceBoardOpen
                ? translate(
                    'auto.components.sidebar.SidebarToolbar.a30e34eb5c',
                    'Close workspace board'
                  )
                : translate('auto.components.sidebar.SidebarToolbar.49f62c5665', 'Workspace board')}
          </TooltipContent>
        </Tooltip>
      </SidebarSettingsHelpMenu>
    </div>
  )
})

export default SidebarToolbar

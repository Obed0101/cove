import { ArrowLeft, ArrowRight, MoreHorizontal, PanelLeft, Search } from 'lucide-react'
import logo from '../../../../resources/logo.svg'
import { translate } from '@/i18n/i18n'
import { APP_DISPLAY_NAME } from '@/lib/app-brand'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import { shouldShowWorktreeHistoryControls } from '../lib/titlebar-worktree-history-controls'
import {
  canGoBackWorktreeHistory,
  canGoForwardWorktreeHistory
} from '@/store/slices/worktree-nav-history'
import { useShortcutLabel } from '../hooks/useShortcutLabel'
import { useAppStore } from '../store'
import { hasCustomTitleBar, hasMacTrafficLights } from './app-window-chrome'
import type { AppChromeLayout } from './use-app-chrome-layout'

/** Reuse left chrome across full-width and sidebar-width headers so controls/popovers stay consistent. */
export function TitlebarLeftControls({ layout }: { layout: AppChromeLayout }): React.JSX.Element {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const canGoBackWorktree = useAppStore(canGoBackWorktreeHistory)
  const canGoForwardWorktree = useAppStore(canGoForwardWorktreeHistory)
  const openModal = useAppStore((s) => s.openModal)
  const leftSidebarShortcutLabel = useShortcutLabel('sidebar.left.toggle')
  const searchShortcutLabel = useShortcutLabel('worktree.palette')
  const historyBackShortcutLabel = useShortcutLabel('worktree.history.back')
  const historyForwardShortcutLabel = useShortcutLabel('worktree.history.forward')
  const sidebarToggle = (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label={translate('auto.App.e4b9e7dff7', 'Toggle sidebar')}
        >
          <PanelLeft size={16} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {translate('auto.App.ce37cf5279', 'Toggle sidebar ({{value0}})', {
          value0: leftSidebarShortcutLabel
        })}
      </TooltipContent>
    </Tooltip>
  )
  // The palette spans chats, terminals, workspaces and tasks, so a project-only label would overclaim.
  const searchLabel = translate(
    'auto.components.sidebar.SidebarNav.0c3395fd32',
    'Search worktrees and browser tabs'
  )
  const searchButton = (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className="sidebar-toggle"
          onClick={() => openModal('worktree-palette')}
          aria-label={searchLabel}
        >
          <Search size={16} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {translate('auto.App.searchWithShortcut', 'Search ({{value0}})', {
          value0: searchShortcutLabel
        })}
      </TooltipContent>
    </Tooltip>
  )

  return (
    // Measure the whole row for tab-strip spacing. w-max prevents the collapsed w-0 wrapper shrinking Windows text to one glyph.
    <div
      ref={layout.titlebarLeftControlsRef}
      className={`flex h-full shrink-0 items-center${
        layout.leftTitlebarChromeLayout.isFloating ? ' w-max' : ' w-full'
      }`}
    >
      <div className="flex h-full items-center">
        {hasMacTrafficLights && !layout.isFullScreen ? (
          <div className="titlebar-traffic-light-pad" />
        ) : hasCustomTitleBar ? (
          /* Replace native Windows/Linux chrome with logo and application-menu access. */
          <>
            <img src={logo} alt="" aria-hidden className="titlebar-logo" />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="titlebar-icon-button"
                  aria-label={translate('auto.App.8b0b8eb54f', 'Application menu')}
                  onClick={() => window.api.ui.popupMenu()}
                >
                  <MoreHorizontal size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6}>
                {translate('auto.App.8b0b8eb54f', 'Application menu')}
              </TooltipContent>
            </Tooltip>
          </>
        ) : (
          // Without traffic lights, inset the name to the sidebar's icon column (14px + its 4px padding).
          <div className="pl-3.5" />
        )}
        {layout.showSidebar && !hasCustomTitleBar && layout.showTitlebarAppName && (
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div className="titlebar-app-name">
                <span className="titlebar-app-name-main">{APP_DISPLAY_NAME}</span>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem
                onSelect={() => {
                  void updateSettings({ showTitlebarAppName: false })
                }}
              >
                {translate('auto.App.e81217c1b7', 'Hide App Name')}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        )}
        {layout.showSidebar && !layout.sidebarOpen && sidebarToggle}
      </div>
      {/* Cove: an open sidebar keeps search and its toggle at the far edge, mirroring the explorer's panel-right. */}
      {layout.showSidebar && layout.sidebarOpen && (
        <div className="ml-auto mr-2 flex items-center gap-0.5 pl-2">
          {searchButton}
          {sidebarToggle}
        </div>
      )}
      {/* Show shared workspace/page history wherever its shortcut is available. */}
      {!layout.sidebarOpen && shouldShowWorktreeHistoryControls(layout.activeView) && (
        // Collapsed headers shrink-wrap, so ml-auto alone cannot leave a history-button gutter.
        <div className="ml-auto mr-3 flex items-center pl-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="sidebar-toggle sidebar-toggle-compact"
                onClick={() => useAppStore.getState().goBackWorktree()}
                disabled={!canGoBackWorktree}
                aria-label={translate('auto.App.064bd07810', 'Go back')}
              >
                <ArrowLeft size={12} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              {translate('auto.App.fe21e8f6f5', 'Go back ({{value0}})', {
                value0: historyBackShortcutLabel
              })}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="sidebar-toggle sidebar-toggle-compact"
                onClick={() => useAppStore.getState().goForwardWorktree()}
                disabled={!canGoForwardWorktree}
                aria-label={translate('auto.App.cf9099fe98', 'Go forward')}
              >
                <ArrowRight size={12} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              {translate('auto.App.f7aa73e785', 'Go forward ({{value0}})', {
                value0: historyForwardShortcutLabel
              })}
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  )
}

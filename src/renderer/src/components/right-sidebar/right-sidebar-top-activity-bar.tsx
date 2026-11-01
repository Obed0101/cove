import React from 'react'
import type { ActiveRightSidebarTab, ActivityBarPosition } from '@/store/slices/editor'
import type { CheckStatus } from '../../../../shared/github/pull-request-types'
import { cn } from '@/lib/utils'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu'
import type { ActivityBarItem } from './activity-bar-buttons'
import { RightSidebarSegmentedTabs } from './right-sidebar-segmented-tabs'
import { ActivityBarPositionMenu } from './activity-bar-position-menu'
import {
  RIGHT_SIDEBAR_HEADER_NO_DRAG_CLASS_NAME,
  RIGHT_SIDEBAR_TOP_ACTIVITY_STRIP_CLASS_NAME,
  RIGHT_SIDEBAR_WINDOWS_TOP_ACTIVITY_STRIP_CLASS_NAME
} from './right-sidebar-titlebar-drag-regions'

export function RightSidebarTopActivityBar({
  hasDesktopWindowChrome,
  topActivityStripRef,
  topActivityLayout,
  effectiveTab,
  onSelectTab,
  checksStatus,
  closeButton,
  activityBarPosition,
  onChangeActivityBarPosition
}: {
  hasDesktopWindowChrome: boolean
  topActivityStripRef: (node: HTMLDivElement | null) => void
  topActivityLayout: { visibleItems: ActivityBarItem[]; overflowItems: ActivityBarItem[] }
  effectiveTab: ActiveRightSidebarTab
  onSelectTab: (tab: ActiveRightSidebarTab) => void
  checksStatus: CheckStatus | null
  closeButton: React.ReactNode
  activityBarPosition: ActivityBarPosition
  onChangeActivityBarPosition: (pos: ActivityBarPosition) => void
}): React.JSX.Element {
  const allItems = [...topActivityLayout.visibleItems, ...topActivityLayout.overflowItems]
  return (
    <ContextMenu>
      <div className="flex h-[44px] min-h-[44px] items-center right-sidebar-header-inset right-sidebar-header-drag overflow-hidden">
        {!hasDesktopWindowChrome && (
          <TooltipProvider delayDuration={400}>
            <ContextMenuTrigger asChild>
              <div
                ref={topActivityStripRef}
                className={RIGHT_SIDEBAR_TOP_ACTIVITY_STRIP_CLASS_NAME}
              >
                <RightSidebarSegmentedTabs
                  items={allItems}
                  effectiveTab={effectiveTab}
                  onSelectTab={onSelectTab}
                  checksStatus={checksStatus}
                />
              </div>
            </ContextMenuTrigger>
            <div
              className={cn(
                'flex shrink-0 items-center pr-1',
                RIGHT_SIDEBAR_HEADER_NO_DRAG_CLASS_NAME
              )}
            >
              {closeButton}
            </div>
          </TooltipProvider>
        )}
        {hasDesktopWindowChrome && (
          <TooltipProvider delayDuration={400}>
            <div
              className={cn(
                'ml-auto flex shrink-0 items-center pr-1',
                RIGHT_SIDEBAR_HEADER_NO_DRAG_CLASS_NAME
              )}
            >
              {closeButton}
            </div>
          </TooltipProvider>
        )}
      </div>
      {hasDesktopWindowChrome && (
        <TooltipProvider delayDuration={400}>
          <ContextMenuTrigger asChild>
            <div
              ref={topActivityStripRef}
              className={RIGHT_SIDEBAR_WINDOWS_TOP_ACTIVITY_STRIP_CLASS_NAME}
            >
              {/* Keep navigation in the body so custom desktop titlebars remain visually native and uncrowded. */}
              <RightSidebarSegmentedTabs
                items={allItems}
                effectiveTab={effectiveTab}
                onSelectTab={onSelectTab}
                checksStatus={checksStatus}
              />
            </div>
          </ContextMenuTrigger>
        </TooltipProvider>
      )}
      <ActivityBarPositionMenu
        currentPosition={activityBarPosition}
        onChangePosition={onChangeActivityBarPosition}
      />
    </ContextMenu>
  )
}

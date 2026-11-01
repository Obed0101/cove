import { useLayoutEffect, useRef, useState } from 'react'
import type { ActiveRightSidebarTab } from '@/store/slices/editor'
import type { CheckStatus } from '../../../../shared/github/pull-request-types'
import { cn } from '@/lib/utils'
import { translate } from '@/i18n/i18n'
import { useAppStore } from '@/store'
import { STATUS_DOT_COLOR, activityItemAriaLabel } from './activity-bar-buttons'
import type { ActivityBarItem } from './activity-bar-buttons'
import { RIGHT_SIDEBAR_HEADER_NO_DRAG_CLASS_NAME } from './right-sidebar-titlebar-drag-regions'

const LEADING_SEGMENT_IDS: readonly ActiveRightSidebarTab[] = ['explorer', 'source-control']
const EMPTY_STATUS: readonly unknown[] = []

// Short segment names; the full panel title stays in the tooltip and accessible label.
function segmentLabel(item: ActivityBarItem): string {
  switch (item.id) {
    case 'explorer':
      return translate('auto.components.right.sidebar.segmented.files', 'Files')
    case 'source-control':
      return translate('auto.components.right.sidebar.segmented.changes', 'Changes')
    case 'workspaces':
      return translate('auto.components.right.sidebar.segmented.worktrees', 'Worktrees')
    default:
      return item.title
  }
}

function segmentClassName(active: boolean): string {
  return cn(
    'relative flex h-6 flex-[1_0_0%] items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-xs transition-[color,background-color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
    active ? 'text-foreground' : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
  )
}

type ThumbRect = { left: number; top: number; width: number; height: number }

function sameThumbRect(a: ThumbRect | null, b: ThumbRect | null): boolean {
  return (
    a === b ||
    (a !== null &&
      b !== null &&
      a.left === b.left &&
      a.top === b.top &&
      a.width === b.width &&
      a.height === b.height)
  )
}

/** Tracks the active segment's box inside the track so one thumb can slide between segments. */
function useActiveSegmentThumb(
  trackRef: React.RefObject<HTMLDivElement | null>,
  layoutKey: string
): ThumbRect | null {
  const [thumb, setThumb] = useState<ThumbRect | null>(null)

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) {
      return
    }
    const measure = (): void => {
      const active = track.querySelector<HTMLElement>('[aria-pressed="true"]')
      const next = active
        ? {
            left: active.offsetLeft,
            top: active.offsetTop,
            width: active.offsetWidth,
            height: active.offsetHeight
          }
        : null
      setThumb((current) => (sameThumbRect(current, next) ? current : next))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') {
      return
    }
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    for (const segment of track.querySelectorAll('button')) {
      observer.observe(segment)
    }
    return () => observer.disconnect()
  }, [trackRef, layoutKey])

  return thumb
}

// Cove: every panel is one named click away; segments grow to fill the track and scroll sideways when they outgrow it.
export function RightSidebarSegmentedTabs({
  items,
  effectiveTab,
  onSelectTab,
  checksStatus
}: {
  items: ActivityBarItem[]
  effectiveTab: ActiveRightSidebarTab
  onSelectTab: (tab: ActiveRightSidebarTab) => void
  checksStatus: CheckStatus | null
}): React.JSX.Element {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const changeCount = useAppStore(
    (s) =>
      (s.activeWorktreeId ? s.gitStatusByWorktree[s.activeWorktreeId] : EMPTY_STATUS)?.length ?? 0
  )
  const orderedItems = [
    ...items.filter((item) => LEADING_SEGMENT_IDS.includes(item.id)),
    ...items.filter((item) => !LEADING_SEGMENT_IDS.includes(item.id))
  ]
  const thumb = useActiveSegmentThumb(
    trackRef,
    `${effectiveTab}:${orderedItems.map((item) => item.id).join(',')}`
  )

  useLayoutEffect(() => {
    const track = trackRef.current
    const active = track?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (!track || !active) {
      return
    }
    if (active.offsetLeft < track.scrollLeft) {
      track.scrollLeft = active.offsetLeft
    } else if (active.offsetLeft + active.offsetWidth > track.scrollLeft + track.clientWidth) {
      track.scrollLeft = active.offsetLeft + active.offsetWidth - track.clientWidth
    }
  }, [effectiveTab])

  return (
    <div
      ref={trackRef}
      className={cn(
        'relative flex min-w-0 flex-1 gap-0.5 overflow-x-auto scrollbar-none rounded-lg bg-foreground/5 p-0.5',
        RIGHT_SIDEBAR_HEADER_NO_DRAG_CLASS_NAME
      )}
    >
      {thumb ? (
        <span
          aria-hidden
          data-segmented-thumb=""
          className="pointer-events-none absolute left-0 top-0 rounded-md bg-control-active ring-1 ring-border transition-[transform,width] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none"
          style={{
            transform: `translate(${thumb.left}px, ${thumb.top}px)`,
            width: thumb.width,
            height: thumb.height
          }}
        />
      ) : null}
      {orderedItems.map((item) => {
        const active = effectiveTab === item.id
        const status = item.statusIndicator ?? (item.id === 'checks' ? checksStatus : null)
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={active}
            aria-label={activityItemAriaLabel(item, status)}
            title={item.shortcut ? `${item.title} (${item.shortcut})` : item.title}
            data-workspace-board-dismiss=""
            onClick={() => onSelectTab(item.id)}
            className={segmentClassName(active)}
          >
            <span>{segmentLabel(item)}</span>
            {item.id === 'source-control' && changeCount > 0 ? (
              <span className="text-[11px] tabular-nums text-muted-foreground">{changeCount}</span>
            ) : null}
            {status && status !== 'neutral' ? (
              <span
                aria-hidden
                className={cn('size-1.5 shrink-0 rounded-full', STATUS_DOT_COLOR[status])}
              />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

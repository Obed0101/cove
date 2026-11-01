import React, { useRef } from 'react'
import { flushSync } from 'react-dom'
import { FileExplorerViewSwitch } from './FileExplorerViewSwitch'
import { cn } from '@/lib/utils'
import type { RightSidebarExplorerView } from '../../../../shared/ui-chrome-types'

type FileExplorerQueryStripProps = {
  view: RightSidebarExplorerView
  onSelectView: (view: RightSidebarExplorerView) => void
  actions: React.ReactNode
  children: React.ReactNode
}

export function FileExplorerQueryStrip({
  view,
  onSelectView,
  actions,
  children
}: FileExplorerQueryStripProps): React.JSX.Element {
  const stripRef = useRef<HTMLDivElement>(null)
  const focusedQuery = (): HTMLInputElement | null =>
    stripRef.current?.querySelector<HTMLInputElement>('[data-explorer-query-input]:focus') ?? null

  const handleSelectView = (nextView: RightSidebarExplorerView): void => {
    if (!focusedQuery()) {
      onSelectView(nextView)
      return
    }

    // Commit visibility before focusing the other mounted query field.
    flushSync(() => onSelectView(nextView))
    stripRef.current
      ?.querySelector<HTMLInputElement>(`[data-explorer-query-input="${nextView}"]`)
      ?.focus({ preventScroll: true })
  }

  return (
    <div
      ref={stripRef}
      className="group/explorer-query relative flex items-start gap-1 px-2 pb-1"
      onPointerDownCapture={(event) => {
        if (
          event.button === 0 &&
          event.target instanceof Element &&
          event.target.closest('[data-explorer-view-switch]') &&
          focusedQuery()
        ) {
          event.preventDefault()
        }
      }}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">{children}</div>
      {/* Cove: explorer actions overlay the search's right end, so the resting row is the preview's full-width search. */}
      <div
        className={cn(
          'flex h-8 shrink-0 items-center gap-0.5 transition-opacity',
          view === 'search'
            ? 'opacity-100'
            : 'absolute top-0 right-2 rounded-md bg-shell pl-1 opacity-0 group-hover/explorer-query:opacity-100 focus-within:opacity-100 has-[[data-state=open]]:opacity-100'
        )}
      >
        <FileExplorerViewSwitch view={view} onSelectView={handleSelectView} />
        {actions}
      </div>
    </div>
  )
}

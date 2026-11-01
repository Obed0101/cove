import React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { handleRepoHeaderCollapseAffordancePointerDown } from './header-event-guards'

// Cove: the chevron stays visible at rest; hover actions overlay it.
export function SectionHeaderCollapseChevron({
  collapsed,
  onToggle
}: {
  collapsed: boolean
  onToggle: () => void
}): React.JSX.Element {
  return (
    <div
      className="flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground"
      data-repo-header-collapse-affordance=""
      aria-hidden
      onPointerDown={handleRepoHeaderCollapseAffordancePointerDown}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onToggle()
      }}
    >
      <ChevronDown className={cn('size-3 transition-transform', collapsed && '-rotate-90')} />
    </div>
  )
}

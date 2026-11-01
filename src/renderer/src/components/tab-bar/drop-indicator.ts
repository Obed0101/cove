export type DropIndicator = 'left' | 'right' | null

// Use a visible blue insertion cue above tab borders without changing layout.
export function getDropIndicatorClasses(dropIndicator: DropIndicator): string {
  if (dropIndicator === 'left') {
    return "before:absolute before:inset-y-0 before:left-0 before:w-[2px] before:bg-blue-500 before:z-10 before:content-['']"
  }
  if (dropIndicator === 'right') {
    return "after:absolute after:inset-y-0 after:right-0 after:w-[2px] after:bg-blue-500 after:z-10 after:content-['']"
  }
  return ''
}

// Isolation keeps this layer above the root background and below the tab contents.
// An inset outline stays inside the overflow-clipped strip without using a shadow.
const TAB_INDICATOR_CLASSES =
  'pointer-events-none absolute -z-10 inset-0 rounded-md group-focus-visible:outline-2 group-focus-visible:-outline-offset-2 group-focus-visible:outline-ring'

export function getTabIndicatorClasses(isActive: boolean): string {
  return `${TAB_INDICATOR_CLASSES} ${isActive ? 'bg-foreground/8' : 'group-hover:bg-foreground/6'}`
}

export const TAB_UNREAD_OVERLAY_CLASSES =
  'pointer-events-none absolute inset-0 rounded-md bg-status-warning/10'

export function getTabRootStateClasses(isActive: boolean): string {
  return isActive
    ? 'isolate text-foreground'
    : 'isolate text-muted-foreground hover:text-foreground'
}

export function getTabStripBorderClasses(
  _hasTabsToRight: boolean,
  options?: { includeTopBorder?: boolean }
): string {
  const includeTopBorder = options?.includeTopBorder ?? true
  return includeTopBorder ? 'border-t border-transparent' : ''
}

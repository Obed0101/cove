import { cn } from '@/lib/utils'
import { useTabDragActive } from '../tab-group/tab-drag-context'
import { useTabEntersStrip } from './tab-strip-entrance'
import { TAB_CONTAINER_WIDTH_CLASSES } from './tab-width-rules'

type TabStripSlotProps = {
  className: string
  'data-tab-strip-slot': string
  'data-active-tab-dock': '' | undefined
}

/** Dock the active slot at viewport edges except during drag, when overlapping rects would corrupt drop targets. */
export function useTabStripSlotProps(tabId: string, isActive: boolean): TabStripSlotProps {
  const isTabDragActive = useTabDragActive()
  const entersStrip = useTabEntersStrip()
  const docks = isActive && !isTabDragActive
  return {
    className: cn(
      TAB_CONTAINER_WIDTH_CLASSES,
      docks && 'sticky inset-x-0 z-10',
      entersStrip && 'cove-tab-in'
    ),
    'data-tab-strip-slot': tabId,
    'data-active-tab-dock': docks ? '' : undefined
  }
}

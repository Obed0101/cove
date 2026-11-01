import type React from 'react'
import { TextSearch } from 'lucide-react'
import { translate } from '@/i18n/i18n'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { RightSidebarExplorerView } from '../../../../shared/ui-chrome-types'

type FileExplorerViewSwitchProps = {
  view: RightSidebarExplorerView
  onSelectView: (view: RightSidebarExplorerView) => void
}

// Cove: the design preview shows a single "Find files" field, so content search is an icon toggle.
export function FileExplorerViewSwitch({
  view,
  onSelectView
}: FileExplorerViewSwitchProps): React.JSX.Element {
  const searchingContents = view === 'search'
  const label = translate(
    'auto.components.right.sidebar.FileExplorerToolbar.c1f3f3ec70',
    'Search file contents'
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={searchingContents ? 'secondary' : 'ghost'}
          size="icon-xs"
          data-explorer-view-switch=""
          data-ignore-file-explorer-keys="true"
          aria-label={label}
          aria-pressed={searchingContents}
          className="group/view-switch"
          onClick={() => onSelectView(searchingContents ? 'files' : 'search')}
        >
          <TextSearch
            className={cn(
              'size-3',
              !searchingContents &&
                'text-muted-foreground group-hover/view-switch:text-accent-foreground'
            )}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={4}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

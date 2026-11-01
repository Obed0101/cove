import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { translate } from '@/i18n/i18n'
import { useAppStore } from '@/store'

function closeToWorkspace(closePage: () => void): void {
  closePage()
  // A page opened from another page closes back to it; the label promises the workspace.
  const { activeView, setActiveView } = useAppStore.getState()
  if (activeView !== 'terminal') {
    setActiveView('terminal')
  }
}

// Cove: the preview's page heading — icon-only back, title, one-line description.
export function WorkspacePageHeading({
  title,
  description,
  onBack,
  children
}: {
  title: string
  description: string
  onBack: () => void
  children?: ReactNode
}): React.JSX.Element {
  const backLabel = translate('workspacePage.backToWorkspace', 'Back to workspace')
  return (
    <header className="cove-page-in flex-none">
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={backLabel}
              onClick={() => closeToWorkspace(onBack)}
              className="-ml-1.5 size-7 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6}>
            {backLabel}
          </TooltipContent>
        </Tooltip>
        <h1 className="m-0 text-xl font-semibold">{title}</h1>
        {children}
      </div>
      <p className="mt-1.5 mb-6 pl-[30px] text-xs text-muted-foreground">{description}</p>
    </header>
  )
}

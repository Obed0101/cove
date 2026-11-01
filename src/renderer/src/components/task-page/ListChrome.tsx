import type { TaskPageComposerActionsModel } from '../use-task-page-composer-actions'
import { cn } from '@/lib/utils'
import { TaskPageSourceBar } from './SourceBar'
import { AlertCircle } from 'lucide-react'
import { TaskPageGitHubModeControls } from './github/ModeControls'
import { TaskPageProviderFilters } from './ProviderFilters'
export function TaskPageListChrome({
  model
}: {
  model: TaskPageComposerActionsModel
}): React.JSX.Element | null {
  const { taskSourceAvailabilityNotice, taskPageListChromeHidden } = model
  return (
    <div className={cn('flex-none flex flex-col gap-2', taskPageListChromeHidden && 'hidden')}>
      {/* Cove: provider and GitHub view share one row; filters follow as a single toolbar. */}
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1">
          <TaskPageSourceBar model={model} />
        </div>
        <TaskPageGitHubModeControls model={model} />
      </div>

      {taskSourceAvailabilityNotice ? (
        <div
          role="status"
          className="flex max-w-3xl items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
          title={taskSourceAvailabilityNotice.title}
        >
          <AlertCircle className="size-3.5 flex-none" />
          <span className="min-w-0 truncate">{taskSourceAvailabilityNotice.label}</span>
        </div>
      ) : null}

      <TaskPageProviderFilters model={model} />
    </div>
  )
}

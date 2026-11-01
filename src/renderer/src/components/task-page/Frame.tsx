import type { TaskPageComposerActionsModel } from '../use-task-page-composer-actions'
import { TaskPageListChrome } from './ListChrome'
import { TaskPageContent } from './Content'
import { WorkspacePageHeading } from '@/components/workspace-page/WorkspacePageHeading'
import { cn } from '@/lib/utils'
import { translate } from '@/i18n/i18n'
export function TaskPageFrame({
  model
}: {
  model: TaskPageComposerActionsModel
}): React.JSX.Element | null {
  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="mx-auto flex min-h-0 min-w-0 w-full flex-1 flex-col px-6 pt-6 pb-4">
        {/* Detail pages bring their own back navigation. */}
        <div className={cn(model.taskPageListChromeHidden && 'hidden')}>
          <WorkspacePageHeading
            title={translate('workspacePage.tasksTitle', 'Tasks')}
            description={translate(
              'workspacePage.tasksDescription',
              'Work to pick up across your projects.'
            )}
            onBack={model.closeTaskPage}
          />
        </div>
        <TaskPageListChrome model={model} />

        <TaskPageContent model={model} />
      </div>
    </div>
  )
}

import type { TaskPageComposerActionsModel } from '../../use-task-page-composer-actions'
import { cn } from '@/lib/utils'
import TaskProjectSourceCombobox from '@/components/task-project-source-combobox'
import { normalizeTaskRepoSelection } from '@/components/task-page/task-page-default-repo-selection'
import { toast } from 'sonner'
import { translate } from '@/i18n/i18n'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
export function TaskPageGitHubModeControls({
  model
}: {
  model: TaskPageComposerActionsModel
}): React.JSX.Element | null {
  const {
    setTaskResumeState,
    updateSettings,
    eligibleRepos,
    repoSelection,
    setRepoSelection,
    taskPickerGroups,
    taskPickerRepos,
    githubModeButtons,
    taskSource,
    getTaskPickerRepoHostLabel,
    projectModeVisible,
    githubMode,
    setGithubMode,
    activeGithubTaskKind,
    selectedGitHubRepoExternalLink,
    handleSelectGithubTaskKind
  } = model
  return taskSource === 'github' ? (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {projectModeVisible ? (
        <div
          role="group"
          aria-label={translate('taskPage.githubMode', 'GitHub view')}
          className="flex gap-0.5 rounded-lg bg-foreground/5 p-0.5"
        >
          {githubModeButtons.map((mode) => {
            const active =
              mode.id === 'project'
                ? githubMode === 'project'
                : githubMode === 'items' && activeGithubTaskKind === mode.id
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  if (mode.id === 'project') {
                    setGithubMode('project')
                    setTaskResumeState({
                      githubMode: 'project'
                    })
                    return
                  }
                  setGithubMode('items')
                  setTaskResumeState({
                    githubMode: 'items'
                  })
                  handleSelectGithubTaskKind(mode.id)
                }}
                aria-pressed={active}
                className={cn(
                  'flex h-6 items-center whitespace-nowrap rounded-md px-2.5 text-xs transition-[color,background-color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                  active
                    ? 'bg-control-active text-foreground ring-1 ring-border'
                    : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
                )}
              >
                {mode.label}
              </button>
            )
          })}
        </div>
      ) : null}
      {/* Why: Project rows are repo-scoped, so the selection must stay visible in both GitHub modes. */}
      <div className="min-w-0 max-w-[220px] shrink-0">
        <TaskProjectSourceCombobox
          groups={taskPickerGroups}
          selected={repoSelection}
          getRepoHostLabel={getTaskPickerRepoHostLabel}
          onChange={(next) => {
            const normalized = normalizeTaskRepoSelection(eligibleRepos, next)
            setRepoSelection(normalized)
            void updateSettings({
              defaultRepoSelection: [...normalized]
            }).catch(() => {
              toast.error(
                translate(
                  'auto.components.TaskPage.dfd72673e7',
                  'Failed to save project selection.'
                )
              )
            })
          }}
          onSelectAll={() => {
            const allIds = new Set(taskPickerRepos.map((r) => r.id))
            setRepoSelection(allIds)
            void updateSettings({
              defaultRepoSelection: null
            }).catch(() => {
              toast.error(
                translate(
                  'auto.components.TaskPage.dfd72673e7',
                  'Failed to save project selection.'
                )
              )
            })
          }}
          triggerClassName="h-7 w-auto max-w-[220px] rounded-md border border-transparent bg-foreground/5 px-2 text-xs font-medium transition hover:bg-foreground/8 focus:ring-2 focus:ring-ring/20 focus:outline-none"
        />
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              if (!selectedGitHubRepoExternalLink?.url) {
                return
              }
              void window.api.shell.openUrl(selectedGitHubRepoExternalLink.url)
            }}
            aria-label={
              selectedGitHubRepoExternalLink
                ? translate('auto.components.TaskPage.8d1e17a3ef', 'Open {{value0}} in GitHub', {
                    value0: selectedGitHubRepoExternalLink.label
                  })
                : translate(
                    'auto.components.TaskPage.d1132848f8',
                    'Select one GitHub project to open in GitHub'
                  )
            }
            className="size-7 rounded-md text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6}>
          {selectedGitHubRepoExternalLink
            ? translate('auto.components.TaskPage.8d1e17a3ef', 'Open {{value0}} in GitHub', {
                value0: selectedGitHubRepoExternalLink.label
              })
            : translate(
                'auto.components.TaskPage.bc46d8204e',
                'Select one project to open in GitHub'
              )}
        </TooltipContent>
      </Tooltip>
    </div>
  ) : null
}

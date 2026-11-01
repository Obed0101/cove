import { ChevronDown, Columns3, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { translate } from '@/i18n/i18n'
import {
  updateGitHubTaskViewPreference,
  useGitHubTaskViewPreference,
  type GitHubTaskBoardGroupBy
} from './github-task-view-preference'

function getGroupByOptions(): { id: GitHubTaskBoardGroupBy; label: string }[] {
  return [
    { id: 'status', label: translate('auto.components.TaskPage.154b0fa623', 'Status') },
    { id: 'repo', label: translate('taskPage.board.groupRepo', 'Project') },
    { id: 'assignee', label: translate('taskPage.board.groupAssignee', 'Assignee') },
    { id: 'label', label: translate('taskPage.board.groupLabel', 'Label') }
  ]
}

function isGroupBy(value: string): value is GitHubTaskBoardGroupBy {
  return getGroupByOptions().some((option) => option.id === value)
}

// Cove: Linear-style view switch; board grouping is only offered once the board is showing.
export function TaskPageGitHubViewControls(): React.JSX.Element {
  const { view, groupBy } = useGitHubTaskViewPreference()
  const groupByOptions = getGroupByOptions()
  const groupByLabel = groupByOptions.find((option) => option.id === groupBy)?.label
  return (
    <div className="flex shrink-0 items-center gap-1">
      {view === 'board' ? (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="xs" className="gap-1 text-muted-foreground">
              {translate('taskPage.board.groupBy', 'Group')}:
              <span className="text-foreground">{groupByLabel}</span>
              <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {translate('taskPage.board.groupByTitle', 'Group board by')}
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={groupBy}
              onValueChange={(value) => {
                if (isGroupBy(value)) {
                  updateGitHubTaskViewPreference({ groupBy: value })
                }
              }}
            >
              {groupByOptions.map((option) => (
                <DropdownMenuRadioItem key={option.id} value={option.id}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
      <ToggleGroup
        type="single"
        variant="segmented"
        size="xs"
        spacing={1}
        value={view}
        onValueChange={(value) => {
          if (value === 'list' || value === 'board') {
            updateGitHubTaskViewPreference({ view: value })
          }
        }}
        aria-label={translate('taskPage.board.viewMode', 'Task view')}
      >
        <ToggleGroupItem value="list" aria-label={translate('jira.board.list', 'List')}>
          <List className="size-3.5" />
        </ToggleGroupItem>
        <ToggleGroupItem value="board" aria-label={translate('jira.board.board', 'Board')}>
          <Columns3 className="size-3.5" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}

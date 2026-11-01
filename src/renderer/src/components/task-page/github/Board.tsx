import { useMemo } from 'react'
import { ArrowRight, CircleDot, GitPullRequest, GitPullRequestDraft } from 'lucide-react'
import type { TaskPageComposerActionsModel } from '../../use-task-page-composer-actions'
import type { GitHubWorkItem } from '../../../../../shared/github/work-item-types'
import { getWorkItemRepo } from '@/lib/work-item-repo-row'
import { findGithubWorkItemWorkspaceAttachment } from '@/lib/github-work-item-workspace-attachment'
import { Button } from '@/components/ui/button'
import RepoBadgeLabel from '@/components/repo/RepoBadgeLabel'
import { translate } from '@/i18n/i18n'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '../../task-page-source-context'
import { GitHubAssigneeAvatar } from './Avatars'
import {
  getTaskPageGitHubPRIconTone,
  isTaskPageGitHubDraftPR
} from './task-page-github-work-item-status'
import {
  groupGitHubTaskBoardColumns,
  type GitHubTaskBoardColumn,
  type GitHubTaskBoardStatus
} from './github-task-board-columns'
import type { GitHubTaskBoardGroupBy } from './github-task-view-preference'

const STATUS_DOT_CLASS_NAMES: Record<GitHubTaskBoardStatus, string> = {
  open: 'bg-status-success',
  draft: 'bg-muted-foreground',
  review: 'bg-status-warning',
  changes: 'bg-destructive',
  approved: 'bg-callout-note',
  merged: 'bg-callout-important',
  closed: 'bg-muted-foreground/50'
}

function getStatusLabels(): Record<GitHubTaskBoardStatus, string> {
  return {
    open: translate('auto.components.TaskPage.606a85c774', 'Open'),
    draft: translate('auto.components.TaskPage.054bf695cc', 'Draft'),
    review: translate('taskPage.board.needsReview', 'Needs review'),
    changes: translate('taskPage.board.changesRequested', 'Changes requested'),
    approved: translate('taskPage.board.approved', 'Approved'),
    merged: translate('auto.components.github.pr.merge.state.83ecdbb4a6', 'Merged'),
    closed: translate('auto.components.TaskPage.d09bf34db7', 'Closed')
  }
}

function getEmptyGroupLabel(groupBy: GitHubTaskBoardGroupBy): string {
  return groupBy === 'assignee'
    ? translate('taskPage.board.unassigned', 'Unassigned')
    : translate('taskPage.board.noLabel', 'No label')
}

function WorkItemTypeIcon({ item }: { item: GitHubWorkItem }): React.JSX.Element {
  if (item.type === 'issue') {
    return <CircleDot className="size-3.5 text-status-success" aria-hidden />
  }
  const Icon = isTaskPageGitHubDraftPR(item) ? GitPullRequestDraft : GitPullRequest
  return <Icon className={cn('size-3.5', getTaskPageGitHubPRIconTone(item))} aria-hidden />
}

function BoardCard({
  item,
  model
}: {
  item: GitHubWorkItem
  model: TaskPageComposerActionsModel
}): React.JSX.Element {
  const {
    repos,
    allWorktrees,
    selectedRepos,
    openGitHubDetailPage,
    handleOpenOrUseGitHubWorkItem
  } = model
  const itemRepo = getWorkItemRepo(repos, item) ?? null
  const attached = findGithubWorkItemWorkspaceAttachment(
    allWorktrees,
    item.repoId,
    item.type,
    item.number,
    item.url
  )
  const assignees = item.assignees ?? []
  return (
    // Why: clickable div, not a <button>, because it nests the Start button.
    <div
      role="button"
      tabIndex={0}
      onClick={() => openGitHubDetailPage(item)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openGitHubDetailPage(item)
        }
      }}
      className="group/board-card flex cursor-pointer flex-col gap-1.5 rounded-md border border-border/60 bg-pane-surface px-3 py-2.5 text-left shadow-xs transition-colors hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <div className="flex h-5 items-center gap-1.5 text-[11px] text-muted-foreground">
        <WorkItemTypeIcon item={item} />
        <span className="font-mono">#{item.number}</span>
        {selectedRepos.length > 1 && itemRepo ? (
          <RepoBadgeLabel
            name={itemRepo.displayName}
            color={itemRepo.badgeColor}
            badgeClassName="size-1.5"
            className="min-w-0 truncate"
          />
        ) : null}
        <span className="flex-1" />
        <Button
          type="button"
          variant={attached ? 'default' : 'ghost'}
          size="xs"
          onClick={(event) => {
            event.stopPropagation()
            handleOpenOrUseGitHubWorkItem(item)
          }}
          className={cn(
            'h-5 gap-1 px-1.5 text-[11px] transition-opacity',
            !attached &&
              'opacity-0 group-hover/board-card:opacity-100 group-focus-within/board-card:opacity-100'
          )}
        >
          {attached
            ? translate('auto.components.TaskPage.7753652524', 'Resume')
            : translate('auto.components.TaskPage.7d08e8be0f', 'Start')}
          <ArrowRight className="size-3" />
        </Button>
      </div>
      <p className="m-0 line-clamp-2 text-[13px] font-medium leading-snug text-foreground">
        {item.title}
      </p>
      <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
        {item.labels.slice(0, 2).map((label) => (
          <span
            key={label}
            className="max-w-28 truncate rounded-full border border-border/60 px-1.5 leading-4"
          >
            {label}
          </span>
        ))}
        <span className="flex-1" />
        {assignees.length > 0 ? (
          <span className="flex -space-x-1">
            {assignees.slice(0, 3).map((assignee) => (
              <GitHubAssigneeAvatar key={assignee.login} assignee={assignee} />
            ))}
          </span>
        ) : null}
        <span className="shrink-0 tabular-nums">{formatRelativeTime(item.updatedAt)}</span>
      </div>
    </div>
  )
}

function BoardColumn({
  column,
  loading,
  model
}: {
  column: GitHubTaskBoardColumn
  loading: boolean
  model: TaskPageComposerActionsModel
}): React.JSX.Element {
  return (
    <section
      aria-label={column.title}
      className="flex min-h-40 w-72 shrink-0 flex-col rounded-lg bg-foreground/5"
    >
      <header className="flex h-9 items-center gap-2 px-3 text-xs font-medium">
        <span
          aria-hidden
          className={cn(
            'size-2 rounded-full',
            column.status ? STATUS_DOT_CLASS_NAMES[column.status] : 'bg-muted-foreground/60'
          )}
        />
        <span className="min-w-0 truncate">{column.title}</span>
        <span className="tabular-nums text-muted-foreground">
          {loading ? '' : column.items.length}
        </span>
      </header>
      <div className="flex flex-col gap-2 px-2 pb-2">
        {loading
          ? [0, 1].map((index) => (
              <div key={index} className="h-[74px] animate-pulse rounded-md bg-muted/70" />
            ))
          : column.items.map((item) => (
              <BoardCard
                key={`${item.repoId}:${item.repoHostId ?? ''}:${item.id}`}
                item={item}
                model={model}
              />
            ))}
      </div>
    </section>
  )
}

export function TaskPageGitHubBoard({
  model,
  groupBy
}: {
  model: TaskPageComposerActionsModel
  groupBy: GitHubTaskBoardGroupBy
}): React.JSX.Element {
  const { repos, filteredWorkItems, activeGithubTaskKind, showGitHubTaskSkeletons } = model
  const columns = useMemo(
    () =>
      groupGitHubTaskBoardColumns({
        items: filteredWorkItems,
        // Skeleton lanes need a stable shape before data arrives.
        groupBy: showGitHubTaskSkeletons ? 'status' : groupBy,
        kind: activeGithubTaskKind,
        statusLabels: getStatusLabels(),
        emptyGroupLabel: getEmptyGroupLabel(groupBy),
        getRepoLabel: (item) => getWorkItemRepo(repos, item)?.displayName ?? item.repoId
      }),
    [filteredWorkItems, groupBy, activeGithubTaskKind, showGitHubTaskSkeletons, repos]
  )
  return (
    <div className="flex w-max min-w-full items-start gap-3 p-3">
      {columns.map((column) => (
        <BoardColumn
          key={column.key}
          column={column}
          loading={showGitHubTaskSkeletons}
          model={model}
        />
      ))}
    </div>
  )
}

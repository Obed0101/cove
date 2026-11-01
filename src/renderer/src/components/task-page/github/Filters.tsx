import type { TaskPageComposerActionsModel } from '../../use-task-page-composer-actions'
import { getGitHubTaskKindPresets } from '@/components/task-page-localized-options'
import { cn } from '@/lib/utils'
import PRFilterDropdowns from '@/components/github/PRFilterDropdowns'
import { Search, X, Plus, LoaderCircle, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { translate } from '@/i18n/i18n'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { resolveNewIssueOpenSeed } from '@/components/task-page-new-issue-draft'
import { useAppStore } from '@/store'
import { useShallow } from 'zustand/react/shallow'
import { getGitHubRepoRoutingTarget } from '@/lib/github-source-runtime-context'
import { hasUpstreamCandidateDivergence, hasDivergentSources } from '../../task-page-draft-storage'
import IssueSourceIndicator from '@/components/github/IssueSourceIndicator'
import IssueSourceSelector, { issueSourceChipClass } from '@/components/github/IssueSourceSelector'
import RepoBadgeLabel from '@/components/repo/RepoBadgeLabel'
import { repoMatchesHostIdentity } from '@/store/slices/repo-host-identity'
import { TaskPageGitHubViewControls } from './ViewControls'
export function TaskPageGitHubFilters({
  model
}: {
  model: TaskPageComposerActionsModel
}): React.JSX.Element | null {
  const {
    setTaskResumeState,
    setIssueSourcePreference,
    selectedRepos,
    taskSearchInput,
    setTaskSearchInput,
    appliedTaskSearch,
    setAppliedTaskSearch,
    taskSearchInputRef,
    activeTaskPreset,
    setActiveTaskPreset,
    setTaskRefreshNonce,
    perRepoSourceState,
    handleRefreshGithubTasks,
    setNewIssueOpen,
    setNewIssueTitle,
    setNewIssueBody,
    setNewIssueLabels,
    setNewIssueAssignees,
    setNewIssueRepoId,
    newIssueTargetRepo,
    activeGithubTaskKind,
    appliedTaskQuery,
    loadedGitHubAuthorLogins,
    primaryGithubFilterSlug,
    applyPRFilterChange,
    handleTaskSearchChange,
    handleSetDefaultTaskPreset,
    handleResetGithubTaskSearch,
    handleTaskSearchKeyDown,
    githubTasksBusy
  } = model
  // Why: filter metadata for the primary slug is read from the host that owns the repo it came from.
  const primaryGithubFilterSource = perRepoSourceState.find((state) =>
    activeGithubTaskKind === 'prs' ? state.sources?.prs : state.sources?.issues
  )
  const primaryGithubFilterRepoId = primaryGithubFilterSource?.repoId ?? null
  // Why the host: a twin's two rows share the id, so only the source's row host names one.
  const primaryGithubFilterHostId = primaryGithubFilterSource?.hostId ?? null
  const primaryGithubFilterTarget = useAppStore(
    useShallow((s) =>
      getGitHubRepoRoutingTarget(s, primaryGithubFilterRepoId, null, primaryGithubFilterHostId)
    )
  )
  return (
    // Cove: one flat toolbar row above the list; the hairline is its only seam.
    <div
      className="flex min-w-0 flex-col gap-2 border-b border-border/60 pt-1 pb-2.5"
      data-contextual-tour-target="tasks-search-presets"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label={translate('taskPage.presets', 'Task presets')}
          className="flex max-w-full gap-0.5 overflow-x-auto scrollbar-none rounded-lg bg-foreground/5 p-0.5"
        >
          {getGitHubTaskKindPresets(activeGithubTaskKind).map((option) => {
            const active = activeTaskPreset === option.id
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  const query = option.query
                  setTaskSearchInput(query)
                  setAppliedTaskSearch(query)
                  setActiveTaskPreset(option.id)
                  setTaskResumeState({
                    githubItemsPreset: option.id,
                    githubItemsQuery: query
                  })
                  setTaskRefreshNonce((current) => current + 1)
                }}
                onContextMenu={(event) => {
                  event.preventDefault()
                  handleSetDefaultTaskPreset(option.id)
                }}
                aria-pressed={active}
                className={cn(
                  'flex h-6 items-center whitespace-nowrap rounded-md px-2.5 text-xs transition-[color,background-color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                  active
                    ? 'bg-control-active text-foreground ring-1 ring-border'
                    : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>
        <PRFilterDropdowns
          parsed={appliedTaskQuery}
          kind={activeGithubTaskKind}
          authorLogins={loadedGitHubAuthorLogins}
          primarySlug={primaryGithubFilterSlug}
          ownerTarget={primaryGithubFilterTarget}
          onChange={(change) => applyPRFilterChange(change)}
        />
        <div className="relative min-w-0 flex-1 basis-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={taskSearchInputRef}
            data-github-items-search-input
            value={taskSearchInput}
            onChange={handleTaskSearchChange}
            onKeyDown={handleTaskSearchKeyDown}
            placeholder={
              activeGithubTaskKind === 'prs'
                ? translate('auto.components.TaskPage.eee4df4c66', 'Search GitHub PRs...')
                : translate('auto.components.TaskPage.b15ceb409d', 'Search GitHub issues...')
            }
            className="h-7 rounded-md border-transparent bg-foreground/5 pl-8 pr-8 text-xs text-foreground shadow-none focus-visible:border-ring"
          />
          {taskSearchInput || appliedTaskSearch ? (
            <button
              type="button"
              aria-label={translate('auto.components.TaskPage.b797bdd7c3', 'Clear search')}
              onClick={handleResetGithubTaskSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
        <TaskPageGitHubViewControls />
        <div
          className="flex shrink-0 items-center gap-0.5"
          data-contextual-tour-target="tasks-actions"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  // Why: restore a non-empty draft (accidental dismissal recoverable); empty default guards a stale draft after a repo change.
                  const seed = resolveNewIssueOpenSeed({
                    draft: useAppStore.getState().newIssueDraft,
                    selectedRepoIds: selectedRepos.map((r) => r.id)
                  })
                  setNewIssueTitle(seed.title)
                  setNewIssueBody(seed.body)
                  setNewIssueLabels(seed.labels)
                  setNewIssueAssignees(seed.assignees)
                  setNewIssueRepoId(seed.repoId)
                  setNewIssueOpen(true)
                }}
                disabled={!newIssueTargetRepo}
                aria-label={translate('auto.components.TaskPage.d3d0998b7d', 'New GitHub issue')}
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <Plus className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              {translate('auto.components.TaskPage.d3d0998b7d', 'New GitHub issue')}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleRefreshGithubTasks}
                disabled={githubTasksBusy}
                aria-busy={githubTasksBusy}
                aria-label={
                  githubTasksBusy
                    ? translate('auto.components.TaskPage.6ffa6be99f', 'Refreshing GitHub work')
                    : translate('auto.components.TaskPage.ff53631e6f', 'Refresh GitHub work')
                }
                className="size-7 cursor-pointer text-muted-foreground hover:text-foreground disabled:pointer-events-auto disabled:cursor-wait"
              >
                {githubTasksBusy ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              {githubTasksBusy
                ? translate('auto.components.TaskPage.31f81cc334', 'Refreshing GitHub work…')
                : translate('auto.components.TaskPage.ff53631e6f', 'Refresh GitHub work')}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {(() => {
        // Why: show the source-slug chip only when the selector can't render (no upstream to toggle); otherwise it duplicates the selector.
        const rows = perRepoSourceState.filter(
          (s) => hasUpstreamCandidateDivergence(s) || hasDivergentSources(s)
        )
        if (rows.length === 0) {
          return null
        }
        return (
          <div className="flex flex-wrap items-center gap-2">
            {rows.map((s) => {
              // Why the host: a twin's rows share the id (and maybe the path); each row has its own preference.
              const repo = selectedRepos.find((r) => repoMatchesHostIdentity(r, s.repoId, s.hostId))
              const showRepoBadgeLabel = selectedRepos.length > 1 && repo
              const selectorRenderable = hasUpstreamCandidateDivergence(s)
              // Why: render the indicator standalone — it has its own chip styles, so nesting it in our chip would double-border it.
              if (!selectorRenderable && hasDivergentSources(s)) {
                return (
                  <IssueSourceIndicator
                    key={s.sourceKey}
                    issues={s.sources.issues}
                    prs={s.sources.prs}
                    localRepo={
                      showRepoBadgeLabel && repo
                        ? {
                            displayName: repo.displayName,
                            color: repo.badgeColor
                          }
                        : undefined
                    }
                  />
                )
              }
              if (!selectorRenderable || !repo) {
                return null
              }
              // The selector renders a div; keep a block wrapper to avoid invalid nesting.
              return (
                <div key={s.sourceKey} className={issueSourceChipClass}>
                  {showRepoBadgeLabel ? (
                    <RepoBadgeLabel
                      name={repo.displayName}
                      color={repo.badgeColor}
                      badgeClassName="size-1.5"
                      className="text-[10px] text-muted-foreground"
                    />
                  ) : null}
                  <IssueSourceSelector
                    preference={repo.issueSourcePreference}
                    origin={s.sources.originCandidate}
                    upstream={s.sources.upstreamCandidate}
                    onChange={(next) => {
                      void setIssueSourcePreference(repo.id, repo.path, next, s.hostId)
                    }}
                  />
                </div>
              )
            })}
          </div>
        )
      })()}
    </div>
  )
}

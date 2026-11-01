import type { GitHubWorkItem } from '../../../../../shared/github/work-item-types'
import type { GitHubTaskBoardGroupBy } from './github-task-view-preference'

export type GitHubTaskBoardStatus =
  | 'open'
  | 'draft'
  | 'review'
  | 'changes'
  | 'approved'
  | 'merged'
  | 'closed'

export type GitHubTaskBoardColumn = {
  key: string
  title: string
  /** Set for status columns so the board can tint them; data-driven groups stay neutral. */
  status: GitHubTaskBoardStatus | null
  items: GitHubWorkItem[]
}

type BoardItem = Pick<GitHubWorkItem, 'type' | 'state' | 'reviewDecision'>

const ISSUE_STATUSES: readonly GitHubTaskBoardStatus[] = ['open', 'closed']
const PR_STATUSES: readonly GitHubTaskBoardStatus[] = [
  'draft',
  'review',
  'changes',
  'approved',
  'merged',
  'closed'
]

export function getGitHubTaskBoardStatus(item: BoardItem): GitHubTaskBoardStatus {
  if (item.state === 'closed' || item.state === 'merged' || item.state === 'draft') {
    return item.state
  }
  if (item.type === 'issue') {
    return 'open'
  }
  if (item.reviewDecision === 'APPROVED') {
    return 'approved'
  }
  return item.reviewDecision === 'CHANGES_REQUESTED' ? 'changes' : 'review'
}

function groupByKeys({
  items,
  keysOf,
  emptyKey
}: {
  items: readonly GitHubWorkItem[]
  keysOf: (item: GitHubWorkItem) => readonly string[]
  emptyKey: string
}): Map<string, GitHubWorkItem[]> {
  const groups = new Map<string, GitHubWorkItem[]>()
  for (const item of items) {
    const keys = keysOf(item)
    for (const key of keys.length > 0 ? keys : [emptyKey]) {
      const group = groups.get(key)
      if (group) {
        group.push(item)
      } else {
        groups.set(key, [item])
      }
    }
  }
  return groups
}

// Largest groups first, ties by name; the catch-all group always trails.
function sortDataGroups(
  groups: Map<string, GitHubWorkItem[]>,
  emptyKey: string
): [string, GitHubWorkItem[]][] {
  return [...groups.entries()].sort(([aKey, aItems], [bKey, bItems]) => {
    if (aKey === emptyKey || bKey === emptyKey) {
      return aKey === emptyKey ? 1 : -1
    }
    return bItems.length - aItems.length || aKey.localeCompare(bKey)
  })
}

export function groupGitHubTaskBoardColumns({
  items,
  groupBy,
  kind,
  statusLabels,
  emptyGroupLabel,
  getRepoLabel
}: {
  items: readonly GitHubWorkItem[]
  groupBy: GitHubTaskBoardGroupBy
  kind: 'issues' | 'prs'
  statusLabels: Record<GitHubTaskBoardStatus, string>
  /** Title for items with no assignee or label. */
  emptyGroupLabel: string
  getRepoLabel: (item: GitHubWorkItem) => string
}): GitHubTaskBoardColumn[] {
  if (groupBy === 'status') {
    const statuses = kind === 'prs' ? PR_STATUSES : ISSUE_STATUSES
    return statuses.map((status) => ({
      key: status,
      title: statusLabels[status],
      status,
      items: items.filter((item) => getGitHubTaskBoardStatus(item) === status)
    }))
  }

  // A NUL key cannot collide with a real login, label or repo name.
  const emptyKey = '\u0000'
  const keysOf = (item: GitHubWorkItem): readonly string[] => {
    if (groupBy === 'repo') {
      return [getRepoLabel(item)]
    }
    if (groupBy === 'assignee') {
      return (item.assignees ?? []).map((assignee) => assignee.login)
    }
    return item.labels
  }
  return sortDataGroups(groupByKeys({ items, keysOf, emptyKey }), emptyKey).map(
    ([key, groupItems]) => ({
      key,
      title: key === emptyKey ? emptyGroupLabel : key,
      status: null,
      items: groupItems
    })
  )
}

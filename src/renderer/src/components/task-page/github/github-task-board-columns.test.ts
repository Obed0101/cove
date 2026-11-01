import { describe, expect, it } from 'vitest'
import type { GitHubWorkItem } from '../../../../../shared/github/work-item-types'
import { groupGitHubTaskBoardColumns } from './github-task-board-columns'

function makeItem(overrides: Partial<GitHubWorkItem> & Pick<GitHubWorkItem, 'id'>): GitHubWorkItem {
  return {
    type: 'pr',
    number: 1,
    title: overrides.id,
    state: 'open',
    url: `https://github.com/acme/app/pull/${overrides.id}`,
    labels: [],
    updatedAt: '2026-10-01T00:00:00Z',
    author: 'octocat',
    repoId: 'repo-1',
    ...overrides
  }
}

const statusLabels = {
  open: 'Open',
  draft: 'Draft',
  review: 'Needs review',
  changes: 'Changes requested',
  approved: 'Approved',
  merged: 'Merged',
  closed: 'Closed'
}

function group(
  items: GitHubWorkItem[],
  groupBy: 'status' | 'repo' | 'assignee' | 'label',
  kind: 'issues' | 'prs' = 'prs'
): { title: string; ids: string[] }[] {
  return groupGitHubTaskBoardColumns({
    items,
    groupBy,
    kind,
    statusLabels,
    emptyGroupLabel: 'None',
    getRepoLabel: (item) => item.repoId
  }).map((column) => ({ title: column.title, ids: column.items.map((item) => item.id) }))
}

describe('groupGitHubTaskBoardColumns', () => {
  it('splits open PRs by review decision and keeps empty status lanes visible', () => {
    expect(
      group(
        [
          makeItem({ id: 'a', reviewDecision: 'APPROVED' }),
          makeItem({ id: 'b', reviewDecision: 'CHANGES_REQUESTED' }),
          makeItem({ id: 'c', reviewDecision: null }),
          makeItem({ id: 'd', state: 'draft', reviewDecision: 'APPROVED' }),
          makeItem({ id: 'e', state: 'merged' })
        ],
        'status'
      )
    ).toEqual([
      { title: 'Draft', ids: ['d'] },
      { title: 'Needs review', ids: ['c'] },
      { title: 'Changes requested', ids: ['b'] },
      { title: 'Approved', ids: ['a'] },
      { title: 'Merged', ids: ['e'] },
      { title: 'Closed', ids: [] }
    ])
  })

  it('uses only Open and Closed lanes for issues', () => {
    expect(
      group(
        [
          makeItem({ id: 'a', type: 'issue' }),
          makeItem({ id: 'b', type: 'issue', state: 'closed' })
        ],
        'status',
        'issues'
      )
    ).toEqual([
      { title: 'Open', ids: ['a'] },
      { title: 'Closed', ids: ['b'] }
    ])
  })

  it('repeats multi-assignee items per assignee and trails unassigned work', () => {
    const user = (login: string): { login: string; name: null; avatarUrl: string } => ({
      login,
      name: null,
      avatarUrl: ''
    })
    expect(
      group(
        [
          makeItem({ id: 'a', assignees: [user('zoe'), user('ana')] }),
          makeItem({ id: 'b', assignees: [user('zoe')] }),
          makeItem({ id: 'c' })
        ],
        'assignee'
      )
    ).toEqual([
      { title: 'zoe', ids: ['a', 'b'] },
      { title: 'ana', ids: ['a'] },
      { title: 'None', ids: ['c'] }
    ])
  })
})

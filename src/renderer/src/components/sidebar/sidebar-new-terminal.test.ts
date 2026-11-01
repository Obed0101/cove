import { describe, expect, it } from 'vitest'
import { resolveSidebarTerminalWorktreeId } from './sidebar-new-terminal'
import { makeRepo, makeWorktree } from './worktree-list-lineage-card-test-fixtures'

const linked = makeWorktree({
  id: 'repo-1::/tmp/feature',
  displayName: 'feature',
  branch: 'feature',
  sortOrder: 0,
  instanceId: 'a'
})
const main = {
  ...makeWorktree({
    id: 'repo-1::/tmp/main',
    displayName: 'main',
    branch: 'main',
    sortOrder: 1,
    instanceId: 'b'
  }),
  isMainWorktree: true
}

describe('resolveSidebarTerminalWorktreeId', () => {
  it('opens the terminal in the workspace that is already open', () => {
    expect(
      resolveSidebarTerminalWorktreeId({
        activeWorktreeId: linked.id,
        activeRepoId: null,
        repos: [makeRepo()],
        worktreesByRepo: { 'repo-1': [linked, main] }
      })
    ).toBe(linked.id)
  })

  it("falls back to the project's main checkout instead of creating a worktree", () => {
    expect(
      resolveSidebarTerminalWorktreeId({
        activeWorktreeId: null,
        activeRepoId: null,
        repos: [makeRepo()],
        worktreesByRepo: { 'repo-1': [linked, main] }
      })
    ).toBe(main.id)
  })

  it('reports no target when there is no project yet', () => {
    expect(
      resolveSidebarTerminalWorktreeId({
        activeWorktreeId: null,
        activeRepoId: null,
        repos: [],
        worktreesByRepo: {}
      })
    ).toBeNull()
  })
})

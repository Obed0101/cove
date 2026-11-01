import { useSyncExternalStore } from 'react'

export type GitHubTaskView = 'list' | 'board'
export type GitHubTaskBoardGroupBy = 'status' | 'repo' | 'assignee' | 'label'

export type GitHubTaskViewPreference = {
  view: GitHubTaskView
  groupBy: GitHubTaskBoardGroupBy
}

const DEFAULT_PREFERENCE: GitHubTaskViewPreference = { view: 'list', groupBy: 'status' }
const GROUP_BY_VALUES: readonly GitHubTaskBoardGroupBy[] = ['status', 'repo', 'assignee', 'label']

// Device-local like the Jira view mode; toolbar and content read one shared snapshot.
const STORAGE_KEY = 'cove.github-tasks.view.v1'

function isGroupBy(value: unknown): value is GitHubTaskBoardGroupBy {
  return GROUP_BY_VALUES.some((groupBy) => groupBy === value)
}

function loadPreference(): GitHubTaskViewPreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return DEFAULT_PREFERENCE
    }
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      return DEFAULT_PREFERENCE
    }
    const view = 'view' in parsed && parsed.view === 'board' ? 'board' : 'list'
    const groupBy =
      'groupBy' in parsed && isGroupBy(parsed.groupBy) ? parsed.groupBy : DEFAULT_PREFERENCE.groupBy
    return { view, groupBy }
  } catch {
    return DEFAULT_PREFERENCE
  }
}

function savePreference(preference: GitHubTaskViewPreference): void {
  try {
    // Only non-defaults are stored so a future default change is not pinned by old devices.
    if (
      preference.view === DEFAULT_PREFERENCE.view &&
      preference.groupBy === DEFAULT_PREFERENCE.groupBy
    ) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preference))
    }
  } catch {
    // The live view stays usable when browser storage is unavailable or full.
  }
}

let currentPreference: GitHubTaskViewPreference | null = null
const listeners = new Set<() => void>()

function getPreference(): GitHubTaskViewPreference {
  currentPreference ??= loadPreference()
  return currentPreference
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function updateGitHubTaskViewPreference(patch: Partial<GitHubTaskViewPreference>): void {
  currentPreference = { ...getPreference(), ...patch }
  savePreference(currentPreference)
  for (const listener of listeners) {
    listener()
  }
}

export function useGitHubTaskViewPreference(): GitHubTaskViewPreference {
  return useSyncExternalStore(subscribe, getPreference, getPreference)
}

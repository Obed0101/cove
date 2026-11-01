import { useEffect, useSyncExternalStore } from 'react'
import type {
  CoveConfig,
  CoveConfigEdit,
  CoveConfigEditResult,
  CoveConfigSnapshot
} from '../../../shared/cove-config/cove-config-schema'
import { useAppStore } from '@/store'
import { isPairedWebClientWindow } from './desktop-window-chrome'
import { applyCoveConfig } from './cove-config-apply'
import { coveConfigDesktopOnlyMessage } from './cove-config-desktop-only'

const EMPTY_SNAPSHOT: CoveConfigSnapshot = { path: '', exists: false, config: {}, issues: [] }

let currentSnapshot = EMPTY_SNAPSHOT
// Module scope so a remount (e.g. HMR) does not re-apply sections the user has since changed in-app.
let lastAppliedConfig: CoveConfig | null = null
const listeners = new Set<() => void>()

function publishCoveConfigSnapshot(snapshot: CoveConfigSnapshot): void {
  currentSnapshot = snapshot
  for (const listener of listeners) {
    listener()
  }
}

function subscribeCoveConfig(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getCoveConfigSnapshot(): CoveConfigSnapshot {
  return currentSnapshot
}

export function useCoveConfigSnapshot(): CoveConfigSnapshot {
  return useSyncExternalStore(subscribeCoveConfig, getCoveConfigSnapshot)
}

export function isCoveConfigAvailable(): boolean {
  // The file lives on this desktop; paired web clients render the host's state instead.
  return !isPairedWebClientWindow() && window.api?.coveConfig !== undefined
}

export async function editCoveConfig(edits: CoveConfigEdit[]): Promise<CoveConfigEditResult> {
  if (!isCoveConfigAvailable()) {
    return { ok: false, issues: [{ path: '', message: coveConfigDesktopOnlyMessage() }] }
  }
  return window.api.coveConfig.edit(edits)
}

export function openCoveConfigFile(): Promise<string> {
  return isCoveConfigAvailable()
    ? window.api.coveConfig.open()
    : Promise.resolve(coveConfigDesktopOnlyMessage())
}

/** Keeps the snapshot current and applies the file once settings and persisted UI have hydrated. */
export function useCoveConfigSync(): void {
  const ready = useAppStore((s) => s.persistedUIReady && s.settings !== null)

  useEffect(() => {
    if (!isCoveConfigAvailable()) {
      return
    }
    let disposed = false
    const unsubscribe = window.api.coveConfig.onChanged(publishCoveConfigSnapshot)
    void window.api.coveConfig.get().then((snapshot) => {
      if (!disposed) {
        publishCoveConfigSnapshot(snapshot)
      }
    })
    return () => {
      disposed = true
      unsubscribe()
    }
  }, [])

  const snapshot = useCoveConfigSnapshot()
  useEffect(() => {
    if (!ready || snapshot === EMPTY_SNAPSHOT) {
      return
    }
    const state = useAppStore.getState()
    if (state.settings === null) {
      return
    }
    applyCoveConfig(
      {
        settings: state.settings,
        statusBarItems: state.statusBarItems,
        updateSettings: state.updateSettings,
        setSidebarOpen: state.setSidebarOpen,
        setRightSidebarOpen: state.setRightSidebarOpen,
        toggleStatusBarItem: state.toggleStatusBarItem
      },
      lastAppliedConfig,
      snapshot.config
    )
    lastAppliedConfig = snapshot.config
  }, [ready, snapshot])
}

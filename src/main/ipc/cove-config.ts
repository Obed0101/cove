import { ipcMain, shell } from 'electron'
import { unwatchFile, watchFile } from 'node:fs'
import { z } from 'zod'
import type {
  CoveConfig,
  CoveConfigEditResult,
  CoveConfigSnapshot
} from '../../shared/cove-config/cove-config-schema'
import {
  editCoveConfigFile,
  ensureCoveConfigFile,
  readCoveConfigFile,
  resolveCoveConfigLocation
} from '../cove-config/cove-config-file'
import { isTrustedUIRenderer, sendToTrustedUIRenderer } from './ui'

// Polling stat keeps working when the folder does not exist yet and survives atomic-rename saves.
const WATCH_INTERVAL_MS = 500

const CoveConfigEdits = z
  .array(
    z
      .object({
        path: z.array(z.union([z.string().min(1), z.number().int().nonnegative()])).min(1),
        value: z.unknown()
      })
      .strict()
  )
  .min(1)
  .max(64)

const location = resolveCoveConfigLocation()
let lastValidConfig: CoveConfig = {}
let snapshot: CoveConfigSnapshot = { path: location.file, exists: false, config: {}, issues: [] }
let lastSnapshotJson = JSON.stringify(snapshot)

async function refreshCoveConfigSnapshot(): Promise<CoveConfigSnapshot> {
  try {
    const read = await readCoveConfigFile(location)
    if (read.ok) {
      lastValidConfig = read.config
    }
    snapshot = {
      path: location.file,
      exists: read.exists,
      config: lastValidConfig,
      issues: read.ok ? [] : read.issues
    }
  } catch (error) {
    snapshot = {
      path: location.file,
      exists: true,
      config: lastValidConfig,
      issues: [{ path: '', message: error instanceof Error ? error.message : String(error) }]
    }
  }
  const snapshotJson = JSON.stringify(snapshot)
  if (snapshotJson !== lastSnapshotJson) {
    lastSnapshotJson = snapshotJson
    sendToTrustedUIRenderer('coveConfig:changed', snapshot)
  }
  return snapshot
}

let watching = false

function startWatchingCoveConfig(): void {
  if (watching) {
    return
  }
  watching = true
  watchFile(location.file, { interval: WATCH_INTERVAL_MS, persistent: false }, () => {
    void refreshCoveConfigSnapshot()
  })
}

export function stopWatchingCoveConfig(): void {
  if (watching) {
    unwatchFile(location.file)
    watching = false
  }
}

export function registerCoveConfigHandlers(): void {
  startWatchingCoveConfig()

  ipcMain.removeHandler('coveConfig:get')
  ipcMain.handle('coveConfig:get', () => refreshCoveConfigSnapshot())

  ipcMain.removeHandler('coveConfig:edit')
  ipcMain.handle(
    'coveConfig:edit',
    async (event, rawEdits: unknown): Promise<CoveConfigEditResult> => {
      if (!isTrustedUIRenderer(event.sender)) {
        throw new Error('[COVE_CONFIG]: Untrusted renderer')
      }
      const edits = CoveConfigEdits.parse(rawEdits)
      const result = await editCoveConfigFile(location, edits)
      await refreshCoveConfigSnapshot()
      return result
    }
  )

  ipcMain.removeHandler('coveConfig:open')
  ipcMain.handle('coveConfig:open', async (event): Promise<string> => {
    if (!isTrustedUIRenderer(event.sender)) {
      throw new Error('[COVE_CONFIG]: Untrusted renderer')
    }
    await ensureCoveConfigFile(location)
    await refreshCoveConfigSnapshot()
    // Empty string means the OS opened the file in the user's default editor.
    return shell.openPath(location.file)
  })
}

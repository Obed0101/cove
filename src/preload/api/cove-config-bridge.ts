import { ipcRenderer } from 'electron'
import type {
  CoveConfigEdit,
  CoveConfigEditResult,
  CoveConfigSnapshot
} from '../../shared/cove-config/cove-config-schema'
import type { PreloadApi } from '../api-types'

export const coveConfigApi = {
  get: (): Promise<CoveConfigSnapshot> => ipcRenderer.invoke('coveConfig:get'),
  edit: (edits: CoveConfigEdit[]): Promise<CoveConfigEditResult> =>
    ipcRenderer.invoke('coveConfig:edit', edits),
  open: (): Promise<string> => ipcRenderer.invoke('coveConfig:open'),
  onChanged: (callback: (snapshot: CoveConfigSnapshot) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, snapshot: CoveConfigSnapshot): void =>
      callback(snapshot)
    ipcRenderer.on('coveConfig:changed', listener)
    return () => ipcRenderer.removeListener('coveConfig:changed', listener)
  }
} satisfies PreloadApi['coveConfig']

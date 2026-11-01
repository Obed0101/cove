import type {
  CoveConfigEdit,
  CoveConfigEditResult,
  CoveConfigSnapshot
} from '../../shared/cove-config/cove-config-schema'

export type CoveConfigApi = {
  get: () => Promise<CoveConfigSnapshot>
  edit: (edits: CoveConfigEdit[]) => Promise<CoveConfigEditResult>
  /** Resolves to an OS error message, or an empty string once the editor opened the file. */
  open: () => Promise<string>
  onChanged: (callback: (snapshot: CoveConfigSnapshot) => void) => () => void
}

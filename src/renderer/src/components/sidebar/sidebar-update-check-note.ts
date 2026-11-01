import { translate } from '@/i18n/i18n'
import type { UpdateStatus } from '../../../../shared/update-status-types'

export const UPDATE_CHECK_NOTE_MS = 6000

export type UpdateCheckNote = { text: string; tone: 'info' | 'error' }

/** Result line for a check the user started from the sidebar; null while the outcome is still unknown. */
export function updateCheckNote(status: UpdateStatus): UpdateCheckNote | null {
  switch (status.state) {
    case 'not-available':
      return {
        text: translate('sidebar.updateCheck.upToDate', 'You’re on the latest version.'),
        tone: 'info'
      }
    case 'available':
    case 'downloading':
    case 'downloaded':
      return {
        text: translate('sidebar.updateCheck.available', 'Version {{version}} is available.', {
          version: status.version
        }),
        tone: 'info'
      }
    case 'error':
      return {
        text: translate('sidebar.updateCheck.failed', 'Couldn’t check for updates.'),
        tone: 'error'
      }
    default:
      return null
  }
}

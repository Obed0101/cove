import { Copy, FileCog } from 'lucide-react'
import { toast } from 'sonner'
import { translate } from '@/i18n/i18n'
import {
  getCoveConfigSnapshot,
  isCoveConfigAvailable,
  openCoveConfigFile
} from '@/lib/cove-config-sync'
import type { CmdJQuickAction } from './quick-actions'
import type { CmdJQuickActionAvailability } from './quick-action-context'

// The file lives on this desktop; paired web clients have nothing local to open or copy.
function availability(): CmdJQuickActionAvailability {
  return isCoveConfigAvailable()
    ? { available: true }
    : { available: false, reason: 'client-action-unsupported' }
}

async function coveConfigPath(): Promise<string> {
  return getCoveConfigSnapshot().path || (await window.api.coveConfig.get()).path
}

export function getCoveConfigQuickActions(): CmdJQuickAction[] {
  return [
    {
      id: 'open-cove-config',
      kind: 'action',
      title: translate('cmdJ.coveConfig.open', 'Open Cove Config File'),
      description: translate(
        'cmdJ.coveConfig.openDescription',
        'Edit ~/.cove/config.json in your default editor. Changes apply live.'
      ),
      icon: FileCog,
      verbKeywords: [
        translate('cmdJ.coveConfig.verbs.openConfig', 'open config'),
        translate('cmdJ.coveConfig.verbs.editConfig', 'edit config'),
        translate('cmdJ.coveConfig.verbs.coveConfig', 'cove config')
      ],
      isAvailable: availability,
      run: async () => {
        if (!availability().available) {
          return { status: 'unavailable', reason: 'client-action-unsupported' }
        }
        const error = await openCoveConfigFile()
        if (error) {
          toast.error(
            translate(
              'settings.appearance.coveConfig.openFailed',
              'Could not open the config file'
            ),
            { description: error }
          )
        }
        return { status: 'ok' }
      }
    },
    {
      id: 'copy-cove-config-path',
      kind: 'action',
      title: translate('cmdJ.coveConfig.copyPath', 'Copy Cove Config Path'),
      description: translate(
        'cmdJ.coveConfig.copyPathDescription',
        'Copy the full path of ~/.cove/config.json.'
      ),
      icon: Copy,
      verbKeywords: [
        translate('cmdJ.coveConfig.verbs.copyConfigPath', 'copy config path'),
        translate('cmdJ.coveConfig.verbs.configPath', 'config path')
      ],
      isAvailable: availability,
      run: async () => {
        if (!availability().available) {
          return { status: 'unavailable', reason: 'client-action-unsupported' }
        }
        await window.api.ui.writeClipboardText(await coveConfigPath())
        toast.success(translate('cmdJ.coveConfig.pathCopied', 'Config path copied'))
        return { status: 'ok' }
      }
    }
  ]
}

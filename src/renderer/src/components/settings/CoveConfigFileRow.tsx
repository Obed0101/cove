import type React from 'react'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { SettingsRow } from './SettingsFormControls'
import { translate } from '@/i18n/i18n'
import { openCoveConfigFile, useCoveConfigSnapshot } from '@/lib/cove-config-sync'
import type { CoveConfigSnapshot } from '../../../../shared/cove-config/cove-config-schema'

function CoveConfigFileStatus({ snapshot }: { snapshot: CoveConfigSnapshot }): React.JSX.Element {
  if (snapshot.issues.length > 0) {
    return (
      <span className="block space-y-0.5 text-destructive">
        {snapshot.issues.map((issue, index) => (
          <span key={`${issue.path}:${index}`} className="block">
            {issue.line === undefined ? null : (
              <span className="font-mono">
                {translate('settings.appearance.coveConfig.line', 'Line {{line}}', {
                  line: issue.line
                })}{' '}
              </span>
            )}
            {issue.path ? <span className="font-mono">{issue.path}: </span> : null}
            {issue.message}
          </span>
        ))}
      </span>
    )
  }
  return (
    <span className="block">
      {snapshot.exists
        ? translate('settings.appearance.coveConfig.valid', 'Valid. Changes apply live.')
        : translate(
            'settings.appearance.coveConfig.missing',
            'Not created yet. Opening it creates the file with its schema for editor autocomplete.'
          )}
    </span>
  )
}

export function CoveConfigFileRow(): React.JSX.Element {
  const snapshot = useCoveConfigSnapshot()

  const openFile = (): void => {
    void openCoveConfigFile().then((error) => {
      if (error) {
        toast.error(
          translate('settings.appearance.coveConfig.openFailed', 'Could not open the config file'),
          { description: error }
        )
      }
    })
  }

  return (
    <SettingsRow
      alignTop
      label={translate('settings.appearance.coveConfig.title', 'Configuration File')}
      description={
        <span className="block space-y-1">
          <span className="block">
            {translate(
              'settings.appearance.coveConfig.description',
              'Configure the footer, sidebar and appearance from ~/.cove/config.json. Changes apply live.'
            )}
          </span>
          {snapshot.path ? (
            <span className="block truncate font-mono text-foreground/80" title={snapshot.path}>
              {snapshot.path}
            </span>
          ) : null}
          <CoveConfigFileStatus snapshot={snapshot} />
        </span>
      }
      control={
        <Button variant="outline" size="xs" onClick={openFile}>
          {translate('settings.appearance.coveConfig.open', 'Open')}
        </Button>
      }
    />
  )
}

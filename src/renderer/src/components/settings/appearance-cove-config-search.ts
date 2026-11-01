import { translate } from '@/i18n/i18n'
import { createLocalizedCatalog } from '@/i18n/localized-catalog'
import type { SettingsSearchEntry } from './settings-search'
import { translateSearchKeyword } from './settings-search-keywords'

export const getCoveConfigFileEntries = createLocalizedCatalog((): SettingsSearchEntry[] => [
  {
    title: translate('settings.appearance.coveConfig.title', 'Configuration File'),
    description: translate(
      'settings.appearance.coveConfig.description',
      'Configure the footer, sidebar and appearance from ~/.cove/config.json. Changes apply live.'
    ),
    keywords: [
      ...translateSearchKeyword('settings.appearance.coveConfig.keyword.config', 'config'),
      ...translateSearchKeyword('settings.appearance.coveConfig.keyword.file', 'file'),
      ...translateSearchKeyword('settings.appearance.coveConfig.keyword.json', 'json', {
        englishOnly: true
      }),
      ...translateSearchKeyword('settings.appearance.coveConfig.keyword.cove', 'cove', {
        englishOnly: true
      })
    ]
  }
])

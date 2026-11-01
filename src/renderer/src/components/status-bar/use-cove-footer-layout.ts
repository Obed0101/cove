import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { translate } from '@/i18n/i18n'
import type {
  CoveConfigEdit,
  CoveFooterAlign,
  CoveFooterWidgetId
} from '../../../../shared/cove-config/cove-config-schema'
import {
  isCoveFooterDeclared,
  resolveCoveFooterLayout,
  toCoveFooterWidgetEntries,
  withCoveFooterWidgetAlign,
  withCoveFooterWidgetVisible,
  type CoveFooterSlot
} from '../../../../shared/cove-config/cove-footer-layout'
import type { StatusBarItem } from '../../../../shared/ui-chrome-types'
import { editCoveConfig, useCoveConfigSnapshot } from '@/lib/cove-config-sync'

export type CoveFooterLayout = {
  /** Widgets in display order, as the menu lists them. */
  layout: CoveFooterSlot[]
  /** Widgets whose feature is available here, i.e. what the bar renders. */
  rendered: CoveFooterSlot[]
  declared: boolean
  isWidgetVisible: (id: CoveFooterWidgetId) => boolean
  setWidgetVisible: (id: CoveFooterWidgetId, visible: boolean, inApp: () => void) => void
  setWidgetAlign: (id: CoveFooterWidgetId, align: CoveFooterAlign) => void
  toggleUsageProvider: (provider: StatusBarItem, inApp: () => void) => void
}

function writeFooterEdits(edits: CoveConfigEdit[]): void {
  void editCoveConfig(edits).then((result) => {
    if (!result.ok) {
      toast.error(
        translate('statusBar.footerConfigWriteFailed', 'Could not update the Cove config file'),
        { description: result.issues[0]?.message }
      )
    }
  })
}

/**
 * Footer order and alignment. Once `footer.widgets` exists in ~/.cove/config.json the file owns them and
 * menu changes write back to it; before that, in-app toggles apply and choosing a position declares the file.
 */
export function useCoveFooterLayout({
  inAppVisible,
  available
}: {
  inAppVisible: Readonly<Record<CoveFooterWidgetId, boolean>>
  available: Readonly<Partial<Record<CoveFooterWidgetId, boolean>>>
}): CoveFooterLayout {
  const { config } = useCoveConfigSnapshot()
  const declared = isCoveFooterDeclared(config)
  const declaredUsage = config.footer?.usage
  const layout = useMemo(
    () => resolveCoveFooterLayout(config, (id) => inAppVisible[id]),
    [config, inAppVisible]
  )
  const rendered = useMemo(
    () => layout.filter((slot) => available[slot.id] !== false),
    [layout, available]
  )

  const isWidgetVisible = useCallback(
    (id: CoveFooterWidgetId) => layout.some((slot) => slot.id === id),
    [layout]
  )
  const setWidgetVisible = useCallback(
    (id: CoveFooterWidgetId, visible: boolean, inApp: () => void) => {
      if (!declared) {
        inApp()
        return
      }
      writeFooterEdits([
        {
          path: ['footer', 'widgets'],
          value: toCoveFooterWidgetEntries(withCoveFooterWidgetVisible(layout, id, visible))
        }
      ])
    },
    [declared, layout]
  )
  const setWidgetAlign = useCallback(
    (id: CoveFooterWidgetId, align: CoveFooterAlign) => {
      writeFooterEdits([
        {
          path: ['footer', 'widgets'],
          value: toCoveFooterWidgetEntries(withCoveFooterWidgetAlign(layout, id, align))
        }
      ])
    },
    [layout]
  )
  const toggleUsageProvider = useCallback(
    (provider: StatusBarItem, inApp: () => void) => {
      if (!declaredUsage) {
        inApp()
        return
      }
      const next = declaredUsage.some((id) => id === provider)
        ? declaredUsage.filter((id) => id !== provider)
        : [...declaredUsage, provider]
      writeFooterEdits([{ path: ['footer', 'usage'], value: next }])
    },
    [declaredUsage]
  )

  return {
    layout,
    rendered,
    declared,
    isWidgetVisible,
    setWidgetVisible,
    setWidgetAlign,
    toggleUsageProvider
  }
}

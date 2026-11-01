import type { GlobalSettings } from '../../../shared/global-settings-types'
import type { StatusBarItem } from '../../../shared/ui-chrome-types'
import {
  COVE_SIDEBAR_ITEM_IDS,
  COVE_USAGE_PROVIDER_IDS,
  type CoveConfig,
  type CoveFooterWidgetId,
  type CoveSidebarItemId
} from '../../../shared/cove-config/cove-config-schema'

export type CoveConfigTarget = {
  settings: GlobalSettings
  statusBarItems: readonly StatusBarItem[]
  updateSettings: (updates: Partial<GlobalSettings>) => Promise<void>
  setSidebarOpen: (open: boolean) => void
  setRightSidebarOpen: (open: boolean) => void
  toggleStatusBarItem: (item: StatusBarItem) => void
}

const SIDEBAR_ITEM_SETTINGS = {
  tasks: 'showTasksButton',
  automations: 'showAutomationsButton',
  artifacts: 'showArtifactsButton',
  skills: 'showSkillsButton',
  mobile: 'showMobileButton'
} as const satisfies Record<CoveSidebarItemId, keyof GlobalSettings>

const FOOTER_WIDGET_STATUS_ITEMS = {
  hosts: 'ssh',
  ports: 'ports',
  resources: 'resource-usage'
} as const satisfies Partial<Record<CoveFooterWidgetId, StatusBarItem>>

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function sameKind(left: unknown, right: unknown): boolean {
  if (left === null || right === null) {
    return left === right
  }
  return typeof left === typeof right && Array.isArray(left) === Array.isArray(right)
}

/** `settings` passthrough keeps only keys the app knows, with the type the app already uses. */
export function pickKnownSettings(
  current: GlobalSettings,
  declared: Readonly<Record<string, unknown>>
): Partial<GlobalSettings> {
  const updates: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(declared)) {
    if (!Object.hasOwn(current, key)) {
      continue
    }
    const existing: unknown = Reflect.get(current, key)
    if (sameKind(existing, value) && !sameValue(existing, value)) {
      updates[key] = value
    }
  }
  return updates
}

function declaredSettingsUpdates(
  current: GlobalSettings,
  config: CoveConfig
): Partial<GlobalSettings> {
  const updates: Partial<GlobalSettings> = {}
  const { appearance, sidebar } = config
  if (appearance?.theme !== undefined) {
    updates.theme = appearance.theme
  }
  if (appearance?.material !== undefined) {
    updates.windowMaterial = appearance.material
  }
  if (appearance?.font !== undefined) {
    updates.appFontFamily = appearance.font
  }
  if (sidebar?.appName !== undefined) {
    updates.showTitlebarAppName = sidebar.appName
  }
  for (const item of COVE_SIDEBAR_ITEM_IDS) {
    const visible = sidebar?.items?.[item]
    if (visible !== undefined) {
      updates[SIDEBAR_ITEM_SETTINGS[item]] = visible
    }
  }
  const filtered: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(updates)) {
    if (!sameValue(Reflect.get(current, key), value)) {
      filtered[key] = value
    }
  }
  return { ...filtered, ...pickKnownSettings(current, config.settings ?? {}) }
}

/** Status bar items the file pins down; providers and hosts/ports/resources it leaves out stay as the app has them. */
export function declaredStatusBarItems(
  current: readonly StatusBarItem[],
  config: CoveConfig
): StatusBarItem[] {
  const wanted = new Map<StatusBarItem, boolean>()
  const widgets = config.footer?.widgets
  if (widgets) {
    for (const [widget, item] of Object.entries(FOOTER_WIDGET_STATUS_ITEMS)) {
      wanted.set(
        item,
        widgets.some((entry) => entry.id === widget)
      )
    }
  }
  const usage = config.footer?.usage
  if (usage) {
    for (const provider of COVE_USAGE_PROVIDER_IDS) {
      wanted.set(provider, usage.includes(provider))
    }
  }
  const next = current.filter((item) => wanted.get(item) !== false)
  for (const [item, visible] of wanted) {
    if (visible && !next.includes(item)) {
      next.push(item)
    }
  }
  return next
}

function changed<T>(
  previous: CoveConfig | null,
  next: CoveConfig,
  pick: (config: CoveConfig) => T
): boolean {
  const value = pick(next)
  return value !== undefined && (previous === null || !sameValue(pick(previous), value))
}

/**
 * Applies what the file declares. The first pass (no previous config) applies everything; later passes
 * apply only sections that changed, so in-app tweaks survive until the file touches that section again.
 */
export function applyCoveConfig(
  target: CoveConfigTarget,
  previous: CoveConfig | null,
  next: CoveConfig
): void {
  const settingsSections: CoveConfig = {
    appearance: changed(previous, next, (c) => c.appearance) ? next.appearance : undefined,
    sidebar: {
      appName: changed(previous, next, (c) => c.sidebar?.appName)
        ? next.sidebar?.appName
        : undefined,
      items: changed(previous, next, (c) => c.sidebar?.items) ? next.sidebar?.items : undefined
    },
    settings: changed(previous, next, (c) => c.settings) ? next.settings : undefined
  }
  const updates = declaredSettingsUpdates(target.settings, settingsSections)
  if (Object.keys(updates).length > 0) {
    void target.updateSettings(updates)
  }

  const sidebarOpen = next.sidebar?.open
  if (sidebarOpen !== undefined && changed(previous, next, (c) => c.sidebar?.open)) {
    target.setSidebarOpen(sidebarOpen)
  }
  const explorerOpen = next.explorer?.open
  if (explorerOpen !== undefined && changed(previous, next, (c) => c.explorer?.open)) {
    target.setRightSidebarOpen(explorerOpen)
  }

  if (
    changed(previous, next, (c) => c.footer?.widgets) ||
    changed(previous, next, (c) => c.footer?.usage)
  ) {
    const wanted = declaredStatusBarItems(target.statusBarItems, next)
    const toggles = [
      ...target.statusBarItems.filter((item) => !wanted.includes(item)),
      ...wanted.filter((item) => !target.statusBarItems.includes(item))
    ]
    for (const item of toggles) {
      target.toggleStatusBarItem(item)
    }
  }
}

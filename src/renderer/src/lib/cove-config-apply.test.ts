import { describe, expect, it, vi } from 'vitest'
import { getDefaultSettings } from '../../../shared/constants'
import type { StatusBarItem } from '../../../shared/ui-chrome-types'
import type { CoveConfig } from '../../../shared/cove-config/cove-config-schema'
import { applyCoveConfig, declaredStatusBarItems, pickKnownSettings } from './cove-config-apply'

function createTarget(statusBarItems: StatusBarItem[] = []) {
  return {
    settings: getDefaultSettings('/home/test'),
    statusBarItems,
    updateSettings: vi.fn(() => Promise.resolve()),
    setSidebarOpen: vi.fn(),
    setRightSidebarOpen: vi.fn(),
    toggleStatusBarItem: vi.fn()
  }
}

describe('pickKnownSettings', () => {
  it('ignores unknown keys and values whose type differs from the setting', () => {
    const updates = pickKnownSettings(getDefaultSettings('/home/test'), {
      terminalFontSize: 13,
      showTasksButton: 'no',
      notASetting: true
    })
    expect(updates).toEqual({ terminalFontSize: 13 })
  })
})

describe('applyCoveConfig', () => {
  it('applies every declared section on the first pass', () => {
    const target = createTarget()
    applyCoveConfig(target, null, {
      appearance: { theme: 'dark' },
      sidebar: { open: false, items: { tasks: false } }
    })
    expect(target.updateSettings).toHaveBeenCalledWith({ theme: 'dark', showTasksButton: false })
    expect(target.setSidebarOpen).toHaveBeenCalledWith(false)
  })

  it('leaves unchanged sections alone so in-app choices survive', () => {
    const target = createTarget()
    const previous: CoveConfig = { sidebar: { open: false }, appearance: { theme: 'dark' } }
    applyCoveConfig(target, previous, { ...previous, explorer: { open: true } })
    expect(target.setSidebarOpen).not.toHaveBeenCalled()
    expect(target.updateSettings).not.toHaveBeenCalled()
    expect(target.setRightSidebarOpen).toHaveBeenCalledWith(true)
  })

  it('toggles only the status bar items the footer section changes', () => {
    const target = createTarget(['ssh', 'claude'])
    applyCoveConfig(target, null, { footer: { widgets: [{ id: 'ports' }] } })
    expect(target.toggleStatusBarItem.mock.calls.map(([item]) => item).sort()).toEqual([
      'ports',
      'ssh'
    ])
  })
})

describe('declaredStatusBarItems', () => {
  it('keeps providers the file does not mention', () => {
    expect(declaredStatusBarItems(['claude', 'codex'], { footer: { usage: ['codex'] } })).toEqual([
      'codex'
    ])
    expect(declaredStatusBarItems(['claude'], { footer: { widgets: [] } })).toEqual(['claude'])
  })
})

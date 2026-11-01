import { afterEach, describe, expect, it, vi } from 'vitest'
import { getCoveConfigQuickActions } from './cove-config-quick-actions'

const sync = vi.hoisted(() => ({
  available: true,
  openResult: '',
  path: '/Users/me/.cove/config.json'
}))
const toastError = vi.hoisted(() => vi.fn())

vi.mock('@/lib/cove-config-sync', () => ({
  isCoveConfigAvailable: () => sync.available,
  openCoveConfigFile: () => Promise.resolve(sync.openResult),
  getCoveConfigSnapshot: () => ({ path: sync.path, exists: true, config: {}, issues: [] })
}))
vi.mock('sonner', () => ({ toast: { error: toastError, success: vi.fn() } }))

// SAFETY: these actions read no palette context; the shape is irrelevant to them.
const ctx = {} as never

function action(id: string) {
  const found = getCoveConfigQuickActions().find((candidate) => candidate.id === id)
  if (!found) {
    throw new Error(`missing action ${id}`)
  }
  return found
}

afterEach(() => {
  sync.available = true
  sync.openResult = ''
  toastError.mockClear()
  vi.unstubAllGlobals()
})

describe('Cove config quick actions', () => {
  it('offers both actions on desktop and hides them on paired web clients', () => {
    const ids = ['open-cove-config', 'copy-cove-config-path']
    expect(ids.map((id) => action(id).isAvailable(ctx).available)).toEqual([true, true])
    sync.available = false
    expect(ids.map((id) => action(id).isAvailable(ctx))).toEqual([
      { available: false, reason: 'client-action-unsupported' },
      { available: false, reason: 'client-action-unsupported' }
    ])
  })

  it('surfaces an editor launch failure instead of failing silently', async () => {
    sync.openResult = 'No application knows how to open .json'
    await expect(action('open-cove-config').run(ctx)).resolves.toEqual({ status: 'ok' })
    expect(toastError).toHaveBeenCalledWith(expect.any(String), {
      description: 'No application knows how to open .json'
    })
  })

  it('copies the resolved config path', async () => {
    const writeClipboardText = vi.fn(() => Promise.resolve())
    vi.stubGlobal('window', { api: { ui: { writeClipboardText } } })
    await action('copy-cove-config-path').run(ctx)
    expect(writeClipboardText).toHaveBeenCalledWith('/Users/me/.cove/config.json')
  })
})

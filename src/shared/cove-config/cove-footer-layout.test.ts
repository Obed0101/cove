import { describe, expect, it } from 'vitest'
import {
  resolveCoveFooterLayout,
  toCoveFooterWidgetEntries,
  withCoveFooterWidgetVisible,
  type CoveFooterSlot
} from './cove-footer-layout'

describe('cove footer layout', () => {
  it('uses the declared list verbatim, defaulting align to start', () => {
    const layout = resolveCoveFooterLayout(
      { footer: { widgets: [{ id: 'clock', align: 'end' }, { id: 'hosts' }] } },
      () => true
    )
    expect(layout).toEqual([
      { id: 'clock', align: 'end' },
      { id: 'hosts', align: 'start' }
    ])
  })

  it('re-shows a widget in its default place among left-aligned widgets', () => {
    const layout: CoveFooterSlot[] = [
      { id: 'resources', align: 'start' },
      { id: 'hosts', align: 'start' },
      { id: 'clock', align: 'end' }
    ]
    const next = withCoveFooterWidgetVisible(layout, 'ports', true)
    expect(next.map((slot) => slot.id)).toEqual(['resources', 'ports', 'hosts', 'clock'])
  })

  it('writes start-aligned entries without an align key', () => {
    expect(
      toCoveFooterWidgetEntries([
        { id: 'hosts', align: 'start' },
        { id: 'clock', align: 'center' }
      ])
    ).toEqual([{ id: 'hosts' }, { id: 'clock', align: 'center' }])
  })
})

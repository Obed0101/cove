import { describe, expect, it } from 'vitest'
import { updateCheckNote } from './sidebar-update-check-note'

describe('updateCheckNote', () => {
  it('reports each finished outcome with its tone', () => {
    expect(updateCheckNote({ state: 'not-available', userInitiated: true })).toEqual({
      text: 'You’re on the latest version.',
      tone: 'info'
    })
    expect(updateCheckNote({ state: 'downloading', percent: 12, version: '1.4.0' })?.text).toBe(
      'Version 1.4.0 is available.'
    )
    expect(updateCheckNote({ state: 'error', message: 'offline' })?.tone).toBe('error')
  })

  it('stays silent while the outcome is unknown', () => {
    expect(updateCheckNote({ state: 'idle' })).toBeNull()
    expect(updateCheckNote({ state: 'checking', userInitiated: true })).toBeNull()
  })
})

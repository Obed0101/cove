import { describe, expect, it } from 'vitest'
import {
  parseCoveConfigCliValue,
  parseCoveConfigPath,
  parseCoveConfigText,
  writeCoveConfigValue
} from './cove-config-document'

describe('parseCoveConfigText', () => {
  it('accepts comments and trailing commas', () => {
    const result = parseCoveConfigText('{\n  // left rail\n  "sidebar": { "open": false, },\n}\n')
    expect(result).toEqual({ ok: true, config: { sidebar: { open: false } } })
  })

  it('reports schema issues on the line of the offending value', () => {
    const result = parseCoveConfigText(
      '{\n  "footer": {\n    "widgets": [{ "id": "nope" }]\n  }\n}\n'
    )
    expect(result.ok).toBe(false)
    expect(!result.ok && result.issues[0]).toMatchObject({ path: 'footer.widgets.0.id', line: 3 })
  })

  it('rejects a widget listed twice', () => {
    const result = parseCoveConfigText('{"footer":{"widgets":[{"id":"clock"},{"id":"clock"}]}}')
    expect(result.ok).toBe(false)
  })

  it('bounds the focus session length', () => {
    expect(parseCoveConfigText('{"footer":{"focus":{"minutes":45}}}').ok).toBe(true)
    expect(parseCoveConfigText('{"footer":{"focus":{"minutes":0}}}').ok).toBe(false)
    expect(parseCoveConfigText('{"footer":{"focus":{"minutes":500}}}').ok).toBe(false)
  })

  it('accepts IANA clock time zones and flags unknown ones at their index', () => {
    expect(
      parseCoveConfigText('{"footer":{"clock":{"timeZones":["America/Panama","Europe/Madrid"]}}}')
        .ok
    ).toBe(true)
    const result = parseCoveConfigText('{"footer":{"clock":{"timeZones":["UTC","Mars/Base"]}}}')
    expect(!result.ok && result.issues[0]?.path).toBe('footer.clock.timeZones.1')
  })

  it('reports JSON syntax errors with a line', () => {
    const result = parseCoveConfigText('{\n  "sidebar": {\n}\n')
    expect(!result.ok && result.issues[0]?.line).toBeGreaterThan(0)
  })
})

describe('writeCoveConfigValue', () => {
  it('edits one value and keeps comments around it', () => {
    const text = '{\n  // keep me\n  "sidebar": { "open": true }\n}\n'
    const next = writeCoveConfigValue(text, ['sidebar', 'open'], false)
    expect(next).toContain('// keep me')
    expect(parseCoveConfigText(next)).toEqual({ ok: true, config: { sidebar: { open: false } } })
  })

  it('creates the document from an empty file', () => {
    const next = writeCoveConfigValue('', ['explorer', 'open'], true)
    expect(parseCoveConfigText(next)).toEqual({ ok: true, config: { explorer: { open: true } } })
  })
})

describe('CLI parsing', () => {
  it('reads bracket and dot indexes the same way', () => {
    expect(parseCoveConfigPath('footer.widgets[1].align')).toEqual([
      'footer',
      'widgets',
      1,
      'align'
    ])
    expect(parseCoveConfigPath('footer.widgets.1.align')).toEqual(['footer', 'widgets', 1, 'align'])
  })

  it('keeps bare words as strings and JSON as values', () => {
    expect(parseCoveConfigCliValue('center')).toBe('center')
    expect(parseCoveConfigCliValue('13')).toBe(13)
    expect(parseCoveConfigCliValue('["claude"]')).toEqual(['claude'])
  })
})

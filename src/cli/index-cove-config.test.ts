import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { callMock, runtimeClientConstructorMock, serveOrcaAppMock, getDefaultUserDataPathMock } =
  vi.hoisted(() => ({
    callMock: vi.fn(),
    runtimeClientConstructorMock: vi.fn(),
    serveOrcaAppMock: vi.fn(),
    getDefaultUserDataPathMock: vi.fn(() => '/tmp/orca-user-data')
  }))

vi.mock('./runtime-client', async () => {
  const { createRuntimeClientModuleMock } = await import('./index-test-harness.js')
  return createRuntimeClientModuleMock({
    callMock,
    runtimeClientConstructorMock,
    serveOrcaAppMock,
    getDefaultUserDataPathMock
  })
})

import { main } from './index'
import { parseCoveConfigText } from '../shared/cove-config/cove-config-document'

function captureOutput(): () => string {
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  return () => [...logSpy.mock.calls, ...errSpy.mock.calls].flat().join('\n')
}

describe('orca config', () => {
  const originalConfigDir = process.env.COVE_CONFIG_DIR
  const originalExitCode = process.exitCode
  let directory = ''
  let configFile = ''

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'cove-config-cli-'))
    configFile = join(directory, 'config.json')
    process.env.COVE_CONFIG_DIR = directory
    process.exitCode = undefined
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    process.exitCode = originalExitCode
    if (originalConfigDir === undefined) {
      delete process.env.COVE_CONFIG_DIR
    } else {
      process.env.COVE_CONFIG_DIR = originalConfigDir
    }
    await rm(directory, { recursive: true, force: true })
  })

  it('creates the file on first set and reads the value back through the show alias', async () => {
    const output = captureOutput()
    await main(['config', 'set', 'footer.widgets', '[{"id":"clock","align":"end"}]'], directory)
    await main(['config', 'show', 'footer.widgets[0].align'], directory)

    expect(process.exitCode).toBeUndefined()
    expect(output()).toContain('end')
    expect(JSON.parse(await readFile(configFile, 'utf8'))).toMatchObject({
      footer: { widgets: [{ id: 'clock', align: 'end' }] }
    })
    expect(
      JSON.parse(await readFile(join(directory, 'config.schema.json'), 'utf8'))
    ).toHaveProperty('properties.footer')
  })

  it('keeps comments and leaves the file untouched when a set would make it invalid', async () => {
    const original = '{\n  // keep me\n  "appearance": { "theme": "dark" }\n}\n'
    await writeFile(configFile, original)
    const output = captureOutput()

    await main(['config', 'set', 'appearance.theme', 'sepia'], directory)

    expect(process.exitCode).toBe(1)
    expect(output()).toContain('appearance.theme')
    expect(await readFile(configFile, 'utf8')).toBe(original)
  })

  it('unsets a key without disturbing its siblings', async () => {
    await writeFile(
      configFile,
      '{\n  // keep me\n  "sidebar": { "open": true, "appName": false }\n}\n'
    )
    captureOutput()

    await main(['config', 'unset', 'sidebar.appName'], directory)

    const text = await readFile(configFile, 'utf8')
    expect(text).toContain('// keep me')
    expect(text).toContain('"open": true')
    expect(text).not.toContain('appName')
  })

  it('writes a starter that parses to an empty config and refuses to overwrite without --force', async () => {
    captureOutput()
    await main(['config', 'init'], directory)
    const starter = await readFile(configFile, 'utf8')
    expect(process.exitCode).toBeUndefined()
    expect(parseCoveConfigText(starter)).toEqual({
      ok: true,
      config: { $schema: './config.schema.json' }
    })

    await writeFile(configFile, '{ "explorer": { "open": true } }\n')
    await main(['config', 'init'], directory)
    expect(process.exitCode).toBe(1)
    expect(await readFile(configFile, 'utf8')).toBe('{ "explorer": { "open": true } }\n')

    process.exitCode = undefined
    await main(['config', 'init', '--force'], directory)
    expect(process.exitCode).toBeUndefined()
    expect(await readFile(configFile, 'utf8')).toBe(starter)
  })

  it('lists leaf paths that read back through config get', async () => {
    await writeFile(
      configFile,
      '{ "$schema": "./config.schema.json", "footer": { "widgets": [{ "id": "clock", "align": "end" }], "clock": { "timeZones": [] } } }\n'
    )
    const listOutput = captureOutput()
    await main(['config', 'list'], directory)
    const lines = listOutput().split('\n')
    expect(lines).toEqual([
      'footer.clock.timeZones = []',
      'footer.widgets[0].id = "clock"',
      'footer.widgets[0].align = "end"'
    ])
    vi.restoreAllMocks()

    const getOutput = captureOutput()
    await main(['config', 'get', 'footer.widgets[0].align', '--json'], directory)
    expect(JSON.parse(getOutput()).result).toEqual({ path: 'footer.widgets.0.align', value: 'end' })
  })

  it('reports the line of a syntax error from validate', async () => {
    await writeFile(configFile, '{\n  "appearance": {\n    "theme": "dark",,\n  }\n}\n')
    const output = captureOutput()

    await main(['config', 'validate'], directory)

    expect(process.exitCode).toBe(1)
    expect(output()).toMatch(/line 3/)
  })
})

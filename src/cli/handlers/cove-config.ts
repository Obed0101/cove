import type { CommandHandler } from '../dispatch'
import { printResult } from '../format'
import { rejectRemoteSelectionFlags } from '../remote-selection-flag-rejection'
import { RuntimeClientError, type RuntimeRpcSuccess } from '../runtime-client'
import {
  COVE_CONFIG_INIT_TEXT,
  editCoveConfigFile,
  readCoveConfigFile,
  resolveCoveConfigLocation,
  writeCoveConfigText,
  type CoveConfigLocation
} from '../../main/cove-config/cove-config-file'
import {
  buildCoveConfigJsonSchema,
  type CoveConfig,
  type CoveConfigEdit,
  type CoveConfigIssue
} from '../../shared/cove-config/cove-config-schema'
import {
  formatCoveConfigPath,
  listCoveConfigLeaves,
  parseCoveConfigCliValue,
  parseCoveConfigPath,
  readCoveConfigValue,
  type CoveConfigLeaf,
  type CoveConfigPath
} from '../../shared/cove-config/cove-config-document'

type CoveConfigPathResult = { file: string; schemaFile: string; exists: boolean }
type CoveConfigValueResult = { path: string; value: unknown }
type CoveConfigWriteResult = { file: string; path: string; value: unknown }
type CoveConfigValidateResult = { file: string; exists: boolean; valid: true }
type CoveConfigInitResult = { file: string; schemaFile: string; replaced: boolean }

function localSuccess<TResult>(result: TResult): RuntimeRpcSuccess<TResult> {
  return { id: 'local', ok: true, result, _meta: { runtimeId: 'local' } }
}

function rejectCoveConfigRemoteSelection(flags: ReadonlyMap<string, string | boolean>): void {
  rejectRemoteSelectionFlags(flags, 'the Cove config; it edits the file on this machine.')
}

function formatIssue(issue: CoveConfigIssue): string {
  const line = issue.line === undefined ? '' : `line ${issue.line}: `
  const path = issue.path ? `${issue.path}: ` : ''
  return `${line}${path}${issue.message}`
}

function invalidConfigError(file: string, issues: CoveConfigIssue[]): RuntimeClientError {
  return new RuntimeClientError(
    'invalid_config',
    [`${file} is not valid:`, ...issues.map((issue) => `  ${formatIssue(issue)}`)].join('\n'),
    { file, issues }
  )
}

function requirePathFlag(flags: ReadonlyMap<string, string | boolean>): CoveConfigPath {
  const raw = flags.get('path')
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    throw new RuntimeClientError('invalid_argument', 'Pass a config path, e.g. footer.widgets.')
  }
  try {
    return parseCoveConfigPath(raw)
  } catch (error) {
    throw new RuntimeClientError(
      'invalid_argument',
      error instanceof Error ? error.message : String(error)
    )
  }
}

async function readValidConfig(location: CoveConfigLocation): Promise<CoveConfig> {
  const read = await readCoveConfigFile(location)
  if (!read.ok) {
    throw invalidConfigError(location.file, read.issues)
  }
  return read.config
}

async function applyEdit(location: CoveConfigLocation, edit: CoveConfigEdit): Promise<void> {
  const result = await editCoveConfigFile(location, [edit])
  if (!result.ok) {
    throw invalidConfigError(location.file, result.issues)
  }
}

function formatValue(result: CoveConfigValueResult): string {
  return typeof result.value === 'string' ? result.value : JSON.stringify(result.value, null, 2)
}

export const COVE_CONFIG_HANDLERS: Record<string, CommandHandler> = {
  'config path': async ({ flags, json }) => {
    rejectCoveConfigRemoteSelection(flags)
    const location = resolveCoveConfigLocation()
    const read = await readCoveConfigFile(location)
    printResult(
      localSuccess<CoveConfigPathResult>({
        file: location.file,
        schemaFile: location.schemaFile,
        exists: read.exists
      }),
      json,
      (result) => result.file
    )
  },
  'config get': async ({ flags, json }) => {
    rejectCoveConfigRemoteSelection(flags)
    const location = resolveCoveConfigLocation()
    const config = await readValidConfig(location)
    if (!flags.has('path')) {
      printResult(
        localSuccess<CoveConfigValueResult>({ path: '', value: config }),
        json,
        formatValue
      )
      return
    }
    const path = requirePathFlag(flags)
    const value = readCoveConfigValue(config, path)
    if (value === undefined) {
      throw new RuntimeClientError(
        'not_found',
        `${formatCoveConfigPath(path)} is not set in ${location.file}.`
      )
    }
    printResult(
      localSuccess<CoveConfigValueResult>({ path: formatCoveConfigPath(path), value }),
      json,
      formatValue
    )
  },
  'config set': async ({ flags, json }) => {
    rejectCoveConfigRemoteSelection(flags)
    const path = requirePathFlag(flags)
    const raw = flags.get('value')
    if (typeof raw !== 'string') {
      throw new RuntimeClientError(
        'invalid_argument',
        `Pass a value for ${formatCoveConfigPath(path)}.`
      )
    }
    const value = parseCoveConfigCliValue(raw)
    const location = resolveCoveConfigLocation()
    await applyEdit(location, { path, value })
    printResult(
      localSuccess<CoveConfigWriteResult>({
        file: location.file,
        path: formatCoveConfigPath(path),
        value
      }),
      json,
      (result) => `Set ${result.path} in ${result.file}`
    )
  },
  'config unset': async ({ flags, json }) => {
    rejectCoveConfigRemoteSelection(flags)
    const path = requirePathFlag(flags)
    const location = resolveCoveConfigLocation()
    await applyEdit(location, { path, value: undefined })
    printResult(
      localSuccess<CoveConfigWriteResult>({
        file: location.file,
        path: formatCoveConfigPath(path),
        value: null
      }),
      json,
      (result) => `Removed ${result.path} from ${result.file}`
    )
  },
  'config init': async ({ flags, json }) => {
    rejectCoveConfigRemoteSelection(flags)
    const location = resolveCoveConfigLocation()
    const current = await readCoveConfigFile(location)
    if (current.exists && flags.get('force') !== true) {
      throw new RuntimeClientError(
        'already_exists',
        `${location.file} already exists. Pass --force to replace it with the starter file.`,
        { file: location.file }
      )
    }
    await writeCoveConfigText(location, COVE_CONFIG_INIT_TEXT)
    printResult(
      localSuccess<CoveConfigInitResult>({
        file: location.file,
        schemaFile: location.schemaFile,
        replaced: current.exists
      }),
      json,
      (result) => `${result.replaced ? 'Replaced' : 'Created'} ${result.file}`
    )
  },
  'config list': async ({ flags, json }) => {
    rejectCoveConfigRemoteSelection(flags)
    const leaves = listCoveConfigLeaves(await readValidConfig(resolveCoveConfigLocation()))
    printResult(localSuccess<CoveConfigLeaf[]>(leaves), json, (result) =>
      result.map((leaf) => `${leaf.path} = ${JSON.stringify(leaf.value)}`).join('\n')
    )
  },
  'config validate': async ({ flags, json }) => {
    rejectCoveConfigRemoteSelection(flags)
    const location = resolveCoveConfigLocation()
    const read = await readCoveConfigFile(location)
    if (!read.ok) {
      throw invalidConfigError(location.file, read.issues)
    }
    printResult(
      localSuccess<CoveConfigValidateResult>({
        file: location.file,
        exists: read.exists,
        valid: true
      }),
      json,
      (result) =>
        result.exists ? `${result.file} is valid` : `${result.file} does not exist (defaults apply)`
    )
  },
  'config schema': async ({ flags }) => {
    rejectCoveConfigRemoteSelection(flags)
    console.log(JSON.stringify(buildCoveConfigJsonSchema(), null, 2))
  }
}

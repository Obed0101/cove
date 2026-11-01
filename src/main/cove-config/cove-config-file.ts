import { mkdir, readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import {
  buildCoveConfigJsonSchema,
  type CoveConfig,
  type CoveConfigEdit,
  type CoveConfigEditResult,
  type CoveConfigIssue
} from '../../shared/cove-config/cove-config-schema'
import {
  parseCoveConfigText,
  writeCoveConfigValue
} from '../../shared/cove-config/cove-config-document'
import { durableWriteTempPath, writeFileDurable } from '../durable-file-write'

export const COVE_CONFIG_FILE_NAME = 'config.json'
export const COVE_CONFIG_SCHEMA_FILE_NAME = 'config.schema.json'

export type CoveConfigLocation = { directory: string; file: string; schemaFile: string }

export type CoveConfigFileRead =
  | { exists: false; text: ''; ok: true; config: CoveConfig }
  | { exists: true; text: string; ok: true; config: CoveConfig }
  | { exists: true; text: string; ok: false; issues: CoveConfigIssue[] }

/** `COVE_CONFIG_DIR` moves the folder, e.g. to keep a dev profile's config apart. */
export function resolveCoveConfigLocation(
  env: NodeJS.ProcessEnv = process.env,
  home: string = homedir()
): CoveConfigLocation {
  const override = env.COVE_CONFIG_DIR?.trim()
  const directory = override && override.length > 0 ? override : join(home, '.cove')
  return {
    directory,
    file: join(directory, COVE_CONFIG_FILE_NAME),
    schemaFile: join(directory, COVE_CONFIG_SCHEMA_FILE_NAME)
  }
}

export async function readCoveConfigFile(
  location: CoveConfigLocation
): Promise<CoveConfigFileRead> {
  let text: string
  try {
    text = await readFile(location.file, 'utf8')
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return { exists: false, text: '', ok: true, config: {} }
    }
    throw error
  }
  const parsed = parseCoveConfigText(text)
  return parsed.ok
    ? { exists: true, text, ok: true, config: parsed.config }
    : { exists: true, text, ok: false, issues: parsed.issues }
}

const STARTER_CONFIG_TEXT = `{
  "$schema": "./${COVE_CONFIG_SCHEMA_FILE_NAME}"
}
`

/** `orca config init` output: every section commented out, so it changes nothing until edited. */
export const COVE_CONFIG_INIT_TEXT = `{
  // Cove reads this file live; save it and valid changes apply in the running app.
  // Keys left out keep the in-app setting. Run \`orca config validate\` after editing.
  "$schema": "./${COVE_CONFIG_SCHEMA_FILE_NAME}"

  // "appearance": { "theme": "dark", "material": "glass" },
  // "sidebar": { "open": true, "items": { "automations": false } },
  // "explorer": { "open": false },
  // "footer": {
  //   "widgets": [
  //     { "id": "usage" },
  //     { "id": "focus", "align": "end" },
  //     { "id": "clock", "align": "end" }
  //   ],
  //   "focus": { "minutes": 50 },
  //   "clock": { "hour12": false, "seconds": false, "timeZones": ["Europe/Madrid"] }
  // },
  // "settings": { "terminalFontSize": 13 }
}
`

/** Writes the schema beside the config so editors complete and validate keys. */
export async function writeCoveConfigText(
  location: CoveConfigLocation,
  text: string
): Promise<void> {
  await mkdir(location.directory, { recursive: true })
  const schemaText = `${JSON.stringify(buildCoveConfigJsonSchema(), null, 2)}\n`
  await writeFileDurable(durableWriteTempPath(location.schemaFile), location.schemaFile, schemaText)
  await writeFileDurable(durableWriteTempPath(location.file), location.file, text)
}

export async function ensureCoveConfigFile(location: CoveConfigLocation): Promise<void> {
  const current = await readCoveConfigFile(location)
  await writeCoveConfigText(location, current.exists ? current.text : STARTER_CONFIG_TEXT)
}

/** Applies edits only when the result still validates, so a bad write never replaces a good file. */
export async function editCoveConfigFile(
  location: CoveConfigLocation,
  edits: readonly CoveConfigEdit[]
): Promise<CoveConfigEditResult> {
  const current = await readCoveConfigFile(location)
  let text = current.exists ? current.text : STARTER_CONFIG_TEXT
  for (const edit of edits) {
    text = writeCoveConfigValue(text, edit.path, edit.value)
  }
  const parsed = parseCoveConfigText(text)
  if (!parsed.ok) {
    return parsed
  }
  await writeCoveConfigText(location, text)
  return parsed
}

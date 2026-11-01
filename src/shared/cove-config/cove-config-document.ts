import {
  applyEdits,
  findNodeAtLocation,
  modify,
  parse,
  parseTree,
  printParseErrorCode,
  type ParseError
} from 'jsonc-parser'
import { CoveConfigSchema, type CoveConfig, type CoveConfigIssue } from './cove-config-schema'

export type CoveConfigPath = (string | number)[]

export type CoveConfigParseResult =
  | { ok: true; config: CoveConfig }
  | { ok: false; issues: CoveConfigIssue[] }

function lineAtOffset(text: string, offset: number): number {
  let line = 1
  for (let index = 0; index < offset && index < text.length; index++) {
    if (text.charCodeAt(index) === 10) {
      line++
    }
  }
  return line
}

export function formatCoveConfigPath(path: readonly PropertyKey[]): string {
  return path.map(String).join('.')
}

/** Accepts `footer.widgets.0.align` and `footer.widgets[0].align`. */
export function parseCoveConfigPath(input: string): CoveConfigPath {
  const segments = input
    .trim()
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter((segment) => segment.length > 0)
  if (segments.length === 0) {
    throw new RangeError('[COVE_CONFIG]: Path is empty')
  }
  return segments.map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment))
}

/** An empty or whitespace-only file is an empty configuration. */
export function parseCoveConfigText(text: string): CoveConfigParseResult {
  if (text.trim().length === 0) {
    return { ok: true, config: {} }
  }
  const errors: ParseError[] = []
  const raw: unknown = parse(text, errors, { allowTrailingComma: true, disallowComments: false })
  if (errors.length > 0) {
    return {
      ok: false,
      issues: errors.map((error) => ({
        path: '',
        message: `Invalid JSON: ${printParseErrorCode(error.error)}`,
        line: lineAtOffset(text, error.offset)
      }))
    }
  }
  const result = CoveConfigSchema.safeParse(raw)
  if (result.success) {
    return { ok: true, config: result.data }
  }
  const tree = parseTree(text)
  return {
    ok: false,
    issues: result.error.issues.map((issue) => {
      const jsonPath = issue.path.filter((key) => typeof key !== 'symbol')
      const location = tree ? findNodeAtLocation(tree, jsonPath) : undefined
      return {
        path: formatCoveConfigPath(issue.path),
        message: issue.message,
        ...(location ? { line: lineAtOffset(text, location.offset) } : {})
      }
    })
  }
}

export function readCoveConfigValue(config: CoveConfig, path: CoveConfigPath): unknown {
  let current: unknown = config
  for (const segment of path) {
    if (current === null || typeof current !== 'object' || !Object.hasOwn(current, segment)) {
      return undefined
    }
    current = Reflect.get(current, segment)
  }
  return current
}

/** Edits one value in place, keeping comments and formatting; `undefined` removes it. */
export function writeCoveConfigValue(text: string, path: CoveConfigPath, value: unknown): string {
  const source = text.trim().length === 0 ? '{}\n' : text
  const edits = modify(source, path, value, {
    formattingOptions: { insertSpaces: true, tabSize: 2, eol: '\n' },
    isArrayInsertion: false
  })
  return applyEdits(source, edits)
}

/** CLI values: JSON when it parses (`true`, `13`, `["a"]`), otherwise the raw string. */
export function parseCoveConfigCliValue(input: string): unknown {
  try {
    return JSON.parse(input)
  } catch {
    return input
  }
}

export type CoveConfigLeaf = { path: string; value: unknown }

function formatLeafPath(path: readonly (string | number)[]): string {
  return path
    .map((segment, index) =>
      typeof segment === 'number' ? `[${segment}]` : index === 0 ? segment : `.${segment}`
    )
    .join('')
}

/** Every scalar (and empty container) with a path `config get` accepts, e.g. `footer.widgets[0].id`. */
export function listCoveConfigLeaves(config: CoveConfig): CoveConfigLeaf[] {
  const leaves: CoveConfigLeaf[] = []
  const visit = (value: unknown, path: (string | number)[]): void => {
    const entries: [string | number, unknown][] = Array.isArray(value)
      ? value.map((item, index) => [index, item])
      : value !== null && typeof value === 'object'
        ? Object.entries(value)
        : []
    if (entries.length === 0) {
      leaves.push({ path: formatLeafPath(path), value })
      return
    }
    for (const [segment, child] of entries) {
      visit(child, [...path, segment])
    }
  }
  for (const [key, value] of Object.entries(config)) {
    if (key !== '$schema') {
      visit(value, [key])
    }
  }
  return leaves
}

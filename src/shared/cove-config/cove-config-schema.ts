import { z } from 'zod'

export const COVE_FOOTER_WIDGET_IDS = [
  'weather',
  'clock',
  'focus',
  'note',
  'usage',
  'keep-awake',
  'updates',
  'pet',
  'resources',
  'ports',
  'hosts',
  'floating-terminal'
] as const

export type CoveFooterWidgetId = (typeof COVE_FOOTER_WIDGET_IDS)[number]

export const COVE_FOOTER_ALIGNS = ['start', 'center', 'end'] as const

export type CoveFooterAlign = (typeof COVE_FOOTER_ALIGNS)[number]

export const COVE_USAGE_PROVIDER_IDS = [
  'claude',
  'codex',
  'gemini',
  'antigravity',
  'opencode-go',
  'kimi',
  'minimax',
  'grok',
  'cursor',
  'zcode'
] as const

export const COVE_SIDEBAR_ITEM_IDS = [
  'tasks',
  'automations',
  'artifacts',
  'skills',
  'mobile'
] as const

export type CoveSidebarItemId = (typeof COVE_SIDEBAR_ITEM_IDS)[number]

const FooterWidget = z
  .object({
    id: z.enum(COVE_FOOTER_WIDGET_IDS).describe('Widget to show; widgets left out are hidden.'),
    align: z
      .enum(COVE_FOOTER_ALIGNS)
      .optional()
      .describe('Footer zone: start (left), center or end (right). Defaults to start.')
  })
  .strict()

const FooterFocus = z
  .object({
    minutes: z
      .number()
      .int()
      .min(1)
      .max(180)
      .optional()
      .describe('Length of a focus session in minutes. Defaults to 25.')
  })
  .strict()

function isKnownTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone })
    return true
  } catch {
    return false
  }
}

const FooterClock = z
  .object({
    hour12: z
      .boolean()
      .optional()
      .describe('12-hour clock (true) or 24-hour (false). Defaults to the system locale.'),
    seconds: z.boolean().optional().describe('Show seconds in the footer clock.'),
    timeZones: z
      .array(
        z
          .string()
          .refine(isKnownTimeZone, { message: 'Unknown IANA time zone (e.g. Europe/Madrid)' })
      )
      .max(3)
      .optional()
      .describe('Up to three extra IANA time zones listed in the clock popover.')
  })
  .strict()

const Footer = z
  .object({
    focus: FooterFocus.optional(),
    clock: FooterClock.optional(),
    widgets: z
      .array(FooterWidget)
      .refine((widgets) => new Set(widgets.map((widget) => widget.id)).size === widgets.length, {
        message: 'Each widget can appear only once'
      })
      .optional()
      .describe('Footer widgets in display order. Omit to keep the in-app choices.'),
    usage: z
      .array(z.enum(COVE_USAGE_PROVIDER_IDS))
      .optional()
      .describe('Usage meters shown inside the usage widget.')
  })
  .strict()

const Sidebar = z
  .object({
    open: z.boolean().optional().describe('Left sidebar open at launch and on change.'),
    appName: z.boolean().optional().describe('Show the app name in the sidebar header.'),
    items: z
      .partialRecord(z.enum(COVE_SIDEBAR_ITEM_IDS), z.boolean())
      .optional()
      .describe('Navigation items to show (true) or hide (false).')
  })
  .strict()

const Explorer = z
  .object({
    open: z.boolean().optional().describe('Right explorer open at launch and on change.')
  })
  .strict()

const Appearance = z
  .object({
    theme: z.enum(['system', 'dark', 'light']).optional(),
    material: z.enum(['solid', 'glass']).optional(),
    font: z.string().min(1).optional().describe('Interface font family.')
  })
  .strict()

export const CoveConfigSchema = z
  .object({
    $schema: z.string().optional(),
    appearance: Appearance.optional(),
    sidebar: Sidebar.optional(),
    explorer: Explorer.optional(),
    footer: Footer.optional(),
    settings: z
      .record(z.string(), z.unknown())
      .optional()
      .describe(
        'Any app setting by its key (for example "terminalFontSize": 13). Unknown keys and values of the wrong type are ignored.'
      )
  })
  .strict()

export type CoveConfig = z.infer<typeof CoveConfigSchema>

export type CoveConfigIssue = {
  path: string
  message: string
  line?: number
}

export type CoveConfigSnapshot = {
  path: string
  exists: boolean
  /** Last valid configuration; an invalid edit keeps the previous one applied. */
  config: CoveConfig
  issues: CoveConfigIssue[]
}

/** `value: undefined` removes the key. */
export type CoveConfigEdit = { path: (string | number)[]; value: unknown }

export type CoveConfigEditResult =
  | { ok: true; config: CoveConfig }
  | { ok: false; issues: CoveConfigIssue[] }

export function buildCoveConfigJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(CoveConfigSchema, { target: 'draft-7', io: 'input' })
}

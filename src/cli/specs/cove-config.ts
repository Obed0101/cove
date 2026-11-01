import type { CommandSpec } from '../args'
import { GLOBAL_FLAGS } from '../args'

const LOCATION_NOTE =
  'The file is ~/.cove/config.json (JSONC; COVE_CONFIG_DIR moves the folder). The running app watches it and applies valid changes live.'

export const COVE_CONFIG_COMMAND_SPECS: CommandSpec[] = [
  {
    path: ['config', 'path'],
    summary: 'Print the Cove config file and schema locations',
    usage: 'orca config path [--json]',
    allowedFlags: [...GLOBAL_FLAGS],
    notes: [LOCATION_NOTE]
  },
  {
    path: ['config', 'get'],
    aliases: [['config', 'show']],
    summary: 'Print the Cove config, or the value at a dotted path',
    usage: 'orca config get [<path>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'path'],
    positionalArgs: ['path'],
    examples: [
      'orca config get',
      'orca config get footer.widgets',
      'orca config get footer.widgets[0].align'
    ]
  },
  {
    path: ['config', 'set'],
    summary: 'Set a Cove config value; JSON values are parsed, anything else is a string',
    usage: 'orca config set <path> <value> [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'path', 'value'],
    positionalArgs: ['path', 'value'],
    notes: [
      LOCATION_NOTE,
      'The edit is validated before writing; an invalid result leaves the file unchanged and exits non-zero.'
    ],
    examples: [
      'orca config set appearance.theme dark',
      'orca config set footer.widgets \'[{"id":"usage"},{"id":"clock","align":"end"}]\'',
      'orca config set sidebar.items.tasks false'
    ]
  },
  {
    path: ['config', 'unset'],
    summary: 'Remove a Cove config key so the in-app setting applies again',
    usage: 'orca config unset <path> [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'path'],
    positionalArgs: ['path'],
    examples: ['orca config unset footer.widgets']
  },
  {
    path: ['config', 'init'],
    summary: 'Write a commented starter Cove config file with every section ready to uncomment',
    usage: 'orca config init [--force] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'force'],
    notes: [
      LOCATION_NOTE,
      'Refuses when the file already exists; --force replaces it, comments included.'
    ],
    examples: ['orca config init', 'orca config init --force']
  },
  {
    path: ['config', 'list'],
    summary: 'List every set Cove config value as path = JSON value',
    usage: 'orca config list [--json]',
    allowedFlags: [...GLOBAL_FLAGS],
    notes: ['Each printed path works with orca config get, set and unset.'],
    examples: ['orca config list', 'orca config list --json']
  },
  {
    path: ['config', 'validate'],
    summary: 'Validate the Cove config file and report issues with line numbers',
    usage: 'orca config validate [--json]',
    allowedFlags: [...GLOBAL_FLAGS]
  },
  {
    path: ['config', 'schema'],
    summary: 'Print the JSON Schema for the Cove config file',
    usage: 'orca config schema',
    allowedFlags: [...GLOBAL_FLAGS]
  }
]

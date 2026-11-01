import type { HandlerGroup } from './handler-group-manifest'

export const COVE_CONFIG_HANDLER_GROUP: HandlerGroup = {
  name: 'cove-config',
  keys: [
    'config path',
    'config get',
    'config set',
    'config unset',
    'config init',
    'config list',
    'config validate',
    'config schema'
  ],
  load: async () => (await import('./handlers/cove-config.js')).COVE_CONFIG_HANDLERS
}

export const SLACK_ACTIONS = {
  CONNECT_TOOL: 'connect-tool-action',
  INSTALL_TOOL: 'install-tool-action'
} as const;

export const SLACK_SCOPES = [
  'app_mentions:read',
  'assistant:write',
  'chat:write',
  'im:history',
  'mpim:history',
  'channels:history',
  'groups:history'
] as const;
export const SLACK_ACTIONS = {
  CONNECT_TOOL: 'connect-tool-action',
  INSTALL_TOOL: 'install-tool-action',
  SUBMIT_POSTGRES_CONNECTION: 'submit-postgres-connection',
  POSTGRES_CONNECTION_ACTIONS: {
    HOST: 'postgres_host',
    PORT: 'postgres_port',
    USER: 'postgres_user',
    PASSWORD: 'postgres_password',
    DATABASE: 'postgres_database',
    SSL: 'postgres_ssl'
  },
  CONNECTION_OVERFLOW_MENU: 'connection-overflow-menu'
} as const;

export const SLACK_SCOPES = [
  'app_mentions:read',
  'assistant:write',
  'chat:write',
  'im:history',
  'mpim:history',
  'channels:history',
  'groups:history',
  'users:read',
  'users:read.email'
] as const;
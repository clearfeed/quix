export const SLACK_ACTIONS = {
  CONNECT_TOOL: 'connect-tool-action',
  INSTALL_TOOL: 'install-tool-action',
  ADD_OPENAI_KEY: 'add-openai-key',
  MANAGE_ADMINS: 'manage-admins',
  MANAGE_ADMINS_INPUT: 'manage-admins-input',
  OPENAI_API_KEY_OVERFLOW_MENU: 'openai-api-key-overflow-menu',
  OPENAI_API_KEY_MODAL: {
    SUBMIT: 'submit-openai-key',
    OPENAI_API_KEY_INPUT: 'openai_api_key_input'
  },
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

export const SLACK_MESSAGE_MAX_LENGTH = 3000;
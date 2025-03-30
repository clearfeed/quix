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
  CONNECTION_OVERFLOW_MENU: 'connection-overflow-menu',
  JIRA_CONFIG_MODAL: {
    SUBMIT: 'jira-config-modal-submit',
    PROJECT_KEY_INPUT: 'jira-config-modal-project-key-input'
  },
  MANAGE_ACCESS_CONTROLS: 'manage-access-controls',
  ALLOWED_CHANNELS_SELECT: 'allowed-channels-select',
  ACCESS_LEVEL_SELECT: 'access-level-select',
  SUBMIT_NOTION_CONNECTION: 'submit-notion-connection',
  NOTION_CONNECTION_ACTIONS: {
    API_TOKEN: 'notion-api-token',
  },
  SUBMIT_LINEAR_CONNECTION: 'submit-linear-connection',
  LINEAR_CONNECTION_ACTIONS: {
    API_TOKEN: 'linear-api-token',
  },
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
  'users:read.email',
  'channels:read',
] as const;

export const SLACK_MESSAGE_MAX_LENGTH = 3000;
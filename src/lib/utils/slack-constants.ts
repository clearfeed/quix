export const SLACK_ACTIONS = {
  CONNECT_TOOL: 'connect-tool-action',
  INSTALL_TOOL: 'install-tool-action',
  INSTALL_MCP_SERVER: 'install-mcp-server-action',
  ADD_OPENAI_KEY: 'add-openai-key',
  MANAGE_ADMINS: 'manage-admins',
  MANAGE_ADMINS_INPUT: 'manage-admins-input',
  OPENAI_API_KEY_OVERFLOW_MENU: 'openai-api-key-overflow-menu',
  OPENAI_API_KEY_MODAL: {
    SUBMIT: 'submit-openai-key',
    OPENAI_API_KEY_INPUT: 'openai_api_key_input'
  },
  POSTGRES_CONNECTION_ACTIONS: {
    HOST: 'postgres_host',
    PORT: 'postgres_port',
    USER: 'postgres_user',
    PASSWORD: 'postgres_password',
    DATABASE: 'postgres_database',
    SSL: 'postgres_ssl',
    DEFAULT_PROMPT: 'postgres-default-prompt',
    SUBMIT: 'submit-postgres-connection'
  },
  CONNECTION_OVERFLOW_MENU: 'connection-overflow-menu',
  DISCONNECT_CONFIRM_MODAL: {
    SUBMIT: 'disconnect_confirm_modal_submit'
  },
  JIRA_CONFIG_MODAL: {
    SUBMIT: 'jira-config-modal-submit',
    PROJECT_KEY_INPUT: 'jira-config-modal-project-key-input',
    DEFAULT_PROMPT: 'jira-default-prompt'
  },
  GITHUB_CONFIG_MODAL: {
    SUBMIT: 'github-config-modal-submit',
    REPO_INPUT: 'github-config-modal-repo-input',
    OWNER_INPUT: 'github-config-modal-owner-input',
    DEFAULT_PROMPT: 'github-default-prompt'
  },
  MANAGE_ACCESS_CONTROLS: 'manage-access-controls',
  ALLOWED_CHANNELS_SELECT: 'allowed-channels-select',
  ACCESS_LEVEL_SELECT: 'access-level-select',
  NOTION_CONNECTION_ACTIONS: {
    API_TOKEN: 'notion-api-token',
    DEFAULT_PROMPT: 'notion-default-prompt',
    SUBMIT: 'submit-notion-connection'
  },
  LINEAR_CONNECTION_ACTIONS: {
    API_TOKEN: 'linear-api-token',
    DEFAULT_PROMPT: 'linear-default-prompt',
    SUBMIT: 'submit-linear-connection'
  },
  MCP_CONNECTION_ACTIONS: {
    NAME: 'mcp-name',
    URL: 'mcp-url',
    API_TOKEN: 'mcp-api-token',
    DEFAULT_PROMPT: 'mcp-default-prompt',
    TOOL_SELECTION_PROMPT: 'mcp-tool-selection-prompt',
    SUBMIT: 'submit-mcp-connection'
  },
  SALESFORCE_CONFIG_MODAL: {
    DEFAULT_PROMPT: 'salesforce-default-prompt',
    SUBMIT: 'submit-salesforce-config-modal'
  },
  SUBMIT_OKTA_CONNECTION: 'submit-okta-connection',
  OKTA_CONNECTION_ACTIONS: {
    ORG_URL: 'okta-org-url',
    API_TOKEN: 'okta-api-token'
  },
  HUBSPOT_CONFIG_MODAL: {
    DEFAULT_PROMPT: 'hubspot-default-prompt',
    SUBMIT: 'submit-hubspot-config-modal'
  },
  ZENDESK_CONNECTION_ACTIONS: {
    API_TOKEN: 'zendesk-api-token',
    SUBDOMAIN: 'zendesk-subdomain',
    DEFAULT_PROMPT: 'zendesk-default-prompt',
    SUBMIT: 'submit-zendesk-connection',
    EMAIL: 'zendesk-email'
  },
  SUBMIT_JUMPCLOUD_CONNECTION: 'submit-jumpcloud-connection',
  JUMPCLOUD_CONNECTION_ACTIONS: {
    API_KEY: 'jumpcloud-api-key'
  },
  SUBMIT_ASSETPANDA_CONNECTION: 'submit-assetpanda-connection',
  ASSETPANDA_CONNECTION_ACTIONS: {
    API_TOKEN: 'assetpanda-api-token'
  }
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
  'reactions:write',
  'channels:join',
  'team:read'
] as const;

export const SLACK_MESSAGE_MAX_LENGTH = 3000;

/**
 * The number of days a user can use Quix for free using our default OpenAI key.
 */
export const TRIAL_DAYS = 7;

/**
 * The maximum number of messages a user can send in a conversation during the trial period when
 * the user has not set their own OpenAI key.
 */
export const TRIAL_MAX_MESSAGE_PER_CONVERSATION_COUNT = 5;

export const SLACK_BOT_USER_ID = 'USLACKBOT';

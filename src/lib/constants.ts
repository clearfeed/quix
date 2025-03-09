export const OPENAI_CONTEXT_SIZE = 30;

export enum SUPPORTED_INTEGRATIONS {
  JIRA = 'jira',
  GITHUB = 'github',
  HUBSPOT = 'hubspot',
  ZENDESK = 'zendesk'
}

export const INTEGRATIONS = [
  {
    name: 'JIRA',
    value: SUPPORTED_INTEGRATIONS.JIRA,
    helpText: 'Connect JIRA to create, update, and view issues.',
    connectedText: 'Jira has been successfully connected! You can now query Jira by chatting with me or mentioning me in any channel. Try asking me things like "What is the status of PROJ-1465" or "Is there a bug related to the login page?"'
  },
  {
    name: 'GitHub',
    value: SUPPORTED_INTEGRATIONS.GITHUB,
    helpText: 'Connect GitHub to interat with issues and pull requests.',
    connectedText: 'GitHub has been successfully connected! You can now query GitHub by chatting with me or mentioning me in any channel. Try asking me things like "What is the status of PROJ-1465" or "Is there a bug related to the login page?"'
  },
  {
    name: 'Hubspot',
    value: SUPPORTED_INTEGRATIONS.HUBSPOT,
    helpText: 'Connect Hubspot to create, update, and view contacts, deals, and companies.',
    connectedText: 'Hubspot has been successfully connected! You can now query Hubspot by chatting with me or mentioning me in any channel. Try asking me things like "What is the status of PROJ-1465" or "Is there a bug related to the login page?"'
  },
  {
    name: 'Zendesk',
    value: SUPPORTED_INTEGRATIONS.ZENDESK,
    helpText: 'Connect Zendesk to create, update, and view tickets.',
    connectedText: 'Zendesk has been successfully connected! You can now query Zendesk by chatting with me or mentioning me in any channel. Try asking me things like "What is the status of PROJ-1465" or "Is there a bug related to the login page?"'
  }
];

export const TimeInSeconds = {
  ONE_MINUTE: 60,
  THIRTY_MINUTES: 1800,
  ONE_HOUR: 3600,
  ONE_DAY: 86400,
  ONE_WEEK: 604800
} as const;

export const TimeInMilliSeconds = {
  ONE_SECOND: 1000,
  ONE_MINUTE: TimeInSeconds.ONE_MINUTE * 1000,
  ONE_DAY: TimeInSeconds.ONE_DAY * 1000
} as const;

export const TimeInMinutes = {
  ONE_HOUR: 60,
  ONE_DAY: 1440,
  ONE_WEEK: 10080,
  /**
   * This is considering 365 days in an year
   */
  ONE_YEAR: 525600
};
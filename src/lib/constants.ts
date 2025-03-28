export const OPENAI_CONTEXT_SIZE = 30;

export enum SUPPORTED_INTEGRATIONS {
  JIRA = 'jira',
  GITHUB = 'github',
  HUBSPOT = 'hubspot',
  ZENDESK = 'zendesk',
  POSTGRES = 'postgres',
  SALESFORCE = 'salesforce',
  SLACK = 'slack',
}

export enum QuixUserAccessLevel {
  ADMINS_ONLY = 'admins_only',
  EVERYONE = 'everyone'
}

export const HUBSPOT_SCOPES = [
  'crm.objects.contacts.read',
  'crm.objects.contacts.write',
  'crm.objects.companies.read',
  'crm.objects.companies.write',
  'crm.objects.deals.read',
  'crm.objects.deals.write',
  'crm.objects.owners.read',
  'tickets'
] as const;

export const GITHUB_SCOPES = [
  'repo',
  'user',
  'read:org'
] as const;

export const INTEGRATIONS: {
  name: string;
  value: SUPPORTED_INTEGRATIONS;
  helpText: string;
  connectedText: string;
  relation: string;
  oauth: boolean;
}[] = [
    {
      name: 'JIRA',
      value: SUPPORTED_INTEGRATIONS.JIRA,
      helpText: 'Connect JIRA to create, update, and view issues.',
      connectedText: 'Jira has been successfully connected! You can now query Jira by chatting with me or mentioning me in any channel. Try asking me things like "What is the status of PROJ-1465" or "Is there a bug related to the login page?"',
      relation: 'jiraConfig',
      oauth: true,
    },
    {
      name: 'GitHub',
      value: SUPPORTED_INTEGRATIONS.GITHUB,
      helpText: 'Connect GitHub to interact with issues and pull requests.',
      connectedText: 'GitHub has been successfully connected! You can now query GitHub by chatting with me or mentioning me in any channel. Try asking me things like "What is the status of issue #123?" or "List all open PRs in the auth-service repo."',
      relation: 'githubConfig',
      oauth: true,
    },
    {
      name: 'Hubspot',
      value: SUPPORTED_INTEGRATIONS.HUBSPOT,
      helpText: 'Connect Hubspot to create, update, and view contacts, deals, and companies.',
      connectedText: 'Hubspot has been successfully connected! You can now query Hubspot by chatting with me or mentioning me in any channel. Try asking me things like "What is the deal status for Quix" or "What is the contact name for Quix"',
      relation: 'hubspotConfig',
      oauth: true,
    },
    // {
    //   name: 'Zendesk',
    //   value: SUPPORTED_INTEGRATIONS.ZENDESK,
    //   helpText: 'Connect Zendesk to create, update, and view tickets.',
    //   connectedText: 'Zendesk has been successfully connected! You can now query Zendesk by chatting with me or mentioning me in any channel. Try asking me things like "What is the status of PROJ-1465" or "Is there a bug related to the login page?"',
    //   relation: 'zendeskConfig',
    // }
    {
      name: 'Postgres',
      value: SUPPORTED_INTEGRATIONS.POSTGRES,
      helpText: 'Connect Postgres to query a database.',
      connectedText: 'Postgres has been successfully connected! You can now query Postgres by chatting with me or mentioning me in any channel. Try asking me things like "Query the accounts table and return the first 10 rows"',
      relation: 'postgresConfig',
      oauth: false,
    },
    {
      name: 'Salesforce',
      value: SUPPORTED_INTEGRATIONS.SALESFORCE,
      helpText: 'Connect Salesforce to interact with your CRM.',
      connectedText: 'Salesforce has been successfully connected! You can now query Salesforce by chatting with me or mentioning me in any channel. Try asking me things like "What is the status of the deal for Quix" or "What is the contact name for Quix"',
      relation: 'salesforceConfig',
      oauth: true,
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

export const SlackMessageUserIdRegex = new RegExp(/<@([U|W]\w+)>/g);

export const QuixPrompts = {
  basePrompt: `
  You are Quix, a helpful assistant that must use the available tools when relevant to answer the user's queries. These queries are sent to you either directly or by tagging you on Slack.
  Messages from slack are formatted as <User_Name>: <Message_Text>
You must not make up information, you must only use the tools to answer the user's queries.
You must answer the user's queries in a clear and concise manner.
You should ask the user to provide more information only if required to answer the question or to perform the task.
  `,
}
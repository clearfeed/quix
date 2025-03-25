import {
  GithubConfig,
  HubspotConfig,
  JiraConfig,
  PostgresConfig,
  SalesforceConfig
} from "@quix/database/models";

import { HomeViewArgs } from "@quix/slack/views/types";

export const OPENAI_CONTEXT_SIZE = 30;

export enum SUPPORTED_INTEGRATIONS {
  JIRA = 'jira',
  GITHUB = 'github',
  HUBSPOT = 'hubspot',
  ZENDESK = 'zendesk',
  POSTGRES = 'postgres',
  SALESFORCE = 'salesforce',
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

export const getToolConfigData = (connection: HomeViewArgs['connection']): string[] => {
  switch (true) {
  case connection instanceof JiraConfig:
    return [`👤 *Username:* ${connection.url}`];
  case connection instanceof HubspotConfig:
    return [`🌐 *Hub Domain:* ${connection.hub_domain}`];
  case connection instanceof PostgresConfig:
    return [
      `🛠️ *Host:* ${connection.host}`,
      `🗄️ *Database:* ${connection.database}`,
      `🔐 *User:* ${connection.user}`,
      `🔒 *SSL Enabled:* ${connection.ssl ? 'Yes' : 'No'}`
    ];
  case connection instanceof GithubConfig:
    return [`👤 *Username:* ${connection.username}`];
  case connection instanceof SalesforceConfig:
    return [
      `👤 *User:* ${connection.authed_user_email}`,
      `🌐 *Instance URL:* ${connection.instance_url}`
    ];
  default:
    return ['No config data.'];
  }
};

export const getCapabilities = (
  selectedTool: (typeof INTEGRATIONS)[number]["value"]
): string[] => {
  switch (selectedTool) {
  case SUPPORTED_INTEGRATIONS.JIRA:
    return [
      "Find all Jira issues mentioning payment failure",
      "What’s the status of `PROJ-256`?",
      "Create a bug in the `ABC` project titled 'Login button not responsive', assign it to `john.doe`, with high priority.",
      "Assign issue `PROJ-142` to `alice.smith`",
      "Add a comment to `PROJ-123`: 'Waiting for design team’s input.'",
      "Show me all comments on `PROJ-987`",
      "Update `PROJ-321`: change the summary to 'Onboarding flow issues', assign it to user ID `abc123`, and set priority to Medium.",
      "Search for users named `Rahul`"
    ];
  case SUPPORTED_INTEGRATIONS.HUBSPOT:
    return [
      "Find deals related to 'Website Redesign'",
      "Search HubSpot deals that mention 'Q2 renewal'",
      "Add a note to deal `934756`: 'Client approved the new pricing structure.'",
      "Attach a note saying 'Follow up next Tuesday' to deal ID `872390`",
      "Create a deal named 'Enterprise Website Project' worth $15,000 in negotiation stage",
      "Create a contact for `John Doe`, `john.doe@example.com`, phone: `+1234567890`"
    ];
  case SUPPORTED_INTEGRATIONS.POSTGRES:
    return [
      "What tables do we have in our database?",
      "What’s the schema of the `users` table?",
      "Show columns and data types of the `orders` table",
      "Give me the top 5 customers by `revenue`",
      "Show all `employees` from the `Sales department`",
      "Get `orders` placed in the last 7 days"
    ];
  case SUPPORTED_INTEGRATIONS.GITHUB:
    return [
      "Find all issues in the `backend` repo related to authentication bugs created by `johnsmith`",
      "Show me the details of issue number 72 in the `frontend/org-xyz` repo",
      "Assign issue #101 in website repo to user `alicehub`",
      "Unassign bobdev from issue #204 in `api-server` repo of `org-xyz`",
      "List all users in our GitHub org `openai-labs`",
      "Create an issue in the `react/facebook` repo titled 'Crash on launch' with description 'The app crashes immediately after opening on iOS 17.'",
      "Search for the keyword `useEffect` in the `dashboard-ui/imkhateeb` repository"
    ];
  case SUPPORTED_INTEGRATIONS.SALESFORCE:
    return [
      "Find all opportunities related to 'Website Upgrade'",
      "Add a note to opportunity ID `0065g00000XyZt2` saying 'Client asked for revised proposal'",
      "Attach a note titled 'Call Summary' to opportunity `0065g00000XyZt2`: 'Call went well, decision expected by next week.'",
      "Create a task for opportunity ID `0065g00000ABCXz` with subject 'Follow up with client', status 'Not Started', and priority 'High'",
      "Find Salesforce user with email `emily@company.com`",
    ];
  default:
    return [
      "Ask questions like:",
      "Give first 10 rows of `accounts` table.",
      "Create a GitHub issue titled Bug in Login flow in `xyz/pqr` repository.",
      "Create a deal named Website Upgrade worth $10,000 in stage negotiations.",
      "Assign jira issue PROJ-123 to xyz."
    ];
  }
};

export const INTEGRATIONS: {
  name: string;
  value: SUPPORTED_INTEGRATIONS;
  helpText: string;
  connectedText: string;
  relation: string;
  oauth: boolean;
  capabilities: string[];
}[] = [
    {
      name: 'JIRA',
      value: SUPPORTED_INTEGRATIONS.JIRA,
      helpText: 'Connect JIRA to create, update, and view issues.',
      connectedText: 'Jira has been successfully connected! You can now query Jira by chatting with me or mentioning me in any channel. Try asking me things like "What is the status of PROJ-1465" or "Is there a bug related to the login page?"',
      relation: 'jiraConfig',
      oauth: true,
      capabilities: getCapabilities(SUPPORTED_INTEGRATIONS.JIRA)
    },
    {
      name: 'GitHub',
      value: SUPPORTED_INTEGRATIONS.GITHUB,
      helpText: 'Connect GitHub to interact with issues and pull requests.',
      connectedText: 'GitHub has been successfully connected! You can now query GitHub by chatting with me or mentioning me in any channel. Try asking me things like "What is the status of issue #123?" or "List all open PRs in the auth-service repo."',
      relation: 'githubConfig',
      oauth: true,
      capabilities: getCapabilities(SUPPORTED_INTEGRATIONS.GITHUB)
    },
    {
      name: 'Hubspot',
      value: SUPPORTED_INTEGRATIONS.HUBSPOT,
      helpText: 'Connect Hubspot to create, update, and view contacts, deals, and companies.',
      connectedText: 'Hubspot has been successfully connected! You can now query Hubspot by chatting with me or mentioning me in any channel. Try asking me things like "What is the deal status for Quix" or "What is the contact name for Quix"',
      relation: 'hubspotConfig',
      oauth: true,
      capabilities: getCapabilities(SUPPORTED_INTEGRATIONS.HUBSPOT)
    },
    // {
    //   name: 'Zendesk',
    //   value: SUPPORTED_INTEGRATIONS.ZENDESK,
    //   helpText: 'Connect Zendesk to create, update, and view tickets.',
    //   connectedText: 'Zendesk has been successfully connected! You can now query Zendesk by chatting with me or mentioning me in any channel. Try asking me things like "What is the status of PROJ-1465" or "Is there a bug related to the login page?"',
    //   relation: 'zendeskConfig',
    //   capabilities: getCapabilities(SUPPORTED_INTEGRATIONS.ZENDESK)
    // }
    {
      name: 'Postgres',
      value: SUPPORTED_INTEGRATIONS.POSTGRES,
      helpText: 'Connect Postgres to query a database.',
      connectedText: 'Postgres has been successfully connected! You can now query Postgres by chatting with me or mentioning me in any channel. Try asking me things like "Query the accounts table and return the first 10 rows"',
      relation: 'postgresConfig',
      oauth: false,
      capabilities: getCapabilities(SUPPORTED_INTEGRATIONS.POSTGRES)
    },
    {
      name: 'Salesforce',
      value: SUPPORTED_INTEGRATIONS.SALESFORCE,
      helpText: 'Connect Salesforce to interact with your CRM.',
      connectedText: 'Salesforce has been successfully connected! You can now query Salesforce by chatting with me or mentioning me in any channel. Try asking me things like "What is the status of the deal for Quix" or "What is the contact name for Quix"',
      relation: 'salesforceConfig',
      oauth: true,
      capabilities: getCapabilities(SUPPORTED_INTEGRATIONS.SALESFORCE)
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
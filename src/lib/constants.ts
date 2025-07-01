export const OPENAI_CONTEXT_SIZE = 30;

export enum SUPPORTED_INTEGRATIONS {
  JIRA = 'jira',
  GITHUB = 'github',
  HUBSPOT = 'hubspot',
  ZENDESK = 'zendesk',
  POSTGRES = 'postgres',
  SALESFORCE = 'salesforce',
  SLACK = 'slack',
  NOTION = 'notion',
  LINEAR = 'linear',
  OKTA = 'okta'
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

export const GITHUB_SCOPES = ['repo', 'user', 'read:org'] as const;

export const INTEGRATIONS: {
  name: string;
  value: SUPPORTED_INTEGRATIONS;
  helpText: string;
  connectedText: string;
  relation: string;
  oauth: boolean;
  suggestedPrompt: {
    title: string;
    message: string;
  };
  oneLineSummary: string;
}[] = [
  {
    name: 'JIRA',
    value: SUPPORTED_INTEGRATIONS.JIRA,
    helpText: 'Connect JIRA to create, update, and view issues.',
    connectedText:
      'Jira has been successfully connected! You can now query Jira by chatting with me or mentioning me in any channel. Try asking me things like "What is the status of PROJ-1465" or "Is there a bug related to the login page?"',
    relation: 'jiraConfig',
    oauth: true,
    suggestedPrompt: {
      title: 'Get Jira issue details',
      message: "What's the status of my Jira issue PROJ-123?"
    },
    oneLineSummary: 'Create, search, and update issues in JIRA'
  },
  {
    name: 'GitHub',
    value: SUPPORTED_INTEGRATIONS.GITHUB,
    helpText: 'Connect GitHub to interact with issues and pull requests.',
    connectedText:
      'GitHub has been successfully connected! You can now query GitHub by chatting with me or mentioning me in any channel. Try asking me things like "What is the status of issue #123?" or "List all open PRs in the auth-service repo."',
    relation: 'githubConfig',
    oauth: true,
    suggestedPrompt: {
      title: 'List open GitHub PRs',
      message: 'What are all the open pull requests in the main repository?'
    },
    oneLineSummary: 'Create, update, and search issues or PRs in GitHub'
  },
  {
    name: 'Hubspot',
    value: SUPPORTED_INTEGRATIONS.HUBSPOT,
    helpText: 'Connect Hubspot to create, update, and view contacts, deals, and companies.',
    connectedText:
      'Hubspot has been successfully connected! You can now query Hubspot by chatting with me or mentioning me in any channel. Try asking me things like "What is the deal status for Quix" or "What is the contact name for Quix"',
    relation: 'hubspotConfig',
    oauth: true,
    suggestedPrompt: {
      title: 'Get deal details from HubSpot',
      message: "What's the status of my deal with Tesla?"
    },
    oneLineSummary: 'Track contacts, companies, and deals in HubSpot'
  },
  {
    name: 'Zendesk',
    value: SUPPORTED_INTEGRATIONS.ZENDESK,
    helpText: 'Connect Zendesk to create, update, and view tickets.',
    connectedText:
      'Zendesk has been successfully connected! You can now query Zendesk by chatting with me or mentioning me in any channel. Try asking me things like "Get me zendesk tickets related to authentication" or "Get me details related to zendesk ticket #618"',
    relation: 'zendeskConfig',
    oauth: false,
    suggestedPrompt: {
      title: 'Query Zendesk tickets',
      message: 'Get me zendesk tickets related to authentication'
    },
    oneLineSummary: 'Create, update, and view tickets in Zendesk'
  },
  {
    name: 'Postgres',
    value: SUPPORTED_INTEGRATIONS.POSTGRES,
    helpText: 'Connect Postgres to query a database.',
    connectedText:
      'Postgres has been successfully connected! You can now query Postgres by chatting with me or mentioning me in any channel. Try asking me things like "Query the accounts table and return the first 10 rows"',
    relation: 'postgresConfig',
    oauth: false,
    suggestedPrompt: {
      title: 'Query Postgres database',
      message: 'Show me the first 10 rows from the users table'
    },
    oneLineSummary: 'Run natural-language queries on your Postgres database'
  },
  {
    name: 'Salesforce',
    value: SUPPORTED_INTEGRATIONS.SALESFORCE,
    helpText: 'Connect Salesforce to interact with your CRM.',
    connectedText:
      'Salesforce has been successfully connected! You can now query Salesforce by chatting with me or mentioning me in any channel. Try asking me things like "What is the status of the deal for Quix" or "What is the contact name for Quix"',
    relation: 'salesforceConfig',
    oauth: true,
    suggestedPrompt: {
      title: 'Get Salesforce opportunity',
      message: "What's the status of the Acme Corp opportunity?"
    },
    oneLineSummary: 'View and update opportunities, contacts, and accounts in Salesforce'
  },
  {
    name: 'Notion',
    value: SUPPORTED_INTEGRATIONS.NOTION,
    helpText: 'Connect Notion to interact with your workspace.',
    connectedText:
      'Notion has been successfully connected! You can now query Notion by chatting with me or mentioning me in any channel. Try asking me things like "Show me my recent pages", "Search for documents about marketing", or "Get the content of page X".',
    relation: 'notionConfig',
    oauth: false,
    suggestedPrompt: {
      title: 'Search Notion documents',
      message: 'Find all Notion pages about product roadmap'
    },
    oneLineSummary: 'Search, browse, and retrieve content from your Notion workspace'
  },
  {
    name: 'Linear',
    value: SUPPORTED_INTEGRATIONS.LINEAR,
    helpText: 'Connect Linear to interact with your projects.',
    connectedText:
      'Linear has been successfully connected! You can now query Linear by chatting with me or mentioning me in any channel. Try asking me things like "Show me my recent issues", "Search for issues about marketing", or "Get the content of issue X".',
    relation: 'linearConfig',
    oauth: false,
    suggestedPrompt: {
      title: 'Check Linear issues',
      message: 'Show me all high priority issues assigned to me'
    },
    oneLineSummary: 'Manage and search tasks or issues in Linear'
  },
  {
    name: 'Okta',
    value: SUPPORTED_INTEGRATIONS.OKTA,
    helpText: 'Connect Okta to manage users, groups, and applications.',
    connectedText:
      'Okta has been successfully connected! You can now query Okta by chatting with me or mentioning me in any channel. Try asking me things like "List all users in Okta", "Search for a user by email", or "Get details for a specific group".',
    relation: 'oktaConfig',
    oauth: false,
    suggestedPrompt: {
      title: 'Search Okta users',
      message: 'Find all Okta users in the Engineering department'
    },
    oneLineSummary: 'Look up users, groups, and apps in Okta'
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

export const SOFT_RETENTION_DAYS = 7;

export const HARD_RETENTION_MONTHS = 2;

export const SlackMessageUserIdRegex = new RegExp(/<@([U|W]\w+)>/g);

export const QuixPrompts = {
  basePrompt: (authorName: string) => `
  You are Quix, a helpful assistant who is responding to ${authorName} (also referred to as "user") that must use the available tools when relevant to answer the user's queries.
  When user wants to reach out to your developer, you should ask them to get in touch with support@clearfeed.ai.
  If user has suggestions for you or wants to report bugs about you, ask them to create a github issue in clearfeed/quix repo.
  These queries may come from different sources and may require using one or more tools in sequence.

- You must not make up any information; always use the provided tools to retrieve facts or perform actions.
- If a task involves multiple steps (e.g., retrieving information and then creating or sending something), use all relevant tools in the correct order.
- Respond in clear and concise markdown.
- Ask the user for more details only if absolutely necessary to proceed.
- When the user references relative dates like "today", "tomorrow", or "now" you MUST always select the common tool to get the current date and time. Do not assume the current date and time.
- When the user references to themselves such as "I" or "me" or "user", you MUST use the user's name in your plan.
  `,
  multiStepBasePrompt: (plan: string, authorName: string, customInstructions: string[]) => `
  You are Quix, a helpful assistant who is responding to ${authorName} (also referred to as "user").
  When user wants to reach out to your developer, you should ask them to get in touch with support@clearfeed.ai.
  If user has suggestions for you or wants to report bugs about you, ask them to create a github issue in clearfeed/quix repo.
  You must execute the following plan using available tools:

${plan}

${
  customInstructions.length > 0
    ? `Custom instructions:
${customInstructions.join('\n')}
`
    : ''
}

Use the tools in order.
ALWAYS follow the custom instructions if any.
Only use tools provided in this session.
Do not make up arguments or responses. Always call tools to get real data.
Do not ask the user for more details unless absolutely necessary to call the tools.
Respond in clear markdown.
  `,
  baseToolSelection: `
  Evaluate the user's query and select the relevant tool categories required to fulfill it.
  If no tools apply, return toolCategories: ["none"] and answer the query using your general knowledge in the 'reason' field. 
  If tools are applicable, select all relevant categories and explain your reasoning in the 'reason' field.
  `,
  PLANNER_PROMPT: (allFunctions: string[], allCustomPrompts: string[]) => {
    const basePrompt = `
    You are a planner that breaks down the user's request into an ordered list of steps using available tools.
    If you are given Custom instructions, you MUST follow each and every one of them.
Only use the following tools:`;
    const outputPrompt = `
    If you see the get_current_date_time tool in the list above, you MUST use it in your plan.
    If the user references to themselves such as "I" or "me" or "user", you MUST use the user's name in your plan.
    Each step must be:
- a tool call: { "type": "tool", "tool": "toolName", "args": { ... } }
Important requirements:
1. Your plan MUST include a specific tool call for EVERY action.
3. Include EVERY parameter required by the tool - don't leave any parameters unspecified
4. The plan must be fully executable without any further planning or interpretation.

Before submitting your plan, verify that you have followed ALL of the Custom instructions if any.

Output only structured JSON matching the required format.`;
    const customPrompt = `
    Custom instructions:
    ${allCustomPrompts.join('\n')}
    `;

    return `
    ${basePrompt}
    ${allFunctions.join('\n')}
    ${customPrompt}
    ${outputPrompt}
    `;
  },
  LINEAR: {
    toolSelection: `
    Linear is a project management tool that manages:
    - Projects: Tasks, issues, and milestones.
    `,
    responseGeneration: `
    When formatting Linear responses:
    - Include project/issue IDs when referencing specific records
    - Format important contact details in bold
    - Present deal values and stages clearly
    `
  }
};

import { AvailableToolsWithConfig } from '../llm/types';

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
  LINEAR = 'linear'
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
}[] = [
  {
    name: 'JIRA',
    value: SUPPORTED_INTEGRATIONS.JIRA,
    helpText: 'Connect JIRA to create, update, and view issues.',
    connectedText:
      'Jira has been successfully connected! You can now query Jira by chatting with me or mentioning me in any channel. Try asking me things like "What is the status of PROJ-1465" or "Is there a bug related to the login page?"',
    relation: 'jiraConfig',
    oauth: true
  },
  {
    name: 'GitHub',
    value: SUPPORTED_INTEGRATIONS.GITHUB,
    helpText: 'Connect GitHub to interact with issues and pull requests.',
    connectedText:
      'GitHub has been successfully connected! You can now query GitHub by chatting with me or mentioning me in any channel. Try asking me things like "What is the status of issue #123?" or "List all open PRs in the auth-service repo."',
    relation: 'githubConfig',
    oauth: true
  },
  {
    name: 'Hubspot',
    value: SUPPORTED_INTEGRATIONS.HUBSPOT,
    helpText: 'Connect Hubspot to create, update, and view contacts, deals, and companies.',
    connectedText:
      'Hubspot has been successfully connected! You can now query Hubspot by chatting with me or mentioning me in any channel. Try asking me things like "What is the deal status for Quix" or "What is the contact name for Quix"',
    relation: 'hubspotConfig',
    oauth: true
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
    connectedText:
      'Postgres has been successfully connected! You can now query Postgres by chatting with me or mentioning me in any channel. Try asking me things like "Query the accounts table and return the first 10 rows"',
    relation: 'postgresConfig',
    oauth: false
  },
  {
    name: 'Salesforce',
    value: SUPPORTED_INTEGRATIONS.SALESFORCE,
    helpText: 'Connect Salesforce to interact with your CRM.',
    connectedText:
      'Salesforce has been successfully connected! You can now query Salesforce by chatting with me or mentioning me in any channel. Try asking me things like "What is the status of the deal for Quix" or "What is the contact name for Quix"',
    relation: 'salesforceConfig',
    oauth: true
  },
  {
    name: 'Notion',
    value: SUPPORTED_INTEGRATIONS.NOTION,
    helpText: 'Connect Notion to interact with your workspace.',
    connectedText:
      'Notion has been successfully connected! You can now query Notion by chatting with me or mentioning me in any channel. Try asking me things like "Show me my recent pages", "Search for documents about marketing", or "Get the content of page X".',
    relation: 'notionConfig',
    oauth: false
  },
  {
    name: 'Linear',
    value: SUPPORTED_INTEGRATIONS.LINEAR,
    helpText: 'Connect Linear to interact with your projects.',
    connectedText:
      'Linear has been successfully connected! You can now query Linear by chatting with me or mentioning me in any channel. Try asking me things like "Show me my recent issues", "Search for issues about marketing", or "Get the content of issue X".',
    relation: 'linearConfig',
    oauth: false
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
  basePrompt: (authorName: string) => `
  You are Quix, a helpful assistant who is responding to ${authorName} (also referred to as "user") that must use the available tools when relevant to answer the user's queries. These queries may come from different sources and may require using one or more tools in sequence.

- You must not make up any information; always use the provided tools to retrieve facts or perform actions.
- If a task involves multiple steps (e.g., retrieving information and then creating or sending something), use all relevant tools in the correct order.
- Respond in clear and concise markdown.
- Ask the user for more details only if absolutely necessary to proceed.
- When the user references relative dates like "today", "tomorrow", or "now" you MUST always select the common tool to get the current date and time. Do not assume the current date and time.
  `,
  multiStepBasePrompt: (plan: string, authorName: string) => `
  You are Quix, a helpful assistant who is responding to ${authorName} (also referred to as "user") that must execute the following plan using available tools:

${plan}

Use the tools in order.
Only use tools provided in this session.
Do not make up arguments or responses. Always call tools to get real data.
Do not ask the user for more details unless absolutely necessary to call the tools.
Respond in clear markdown.
  `,
  baseToolSelection: `
  Select the tool categories to use for the query.
  If no specific tool is needed, respond with "none" and provide a direct answer.
  `,
  PLANNER_PROMPT: (tools: Partial<AvailableToolsWithConfig>): string => {
    const basePrompt = `
You are a planner that breaks down the user's request into an ordered list of steps using the available tools.
Only use the tools listed in the <ToolCategory> tags below.`;
    const toolDescriptions = Object.entries(tools)
      .map(([category, { toolConfig, config }]) => {
        const toolsHtml = (toolConfig?.tools ?? [])
          .map((tool) => `<Tool name="${tool.name}">\n  ${tool.description}\n</Tool>`)
          .join('\n');

        const toolSelectionPrompt = toolConfig?.prompts?.toolSelection ?? '';
        const defaultToolCategoryPrompt =
          config && 'default_prompt' in config ? config.default_prompt : '';
        const prompt = `
<ToolCategory name="${category}">
${toolSelectionPrompt ? `  <Description>${toolSelectionPrompt}</Description>` : ''}
${toolsHtml}
${defaultToolCategoryPrompt ? `  <DefaultPrompt>${defaultToolCategoryPrompt}</DefaultPrompt>` : ''}
</ToolCategory>`;
        return prompt;
      })
      .join('\n\n');

    const outputInstructions = `
You MUST follow these instructions when planning your steps:
- If the user says "I", "me", or "user", replace it with their actual name.
- Use tools from the correct <ToolCategory> based on the request's context.
- If a <ToolCategory> includes a <DefaultPrompt>, you must follow it when planning your steps.
- Each step in your plan must be one of:
  {{ "type": "reason", "input": "..." }}
  {{ "type": "tool", "tool": "<toolName>", "args": {{ <toolArgs> }} }}

Output only structured JSON matching the required format.`;

    return `
${basePrompt}

${toolDescriptions}

${outputInstructions}
`.trim();
  },
  NOTION: {
    toolSelection: `
    Notion is a workspace tool that manages:
    - Pages: Documents, wikis, notes, meeting notes, etc.
    - Databases: Tables, kanban boards, calendars, and lists to manage structured data like tasks, projects, content, goals, etc.
    - Blocks: Rich content like text, headings, checkboxes, tables, and embeds inside pages.

    Consider using Notion tools when the user wants to:
    - Search for or retrieve pages, wikis, or documents by title or content
    - Look up project plans, team docs, meeting notes, or internal guides
    - Access structured information stored in databases (e.g. tasks, roadmaps, OKRs)
    - Create new pages or database entries
    - Update existing content, notes, or checklist items
    - Append content like comments or bullet points to a Notion page
    - Get child blocks (e.g., contents of a page)

    You must not use any outsidde knowledge to answer the user's queries when using the Notion tool.
    `,
    responseGeneration: `
    When formatting Notion responses:
    - Include page/database IDs when referencing specific records
    - Format important contact details in bold
    - Present deal values and stages clearly
    - Include relevant contact properties and custom fields
    - Format dates in a human-readable format
    `
  },
  SLACK: {
    toolSelection: `
    Slack is a messaging tool that manages:
    - Messages: Text, images, videos, and files in channels and direct messages.
    - Channels: Public and private spaces for team communication.
    - Users: Individuals with profiles, roles, and settings.
    `,
    responseGeneration: `
    When formatting Slack responses:
    - Include channel/user IDs when referencing specific records
    - Format important contact details in bold
    - Present deal values and stages clearly
    `
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

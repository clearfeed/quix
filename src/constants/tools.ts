import { searchHubspotDeals } from "../services/hubspot.service";
import { searchJiraIssues, getJiraIssue, createJiraIssue } from "../services/jira.service";

const toolsMap = {
  hubspot: {
    search_hubspot_deals: {
      name: 'search_hubspot_deals',
      function: ({ keyword }: { keyword: string }) => searchHubspotDeals(keyword),
      description: 'Search for deals in HubSpot based on a keyword',
    },
  },
  jira: {
    find_jira_ticket: {
      name: 'find_jira_ticket',
      function: ({ keyword }: { keyword: string }) => searchJiraIssues(keyword),
      description: 'Find JIRA issues based on a keyword',
    },
    get_jira_issue: {
      name: 'get_jira_issue',
      function: ({ issueId }: { issueId: string }) => getJiraIssue(issueId),
      description: 'Get detailed information about a specific Jira issue by ID',
    },
    create_jira_issue: {
      name: 'create_jira_issue',
      function: (params: { projectKey: string; summary: string; description: string; issueType: string; priority?: string; assignee?: string }) =>
        createJiraIssue(params),
      description: 'Create a new JIRA issue',
    },
  },
} as const;

export const tools = [
  {
    type: 'function' as const,
    function: {
      name: toolsMap.hubspot.search_hubspot_deals.name,
      description: toolsMap.hubspot.search_hubspot_deals.description,
      parameters: {
        type: 'object',
        properties: {
          keyword: {
            type: 'string',
            description: 'The keyword to search for in HubSpot deals',
          },
        },
        required: ['keyword'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: toolsMap.jira.find_jira_ticket.name,
      description: toolsMap.jira.find_jira_ticket.description,
      parameters: {
        type: 'object',
        properties: {
          keyword: {
            type: 'string',
            description: 'The keyword to search for in Jira issues',
          },
        },
        required: ['keyword'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: toolsMap.jira.get_jira_issue.name,
      description: toolsMap.jira.get_jira_issue.description,
      parameters: {
        type: 'object',
        properties: {
          issueId: {
            type: 'string',
            description: 'The Jira issue ID (e.g., PROJ-123)',
          },
        },
        required: ['issueId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: toolsMap.jira.create_jira_issue.name,
      description: toolsMap.jira.create_jira_issue.description,
      parameters: {
        type: 'object',
        properties: {
          projectKey: {
            type: 'string',
            description: 'The project key where the issue should be created (e.g., PROJ)',
          },
          summary: {
            type: 'string',
            description: 'The summary/title of the issue',
          },
          description: {
            type: 'string',
            description: 'The detailed description of the issue',
          },
          issueType: {
            type: 'string',
            description: 'The type of issue (e.g., Bug, Task, Story)',
          },
          priority: {
            type: 'string',
            description: 'Optional: The priority of the issue (e.g., High, Medium, Low)',
          },
          assignee: {
            type: 'string',
            description: 'Optional: The username of the person to assign the issue to',
          },
        },
        required: ['projectKey', 'summary', 'description', 'issueType'],
      },
    },
  },
];

export const toolHandlers: Record<string, (args: any) => Promise<any>> = {
  [toolsMap.hubspot.search_hubspot_deals.name]: toolsMap.hubspot.search_hubspot_deals.function,
  [toolsMap.jira.find_jira_ticket.name]: toolsMap.jira.find_jira_ticket.function,
  [toolsMap.jira.get_jira_issue.name]: toolsMap.jira.get_jira_issue.function,
  [toolsMap.jira.create_jira_issue.name]: toolsMap.jira.create_jira_issue.function,
};
import { searchHubspotDeals } from "../services/hubspot.service";
import { searchJiraIssues, getJiraIssue } from "../services/jira.service";

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
];

export const toolHandlers: Record<string, (args: any) => Promise<any>> = {
  [toolsMap.hubspot.search_hubspot_deals.name]: toolsMap.hubspot.search_hubspot_deals.function,
  [toolsMap.jira.find_jira_ticket.name]: toolsMap.jira.find_jira_ticket.function,
  [toolsMap.jira.get_jira_issue.name]: toolsMap.jira.get_jira_issue.function,
};
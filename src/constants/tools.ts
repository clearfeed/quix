import { searchHubspotDeals } from "../services/hubspot.service";
import { searchJiraIssues } from "../services/jira.service";

const toolsMap = {
  hubspot: {
    search_hubspot_deals: {
      name: 'search_hubspot_deals',
      function: ({ keyword }: { keyword: string }) => searchHubspotDeals(keyword),
      description: 'Search for deals in HubSpot based on a keyword',
    },
  },
  jira: {
    search_jira_issues: {
      name: 'search_jira_issues',
      function: ({ keyword }: { keyword: string }) => searchJiraIssues(keyword),
      description: 'Search for issues in Jira based on a keyword',
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
      name: toolsMap.jira.search_jira_issues.name,
      description: toolsMap.jira.search_jira_issues.description,
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
]

export const toolHandlers: Record<string, (args: any) => Promise<any>> = {
  [toolsMap.hubspot.search_hubspot_deals.name]: toolsMap.hubspot.search_hubspot_deals.function,
  [toolsMap.jira.search_jira_issues.name]: toolsMap.jira.search_jira_issues.function,
};
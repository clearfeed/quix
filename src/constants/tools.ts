import { searchHubspotDeals } from "../services/hubspot.service";
import { jira } from "../services/jira.service";
import { github } from "../services/github.service";

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
      function: ({ keyword }: { keyword: string }) => jira.searchIssues(keyword),
      description: 'Find JIRA issues based on a keyword',
    },
    get_jira_issue: {
      name: 'get_jira_issue',
      function: ({ issueId }: { issueId: string }) => jira.getIssue(issueId),
      description: 'Get detailed information about a specific Jira issue by ID',
    },
    create_jira_issue: {
      name: 'create_jira_issue',
      function: (params: { projectKey: string; summary: string; description: string; issueType: string; priority?: string; assignee?: string }) =>
        jira.createIssue(params),
      description: 'Create a new JIRA issue',
    },
  },
  github: {
    search_github_prs: {
      name: 'search_github_prs',
      function: (params: { repo: string; status?: string; keyword?: string; reporter?: string }) => github.searchPRs(params),
      description: 'Search GitHub PRs based on status, keywords, and reporter',
    },
    get_github_pr: {
      name: 'get_github_pr',
      function: ({ prNumber, repo }: { prNumber: number; repo: string }) => github.getPR(prNumber, repo),
      description: 'Get detailed information about a specific GitHub PR by number',
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
            description: 'The project key where the issue will be created',
          },
          summary: {
            type: 'string',
            description: 'The summary/title of the issue',
          },
          description: {
            type: 'string',
            description: 'The description of the issue',
          },
          issueType: {
            type: 'string',
            description: 'The type of issue (e.g., Bug, Task, Story)',
          },
          priority: {
            type: 'string',
            description: 'The priority of the issue',
          },
          assignee: {
            type: 'string',
            description: 'The username of the assignee',
          },
        },
        required: ['projectKey', 'summary', 'description', 'issueType'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: toolsMap.github.search_github_prs.name,
      description: toolsMap.github.search_github_prs.description,
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'The name of the repository to search in',
          },
          status: {
            type: 'string',
            description: 'The status of PRs to search for (e.g., open, closed, merged)',
          },
          keyword: {
            type: 'string',
            description: 'The keyword to search for in PR titles and descriptions',
          },
          reporter: {
            type: 'string',
            description: 'The GitHub username of the PR author',
          },
        },
        required: ['repo'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: toolsMap.github.get_github_pr.name,
      description: toolsMap.github.get_github_pr.description,
      parameters: {
        type: 'object',
        properties: {
          prNumber: {
            type: 'number',
            description: 'The PR number to fetch',
          },
          repo: {
            type: 'string',
            description: 'The name of the repository containing the PR',
          },
        },
        required: ['prNumber', 'repo'],
      },
    },
  },
];

export const toolHandlers: Record<string, (args: any) => Promise<any>> = {
  [toolsMap.hubspot.search_hubspot_deals.name]: toolsMap.hubspot.search_hubspot_deals.function,
  [toolsMap.jira.find_jira_ticket.name]: toolsMap.jira.find_jira_ticket.function,
  [toolsMap.jira.get_jira_issue.name]: toolsMap.jira.get_jira_issue.function,
  [toolsMap.jira.create_jira_issue.name]: toolsMap.jira.create_jira_issue.function,
  [toolsMap.github.search_github_prs.name]: toolsMap.github.search_github_prs.function,
  [toolsMap.github.get_github_pr.name]: toolsMap.github.get_github_pr.function,
};
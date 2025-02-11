import { Tool, Tools, createToolsExport } from '@clearfeed-ai/quix-common-agent';
import { JiraService } from './index';
import {
  CreateIssueParams,
  GetIssueResponse,
  SearchIssuesResponse,
  AssignIssueResponse,
  JiraConfig
} from './types';
import { ToolConfig } from '@clearfeed-ai/quix-common-agent';

export interface JiraTools extends Tools {
  find_jira_ticket: Tool<{ keyword: string }, SearchIssuesResponse>;
  get_jira_issue: Tool<{ issueId: string }, GetIssueResponse>;
  create_jira_issue: Tool<CreateIssueParams, GetIssueResponse>;
  assign_jira_issue: Tool<{ issueId: string; assignee: string }, AssignIssueResponse>;
}

const JIRA_TOOL_SELECTION_PROMPT = `
For Jira-related queries, consider using Jira tools when the user wants to:
- Create, view, or search for issues
- Assign issues to team members
- Get issue status updates
- Manage Jira projects and tasks
`;

const getJiraResponsePrompt = (config: JiraConfig) => `
When formatting Jira responses:
- Always include the issue key/ID when referencing issues
- Format status and priority information in bold
- Include relevant timestamps in a human-readable format
- List assignees and reporters clearly
- Format descriptions maintaining proper markdown
- When linking JIRA issues, use the host url: ${config.host}
`;

export function createJiraTools(config: JiraConfig): JiraTools {
  const service = new JiraService(config);

  return {
    find_jira_ticket: {
      type: 'function',
      function: {
        name: 'find_jira_ticket',
        description: 'Find JIRA issues based on a keyword',
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
      handler: ({ keyword }: { keyword: string }) => service.searchIssues(keyword),
    },
    get_jira_issue: {
      type: 'function',
      function: {
        name: 'get_jira_issue',
        description: 'Get detailed information about a specific Jira issue by ID',
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
      handler: ({ issueId }: { issueId: string }) => service.getIssue(issueId),
    },
    create_jira_issue: {
      type: 'function',
      function: {
        name: 'create_jira_issue',
        description: 'Create a new JIRA issue',
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
      handler: (params: CreateIssueParams) => service.createIssue(params),
    },
    assign_jira_issue: {
      type: 'function',
      function: {
        name: 'assign_jira_issue',
        description: 'Assign a Jira issue to a user',
        parameters: {
          type: 'object',
          properties: {
            issueId: {
              type: 'string',
              description: 'The Jira issue ID (e.g., PROJ-123)',
            },
            assignee: {
              type: 'string',
              description: 'The username of the person to assign the issue to',
            },
          },
          required: ['issueId', 'assignee'],
        },
      },
      handler: ({ issueId, assignee }: { issueId: string; assignee: string }) => service.assignIssue(issueId, assignee),
    },
  };
}

export function createJiraToolsExport(config: JiraConfig): ToolConfig {
  const service = new JiraService(config);

  const tools: ToolConfig['tools'] = [
    {
      type: 'function',
      function: {
        name: 'jiraSearchIssues',
        description: 'Search for Jira issues using a keyword',
        parameters: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: 'Keyword to search for in Jira issues'
            }
          },
          required: ['keyword']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'jiraGetIssue',
        description: 'Get details of a specific Jira issue by ID',
        parameters: {
          type: 'object',
          properties: {
            issueId: {
              type: 'string',
              description: 'The ID of the Jira issue'
            }
          },
          required: ['issueId']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'jiraCreateIssue',
        description: 'Create a new Jira issue',
        parameters: {
          type: 'object',
          properties: {
            projectKey: {
              type: 'string',
              description: 'The project key where the issue should be created'
            },
            summary: {
              type: 'string',
              description: 'The summary/title of the issue'
            },
            description: {
              type: 'string',
              description: 'The description of the issue'
            },
            issueType: {
              type: 'string',
              description: 'The type of issue (e.g., Bug, Task, Story)'
            },
            priority: {
              type: 'string',
              description: 'The priority of the issue'
            },
            assignee: {
              type: 'string',
              description: 'The username of the assignee'
            }
          },
          required: ['projectKey', 'summary', 'description', 'issueType']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'jiraAssignIssue',
        description: 'Assign a Jira issue to a user',
        parameters: {
          type: 'object',
          properties: {
            issueId: {
              type: 'string',
              description: 'The ID of the Jira issue'
            },
            assignee: {
              type: 'string',
              description: 'The username of the assignee'
            }
          },
          required: ['issueId', 'assignee']
        }
      }
    }
  ];

  const handlers = {
    jiraSearchIssues: (args: { keyword: string }) => service.searchIssues(args.keyword),
    jiraGetIssue: (args: { issueId: string }) => service.getIssue(args.issueId),
    jiraCreateIssue: (args: any) => service.createIssue(args),
    jiraAssignIssue: (args: { issueId: string; assignee: string }) => service.assignIssue(args.issueId, args.assignee)
  };

  return {
    tools,
    handlers,
    prompts: {
      toolSelection: JIRA_TOOL_SELECTION_PROMPT,
      responseGeneration: getJiraResponsePrompt(config)
    }
  };
} 
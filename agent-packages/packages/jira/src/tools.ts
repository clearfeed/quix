import { JiraService } from './index';
import { CreateIssueParams, GetIssueResponse, SearchIssuesResponse, AssignIssueResponse, JiraConfig } from './types';

export interface JiraTools {
  find_jira_ticket: {
    type: 'function';
    function: {
      name: 'find_jira_ticket';
      description: 'Find JIRA issues based on a keyword';
      parameters: {
        type: 'object';
        properties: {
          keyword: {
            type: 'string';
            description: 'The keyword to search for in Jira issues';
          };
        };
        required: ['keyword'];
      };
    };
    handler: (args: { keyword: string }) => Promise<SearchIssuesResponse>;
  };
  get_jira_issue: {
    type: 'function';
    function: {
      name: 'get_jira_issue';
      description: 'Get detailed information about a specific Jira issue by ID';
      parameters: {
        type: 'object';
        properties: {
          issueId: {
            type: 'string';
            description: 'The Jira issue ID (e.g., PROJ-123)';
          };
        };
        required: ['issueId'];
      };
    };
    handler: (args: { issueId: string }) => Promise<GetIssueResponse>;
  };
  create_jira_issue: {
    type: 'function';
    function: {
      name: 'create_jira_issue';
      description: 'Create a new JIRA issue';
      parameters: {
        type: 'object';
        properties: {
          projectKey: {
            type: 'string';
            description: 'The project key where the issue will be created';
          };
          summary: {
            type: 'string';
            description: 'The summary/title of the issue';
          };
          description: {
            type: 'string';
            description: 'The description of the issue';
          };
          issueType: {
            type: 'string';
            description: 'The type of issue (e.g., Bug, Task, Story)';
          };
          priority: {
            type: 'string';
            description: 'The priority of the issue';
          };
          assignee: {
            type: 'string';
            description: 'The username of the assignee';
          };
        };
        required: ['projectKey', 'summary', 'description', 'issueType'];
      };
    };
    handler: (args: CreateIssueParams) => Promise<GetIssueResponse>;
  };
  assign_jira_issue: {
    type: 'function';
    function: {
      name: 'assign_jira_issue';
      description: 'Assign a Jira issue to a user';
      parameters: {
        type: 'object';
        properties: {
          issueId: {
            type: 'string';
            description: 'The Jira issue ID (e.g., PROJ-123)';
          };
          assignee: {
            type: 'string';
            description: 'The username of the person to assign the issue to';
          };
        };
        required: ['issueId', 'assignee'];
      };
    };
    handler: (args: { issueId: string; assignee: string }) => Promise<AssignIssueResponse>;
  };
}

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
      handler: ({ keyword }) => service.searchIssues(keyword),
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
      handler: ({ issueId }) => service.getIssue(issueId),
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
      handler: (params) => service.createIssue(params),
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
      handler: ({ issueId, assignee }) => service.assignIssue(issueId, assignee),
    },
  };
}

export function createJiraToolsExport(config: JiraConfig) {
  const tools = createJiraTools(config);
  return {
    tools: Object.values(tools),
    handlers: Object.fromEntries(
      Object.entries(tools).map(([_, tool]) => [tool.function.name, tool.handler])
    ),
  };
} 
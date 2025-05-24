import { z, ZodObject } from 'zod';
import { JiraService } from './index';
import {
  CreateIssueParams,
  GetIssueResponse,
  SearchIssuesResponse,
  AssignIssueResponse,
  JiraConfig,
  AddCommentParams,
  AddCommentResponse,
  GetCommentsResponse,
  UpdateIssueResponse,
  UpdateIssueFields,
  SearchUsersResponse,
  GetIssueTypesResponse
} from './types';
import { BaseResponse, ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { DynamicStructuredTool } from '@langchain/core/tools';

const JIRA_TOOL_SELECTION_PROMPT = `
For Jira-related queries, ask for extra information only if it is required. Consider using Jira tools when the user wants to:
- Create, view, or search for issues
- Assign issues to team members
- Get issue status updates
- Manage Jira projects and tasks
- Add or view comments on issues
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

export function createJiraTools(config: JiraConfig): ToolConfig['tools'] {
  const service = new JiraService(config);

  const tools: DynamicStructuredTool<any>[] = [
    new DynamicStructuredTool({
      name: 'find_jira_ticket',
      description: `Search for Jira issues using a valid JQL (Jira Query Language) query. 
This tool helps retrieve relevant issues by allowing complex filtering based on project, issue type, assignee, status, priority, labels, sprint, and more.`,

      schema: z.object({
        jql_query: z.string().describe(`
          A valid Jira Query Language (JQL) query used to filter issues.
          - When user asks about open issues or tasks, use the query: "status != Done"
          - When a user is mentioned in the query, first fetch users using the "search_jira_users" tool and then use the account ID of the mentioned user.
          `)
      }),
      func: async ({
        jql_query
      }: {
        jql_query: string;
      }): Promise<BaseResponse<SearchIssuesResponse>> => service.searchIssues(jql_query)
    }),
    new DynamicStructuredTool<ZodObject<{ issueId: z.ZodString }>>({
      name: 'get_jira_issue',
      description:
        'Retrieve detailed information about a specific Jira issue using its key or ID. Use this when the user provides an exact issue key or ID.',
      schema: z.object({
        issueId: z.string().describe('The key or ID of the Jira issue (e.g., "PROJ-123").')
      }),
      func: async ({ issueId }: { issueId: string }): Promise<GetIssueResponse> =>
        service.getIssue(issueId)
    }),
    new DynamicStructuredTool({
      name: 'get_jira_issue_types',
      description: 'Retrieve all available issue types for a Jira project.',
      schema: z.object({
        projectKey: config.defaultConfig?.projectKey
          ? z
              .string()
              .describe('The key of the project for which to fetch issue types')
              .optional()
              .default(config.defaultConfig.projectKey)
          : z.string().describe('The key of the project for which to fetch issue types')
      }),
      func: async ({ projectKey }: { projectKey: string }): Promise<GetIssueTypesResponse> =>
        service.getProjectIssueTypes(projectKey)
    }),

    new DynamicStructuredTool({
      name: 'create_jira_issue',
      description: 'Create a new Jira issue.',
      schema: z.object({
        projectKey: config.defaultConfig?.projectKey
          ? z
              .string()
              .describe('The key of the project where the issue will be created')
              .optional()
              .default(config.defaultConfig.projectKey)
          : z
              .string()
              .describe('The key of the project where the issue will be created (required)'),
        summary: z.string().describe('A brief summary or title for the issue'),
        description: z.string().describe('A detailed description of the issue').optional(),
        issueTypeId: z
          .string()
          .describe(
            `The ID of the issue type. Use the 'get_jira_issue_types' tool to find the appropriate ID based on the user's request and issue type details.`
          ),
        priority: z.string().describe('The name of the priority (e.g., High, Medium)').optional(),
        assigneeId: z
          .string()
          .describe(
            'The account ID of the user to assign the issue to. Use the "search_jira_users" tool to find account ID of a user by name or email.'
          )
          .optional(),
        labels: z.array(z.string()).optional().describe('Labels to attach to the issue')
      }),
      func: async (params: CreateIssueParams): Promise<GetIssueResponse> =>
        service.createIssue(params)
    }),
    new DynamicStructuredTool({
      name: 'assign_jira_issue',
      description: 'Assign a Jira issue to a user',
      schema: z.object({
        issueId: z.string().describe('The Jira issue ID (e.g., PROJ-123)'),
        accountId: z.string().describe('The ID of the person to assign the issue to')
      }),
      func: async ({
        issueId,
        accountId
      }: {
        issueId: string;
        accountId: string;
      }): Promise<AssignIssueResponse> => service.assignIssue(issueId, accountId)
    }),
    new DynamicStructuredTool({
      name: 'add_jira_comment',
      description: 'Add a comment to a Jira issue',
      schema: z.object({
        issueId: z.string().describe('The Jira issue ID (e.g., PROJ-123)'),
        comment: z.string().describe('The comment text to add to the issue')
      }),
      func: async (params: AddCommentParams): Promise<AddCommentResponse> =>
        service.addComment(params)
    }),
    new DynamicStructuredTool({
      name: 'get_jira_comments',
      description: 'Get comments for a specific Jira issue',
      schema: z.object({
        issueId: z.string().describe('The Jira issue ID (e.g., PROJ-123)')
      }),
      func: async ({ issueId }: { issueId: string }): Promise<GetCommentsResponse> =>
        service.getComments(issueId)
    }),
    new DynamicStructuredTool({
      name: 'update_jira_issue',
      description: 'Update an existing Jira issue.',
      schema: z.object({
        issueId: z.string().describe('The key or ID of the Jira issue (e.g., PROJ-123 or 10083)'),
        fields: z.object({
          summary: z.string().describe('The updated summary or title of the issue').optional(),
          description: z.string().describe('The updated description of the issue').optional(),
          priority: z.string().describe('The updated priority of the issue').optional(),
          labels: z
            .array(z.string())
            .describe('The updated list of labels for the issue')
            .optional(),
          assigneeId: z
            .string()
            .describe(
              'The updated assignee account ID. Use the "search_jira_users" tool to find the account ID of a user by name or email.'
            )
            .optional()
        })
      }),
      func: async (params: {
        issueId: string;
        fields: UpdateIssueFields;
      }): Promise<UpdateIssueResponse> => service.updateIssue(params)
    }),
    new DynamicStructuredTool({
      name: 'search_jira_users',
      description: 'Search for Jira users by name or email',
      schema: z.object({
        query: z.string().describe('The query to search for in Jira users')
      }),
      func: async ({ query }: { query: string }): Promise<SearchUsersResponse> =>
        service.searchUsers(query)
    })
  ];

  return tools;
}

export function createJiraToolsExport(config: JiraConfig): ToolConfig {
  return {
    tools: createJiraTools(config),
    prompts: {
      toolSelection: JIRA_TOOL_SELECTION_PROMPT,
      responseGeneration: getJiraResponsePrompt(config)
    }
  };
}

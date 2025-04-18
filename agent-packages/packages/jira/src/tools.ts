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
  GetPrioritiesResponse,
  GetIssueTypesResponse,
  GetLabelsResponse
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
      description: 'Find JIRA issues based on a keyword',
      schema: z.object({
        keyword: z.string().describe('The keyword to search for in Jira issues')
      }),
      func: async ({ keyword }: { keyword: string }): Promise<BaseResponse<SearchIssuesResponse>> =>
        service.searchIssues(keyword)
    }),
    new DynamicStructuredTool<ZodObject<{ issueId: z.ZodString }>>({
      name: 'get_jira_issue',
      description: 'Get detailed information about a specific Jira issue by ID',
      schema: z.object({
        issueId: z.string().describe('The Jira issue ID (e.g., PROJ-123)')
      }),
      func: async ({ issueId }: { issueId: string }): Promise<GetIssueResponse> =>
        service.getIssue(issueId)
    }),
    new DynamicStructuredTool({
      name: 'get_jira_priorities',
      description: 'Get all available priorities in Jira',
      schema: z.object({}),
      func: async (): Promise<GetPrioritiesResponse> => service.getPriorities()
    }),
    new DynamicStructuredTool({
      name: 'get_jira_issue_types',
      description: 'Get all available issue types in a Jira project',
      schema: z.object({}),
      func: async (): Promise<GetIssueTypesResponse> => service.getIssueTypes()
    }),
    new DynamicStructuredTool({
      name: 'get_jira_labels',
      description: 'Get available labels in Jira',
      schema: z.object({}),
      func: async (): Promise<GetLabelsResponse> => service.getLabels()
    }),
    new DynamicStructuredTool({
      name: 'create_jira_issue',
      description: 'Create a new JIRA issue',
      schema: z.object({
        projectKey: config.defaultConfig?.projectKey
          ? z
              .string()
              .describe('The project key where the issue will be created')
              .optional()
              .default(config.defaultConfig.projectKey)
          : z.string().describe('The project key where the issue will be created (required)'),
        summary: z.string().describe('The summary/title of the issue'),
        issueTypeId: z
          .string()
          .describe(
            'The ID of the issue type. Use get_jira_issue_types tool to see available types.'
          ),
        priorityId: z
          .string()
          .describe(
            'The ID of the priority. Use get_jira_priorities tool to see available priorities.'
          )
          .optional(),
        assigneeId: z
          .string()
          .describe(
            'The accountId of the assignee. Use the "search_jira_users" tool to find the assignee by name/email'
          )
          .optional(),
        labels: z
          .array(z.string())
          .describe('Labels to add to the issue. Use get_jira_labels tool to see available labels.')
          .optional()
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
      description: 'Update a Jira issue',
      schema: z.object({
        issueId: z.string().describe('The Jira issue key or ID (e.g., 10083 or PROJ-123)'),
        fields: z.object({
          summary: z.string().describe('The summary of the issue').optional(),
          priorityId: z
            .string()
            .describe(
              'The ID of the priority. Use get_jira_priorities tool to see available priorities.'
            )
            .optional(),
          assigneeId: z
            .string()
            .describe(
              'The ID of the user to assign the issue to. Use search_jira_users tool to find the assignee by name/email.'
            )
            .optional(),
          labels: z
            .array(z.string())
            .describe(
              'Labels to set on the issue. Use get_jira_labels tool to see available labels.'
            )
            .optional(),
          issueTypeId: z
            .string()
            .describe(
              'The ID of the issue type. Use get_jira_issue_types tool to see available types.'
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

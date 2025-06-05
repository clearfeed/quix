import { z, ZodObject } from 'zod';
import { JiraService } from './index';
import {
  GetIssueResponse,
  SearchIssuesResponse,
  AssignIssueResponse,
  JiraConfig,
  AddCommentParams,
  AddCommentResponse,
  GetCommentsResponse,
  UpdateIssueResponse,
  SearchUsersResponse,
  GetIssueTypesResponse,
  CreateIssueParams,
  UpdateIssueParams
} from './types';
import { BaseResponse, ToolConfig, withNullPreprocessing } from '@clearfeed-ai/quix-common-agent';
import { DynamicStructuredTool } from '@langchain/core/tools';
import {
  addJiraCommentSchema,
  assignJiraIssueSchema,
  createJiraIssueSchema,
  findJiraTicketSchema,
  getJiraCommentsSchema,
  getJiraIssueSchema,
  searchJiraUsersSchema,
  updateJiraTicketSchema
} from './schema';

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

      schema: findJiraTicketSchema.extend({
        jql_query: z.string().describe(`
          A valid Jira Query Language (JQL) query used to filter issues.
          - When a user is mentioned in the query, first fetch users using the "search_jira_users" tool and then use the account ID of the mentioned user.
          ${config.defaultConfig?.projectKey ? '- If no project is provided, use the default project as ' + config.defaultConfig.projectKey : ''}
          `)
      }),
      func: async (args: {
        jql_query: string;
        maxResults: number;
      }): Promise<BaseResponse<SearchIssuesResponse>> => service.searchIssues(args)
    }),
    new DynamicStructuredTool<ZodObject<{ issueId: z.ZodString }>>({
      name: 'get_jira_issue',
      description:
        'Retrieve detailed information about a specific Jira issue using its key or ID. Use this when the user provides an exact issue key or ID.',
      schema: getJiraIssueSchema,
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
              .default(config.defaultConfig.projectKey)
          : z.string().describe('The key of the project for which to fetch issue types')
      }),
      func: async ({ projectKey }: { projectKey: string }): Promise<GetIssueTypesResponse> =>
        service.getProjectIssueTypes(projectKey)
    }),

    new DynamicStructuredTool({
      name: 'create_jira_issue',
      description: 'Create a new Jira issue.',
      schema: withNullPreprocessing(
        createJiraIssueSchema.extend({
          projectKey: config.defaultConfig?.projectKey
            ? z
                .string()
                .describe('The key of the project where the issue will be created')
                .default(config.defaultConfig.projectKey)
            : z
                .string()
                .describe('The key of the project where the issue will be created (required)')
        })
      ),
      func: async (args: CreateIssueParams): Promise<GetIssueResponse> => service.createIssue(args)
    }),
    new DynamicStructuredTool({
      name: 'assign_jira_issue',
      description: 'Assign a Jira issue to a user',
      schema: assignJiraIssueSchema,
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
      schema: addJiraCommentSchema,
      func: async (params: AddCommentParams): Promise<AddCommentResponse> =>
        service.addComment(params)
    }),
    new DynamicStructuredTool({
      name: 'get_jira_comments',
      description: 'Get comments for a specific Jira issue',
      schema: getJiraCommentsSchema,
      func: async ({ issueId }: { issueId: string }): Promise<GetCommentsResponse> =>
        service.getComments(issueId)
    }),
    new DynamicStructuredTool({
      name: 'update_jira_issue',
      description: 'Update an existing Jira issue.',
      schema: withNullPreprocessing(updateJiraTicketSchema),
      func: async (args: UpdateIssueParams): Promise<UpdateIssueResponse> => {
        return service.updateIssue(args);
      }
    }),
    new DynamicStructuredTool({
      name: 'search_jira_users',
      description: 'Search for Jira users by name or email',
      schema: searchJiraUsersSchema,
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

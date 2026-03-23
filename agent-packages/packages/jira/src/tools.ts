import { tool } from '@langchain/core/tools';
import { ToolConfig, ToolOperation, Toolkit } from '@clearfeed-ai/quix-common-agent';
import { JiraService } from './index';
import {
  addJiraCommentSchema,
  getJiraCommentsSchema,
  updateJiraTicketSchema,
  searchJiraUsersSchema,
  assignJiraIssueSchema,
  getJiraIssueSchema,
  searchJiraIssuesSchemaWithConfig,
  getProjectKeySchemaWithConfig,
  createJiraIssueSchemaWithConfig
} from './schema';
import {
  JiraConfig,
  SearchJiraIssuesParams,
  CreateJiraParams,
  ProjectKeyParams,
  GetIssueParams,
  AssignIssueParams,
  AddCommentParams,
  GetCommentsParams,
  UpdateIssueParams,
  SearchUsersParams
} from './types';

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

export function createJiraTools(config: JiraConfig): ToolConfig[] {
  const service = new JiraService(config);

  const toolConfigs: ToolConfig[] = [
    {
      tool: tool(async (args: SearchJiraIssuesParams) => service.searchIssues(args), {
        name: 'search_jira_issues',
        description: `Search for Jira issues using a valid JQL (Jira Query Language) query.
This tool helps retrieve relevant issues by allowing complex filtering based on project, issue type, assignee, status, priority, labels, sprint, and more.`,
        schema: searchJiraIssuesSchemaWithConfig(config)
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async ({ issueId }: GetIssueParams) => service.getIssue(issueId), {
        name: 'get_jira_issue',
        description:
          'Retrieve detailed information about a specific Jira issue using its key or ID. Use this when the user provides an exact issue key or ID.',
        schema: getJiraIssueSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(
        async ({ projectKey }: ProjectKeyParams) => service.getProjectIssueTypes(projectKey),
        {
          name: 'get_jira_issue_types',
          description: 'Retrieve all available issue types for a Jira project.',
          schema: getProjectKeySchemaWithConfig(config)
        }
      ),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async (args: CreateJiraParams) => service.createIssue(args), {
        name: 'create_jira_issue',
        description: 'Create a new Jira issue.',
        schema: createJiraIssueSchemaWithConfig(config)
      }),
      operations: [ToolOperation.CREATE]
    },

    {
      tool: tool(
        async (args: AssignIssueParams) => service.assignIssue(args.issueId, args.accountId),
        {
          name: 'assign_jira_issue',
          description: 'Assign a Jira issue to a user',
          schema: assignJiraIssueSchema
        }
      ),
      operations: [ToolOperation.UPDATE]
    },

    {
      tool: tool(async (args: AddCommentParams) => service.addComment(args), {
        name: 'add_jira_comment',
        description: 'Add a comment to a Jira issue',
        schema: addJiraCommentSchema
      }),
      operations: [ToolOperation.CREATE]
    },

    {
      tool: tool(async (args: GetCommentsParams) => service.getComments(args.issueId), {
        name: 'get_jira_comments',
        description: 'Get comments for a specific Jira issue',
        schema: getJiraCommentsSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async (args: UpdateIssueParams) => service.updateIssue(args), {
        name: 'update_jira_issue',
        description: 'Update an existing Jira issue.',
        schema: updateJiraTicketSchema
      }),
      operations: [ToolOperation.UPDATE]
    },

    {
      tool: tool(async (args: SearchUsersParams) => service.searchUsers(args.query), {
        name: 'search_jira_users',
        description: 'Search for Jira users by name or email',
        schema: searchJiraUsersSchema
      }),
      operations: [ToolOperation.READ]
    }
  ];
  return toolConfigs;
}

export function createJiraToolsExport(config: JiraConfig): Toolkit {
  return {
    toolConfigs: createJiraTools(config),
    prompts: {
      toolSelection: JIRA_TOOL_SELECTION_PROMPT,
      responseGeneration: getJiraResponsePrompt(config)
    }
  };
}

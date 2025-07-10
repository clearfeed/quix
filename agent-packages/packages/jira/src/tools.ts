import { JiraService } from './index';
import {
  addJiraCommentSchema,
  getJiraCommentsSchema,
  updateJiraTicketSchema,
  searchJiraUsersSchema,
  assignJiraIssueSchema,
  getJiraIssueSchema
} from './schema';
import {
  JiraConfig,
  getExtendedFindJiraSchema,
  getExtendedCreateJiraSchema,
  getProjectKeySchema,
  FindJiraParams,
  CreateJiraParams,
  ProjectKeyParams,
  GetIssueParams,
  AssignIssueParams,
  AddCommentParams,
  GetCommentsParams,
  UpdateIssueParams,
  SearchUsersParams
} from './types';
import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
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

  const tools = [
    new DynamicStructuredTool({
      name: 'find_jira_ticket',
      description: `Search for Jira issues using a valid JQL (Jira Query Language) query. 
This tool helps retrieve relevant issues by allowing complex filtering based on project, issue type, assignee, status, priority, labels, sprint, and more.`,
      schema: getExtendedFindJiraSchema(config),
      func: async (args: FindJiraParams) => service.searchIssues(args)
    }),
    new DynamicStructuredTool({
      name: 'get_jira_issue',
      description:
        'Retrieve detailed information about a specific Jira issue using its key or ID. Use this when the user provides an exact issue key or ID.',
      schema: getJiraIssueSchema,
      func: async ({ issueId }: GetIssueParams) => service.getIssue(issueId)
    }),
    new DynamicStructuredTool({
      name: 'get_jira_issue_types',
      description: 'Retrieve all available issue types for a Jira project.',
      schema: getProjectKeySchema(config),
      func: async ({ projectKey }: ProjectKeyParams) => service.getProjectIssueTypes(projectKey)
    }),
    new DynamicStructuredTool({
      name: 'create_jira_issue',
      description: 'Create a new Jira issue.',
      schema: getExtendedCreateJiraSchema(config),
      func: async (args: CreateJiraParams) => service.createIssue(args)
    }),
    new DynamicStructuredTool({
      name: 'assign_jira_issue',
      description: 'Assign a Jira issue to a user',
      schema: assignJiraIssueSchema,
      func: async (args: AssignIssueParams) => service.assignIssue(args.issueId, args.accountId)
    }),
    new DynamicStructuredTool({
      name: 'add_jira_comment',
      description: 'Add a comment to a Jira issue',
      schema: addJiraCommentSchema,
      func: async (args: AddCommentParams) => service.addComment(args)
    }),
    new DynamicStructuredTool({
      name: 'get_jira_comments',
      description: 'Get comments for a specific Jira issue',
      schema: getJiraCommentsSchema,
      func: async (args: GetCommentsParams) => service.getComments(args.issueId)
    }),
    new DynamicStructuredTool({
      name: 'update_jira_issue',
      description: 'Update an existing Jira issue.',
      schema: updateJiraTicketSchema,
      func: async (args: UpdateIssueParams) => service.updateIssue(args)
    }),
    new DynamicStructuredTool({
      name: 'search_jira_users',
      description: 'Search for Jira users by name or email',
      schema: searchJiraUsersSchema,
      func: async (args: SearchUsersParams) => service.searchUsers(args.query)
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

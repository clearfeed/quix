import { z } from 'zod';
import { JiraService } from './index';
import {
  JiraConfig,
  FindJiraParams,
  GetIssueParams,
  ProjectKeyParams,
  CreateJiraParams,
  AssignIssueParams,
  AddCommentParams,
  GetCommentsParams,
  UpdateIssueParams,
  SearchUsersParams
} from './types';
import { ToolConfig, ToolOperation, tool } from '@clearfeed-ai/quix-common-agent';

const JIRA_TOOL_SELECTION_PROMPT = `
For Jira-related queries, ask for extra information only if it is required. Consider using Jira tools when the user wants to:
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

// Schema definitions
const findJiraTicketSchemaWithConfig = (config: JiraConfig) => z.object({
  jql: z.string().describe(`Valid JQL (Jira Query Language) query to search for issues. Examples:
- project = "${config.projectKey || 'PROJECT'}" AND status = "In Progress"
- assignee = currentUser() AND priority = High
- text ~ "keyword" AND created >= -7d
- summary ~ "bug" AND status in ("Open", "In Progress")
- reporter = "john.doe" AND priority in (High, Highest)`),
  startAt: z.number().optional().default(0).describe('Starting index for pagination'),
  maxResults: z.number().optional().default(50).describe('Maximum number of results to return'),
  fields: z.array(z.string()).optional().describe('Specific fields to include in response')
});

const getJiraIssueSchema = z.object({
  issueId: z.string().describe('The Jira issue key or ID (e.g., PROJ-123)')
});

const getProjectKeySchemaWithConfig = (config: JiraConfig) => z.object({
  projectKey: z.string().describe(`The project key (e.g., ${config.projectKey || 'PROJ'})`)
});

const createJiraIssueSchemaWithConfig = (config: JiraConfig) => z.object({
  projectKey: z.string().describe(`The project key where the issue will be created (e.g., ${config.projectKey || 'PROJ'})`),
  summary: z.string().describe('The summary/title of the issue'),
  description: z.string().optional().describe('The description of the issue'),
  issueType: z.string().describe('The type of issue (e.g., Bug, Task, Story, Epic)'),
  priority: z.string().optional().describe('The priority of the issue (e.g., High, Medium, Low)'),
  assignee: z.string().optional().describe('The account ID of the assignee')
});

const assignJiraIssueSchema = z.object({
  issueId: z.string().describe('The Jira issue key or ID (e.g., PROJ-123)'),
  accountId: z.string().describe('The account ID of the person to assign the issue to')
});

const addJiraCommentSchema = z.object({
  issueId: z.string().describe('The Jira issue key or ID (e.g., PROJ-123)'),
  body: z.string().describe('The content of the comment to add')
});

const getJiraCommentsSchema = z.object({
  issueId: z.string().describe('The Jira issue key or ID (e.g., PROJ-123)')
});

const updateJiraTicketSchema = z.object({
  issueId: z.string().describe('The Jira issue key or ID to update (e.g., PROJ-123)'),
  fields: z.record(z.any()).optional().describe('Fields to update with their new values')
});

const searchJiraUsersSchema = z.object({
  query: z.string().describe('Search query for finding users (name, email, etc.)')
});

export function createJiraTools(config: JiraConfig): ToolConfig['tools'] {
  const service = new JiraService(config);

  const tools = [
    tool({
      name: 'find_jira_ticket',
      description: `Search for Jira issues using a valid JQL (Jira Query Language) query. 
This tool helps retrieve relevant issues by allowing complex filtering based on project, issue type, assignee, status, priority, labels, sprint, and more.`,
      schema: findJiraTicketSchemaWithConfig(config),
      operations: [ToolOperation.READ],
      func: async (args: FindJiraParams) => service.searchIssues(args)
    }),
    tool({
      name: 'get_jira_issue',
      description:
        'Retrieve detailed information about a specific Jira issue using its key or ID. Use this when the user provides an exact issue key or ID.',
      schema: getJiraIssueSchema,
      operations: [ToolOperation.READ],
      func: async ({ issueId }: GetIssueParams) => service.getIssue(issueId)
    }),
    tool({
      name: 'get_jira_issue_types',
      description: 'Retrieve all available issue types for a Jira project.',
      schema: getProjectKeySchemaWithConfig(config),
      operations: [ToolOperation.READ],
      func: async ({ projectKey }: ProjectKeyParams) => service.getProjectIssueTypes(projectKey)
    }),
    tool({
      name: 'create_jira_issue',
      description: 'Create a new Jira issue.',
      schema: createJiraIssueSchemaWithConfig(config),
      operations: [ToolOperation.CREATE],
      func: async (args: CreateJiraParams) => service.createIssue(args)
    }),
    tool({
      name: 'assign_jira_issue',
      description: 'Assign a Jira issue to a user',
      schema: assignJiraIssueSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: AssignIssueParams) => service.assignIssue(args.issueId, args.accountId)
    }),
    tool({
      name: 'add_jira_comment',
      description: 'Add a comment to a Jira issue',
      schema: addJiraCommentSchema,
      operations: [ToolOperation.CREATE],
      func: async (args: AddCommentParams) => service.addComment(args)
    }),
    tool({
      name: 'get_jira_comments',
      description: 'Get comments for a specific Jira issue',
      schema: getJiraCommentsSchema,
      operations: [ToolOperation.READ],
      func: async (args: GetCommentsParams) => service.getComments(args.issueId)
    }),
    tool({
      name: 'update_jira_issue',
      description: 'Update an existing Jira issue.',
      schema: updateJiraTicketSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: UpdateIssueParams) => service.updateIssue(args)
    }),
    tool({
      name: 'search_jira_users',
      description: 'Search for Jira users by name or email',
      schema: searchJiraUsersSchema,
      operations: [ToolOperation.READ],
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
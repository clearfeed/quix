import { z, ZodObject } from 'zod';
import { JiraService } from './index';
import {
  CreateIssueParams,
  GetIssueResponse,
  SearchIssuesResponse,
  AssignIssueResponse,
  JiraConfig
} from './types';
import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { DynamicStructuredTool } from '@langchain/core/tools';

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

export function createJiraTools(config: JiraConfig): ToolConfig['tools'] {
  const service = new JiraService(config);

  const tools: DynamicStructuredTool<any>[] = [
    new DynamicStructuredTool({
      name: 'find_jira_ticket',
      description: 'Find JIRA issues based on a keyword',
      schema: z.object({
        keyword: z.string().describe('The keyword to search for in Jira issues')
      }),
      func: async ({ keyword }: { keyword: string }): Promise<SearchIssuesResponse> => service.searchIssues(keyword)
    }),
    new DynamicStructuredTool<ZodObject<{ issueId: z.ZodString }>>({
      name: 'get_jira_issue',
      description: 'Get detailed information about a specific Jira issue by ID',
      schema: z.object({
        issueId: z.string().describe('The Jira issue ID (e.g., PROJ-123)')
      }),
      func: async ({ issueId }: { issueId: string }): Promise<GetIssueResponse> => service.getIssue(issueId)
    }),
    new DynamicStructuredTool({
      name: 'create_jira_issue',
      description: 'Create a new JIRA issue',
      schema: z.object({
        projectKey: z.string().describe('The project key where the issue will be created'),
        summary: z.string().describe('The summary/title of the issue'),
        description: z.string().describe('The description of the issue'),
        issueType: z.string().describe('The type of issue (e.g., Bug, Task, Story)'),
        priority: z.string().describe('The priority of the issue').optional(),
        assignee: z.string().describe('The username of the assignee').optional()
      }),
      func: async (params: CreateIssueParams): Promise<GetIssueResponse> => service.createIssue(params)
    }),
    new DynamicStructuredTool({
      name: 'assign_jira_issue',
      description: 'Assign a Jira issue to a user',
      schema: z.object({
        issueId: z.string().describe('The Jira issue ID (e.g., PROJ-123)'),
        assignee: z.string().describe('The username of the person to assign the issue to')
      }),
      func: async ({ issueId, assignee }: { issueId: string, assignee: string }): Promise<AssignIssueResponse> => service.assignIssue(issueId, assignee)
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
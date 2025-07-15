import { z, ZodObject } from 'zod';
import { JiraService } from './index';
import { JiraConfig } from './types';
import { BaseResponse, ToolConfig } from '@clearfeed-ai/quix-common-agent';
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

const searchIssuesSchema = z.object({
  keyword: z.string().describe('The keyword to search for in Jira issues')
});

const getIssueSchema = z.object({
  issueId: z.string().describe('The Jira issue ID (e.g., PROJ-123)')
});

const createIssueSchema = z.object({
  projectKey: z.string().describe('The project key where the issue will be created'),
  summary: z.string().describe('The summary/title of the issue'),
  description: z.string().describe('The description of the issue').optional(),
  issueType: z.string().describe('The type of issue (e.g., Bug, Task, Story)'),
  priority: z.string().describe('The priority of the issue').optional(),
  assignee: z.string().describe('The username of the assignee').optional()
});

const assignIssueSchema = z.object({
  issueId: z.string().describe('The Jira issue ID (e.g., PROJ-123)'),
  assignee: z.string().describe('The username of the person to assign the issue to')
});

export function createJiraTools(config: JiraConfig): ToolConfig['tools'] {
  const service = new JiraService(config);

  const tools: DynamicStructuredTool<any>[] = [
    new DynamicStructuredTool({
      name: 'find_jira_ticket',
      description: 'Find JIRA issues based on a keyword',
      schema: searchIssuesSchema,
      func: async (args: z.infer<typeof searchIssuesSchema>) => service.searchIssues(args.keyword)
    }),
    new DynamicStructuredTool({
      name: 'get_jira_issue',
      description: 'Get detailed information about a specific Jira issue by ID',
      schema: getIssueSchema,
      func: async (args: z.infer<typeof getIssueSchema>) => service.getIssue(args.issueId)
    }),
    new DynamicStructuredTool({
      name: 'create_jira_issue',
      description: 'Create a new JIRA issue',
      schema: createIssueSchema,
      func: async (args: z.infer<typeof createIssueSchema>) => service.createIssue(args)
    }),
    new DynamicStructuredTool({
      name: 'assign_jira_issue',
      description: 'Assign a Jira issue to a user',
      schema: assignIssueSchema,
      func: async (args: z.infer<typeof assignIssueSchema>) => service.assignIssue(args.issueId, args.assignee)
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
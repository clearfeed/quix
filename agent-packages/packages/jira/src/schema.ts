import { z } from 'zod';

export const findJiraTicketSchema = z.object({
  jql_query: z.string(),
  maxResults: z
    .number()
    .int()
    .min(1)
    .max(20)
    .default(10)
    .describe('The maximum number of items to return per page.')
});

export const updateJiraTicketSchema = z.object({
  issueId: z.string().describe('The key or ID of the Jira issue (e.g., PROJ-123 or 10083)'),
  summary: z.string().describe('The updated summary or title of the issue').nullish(),
  description: z.string().describe('The updated description of the issue').nullish(),
  priority: z.string().describe('The updated priority of the issue').nullish(),
  labels: z.array(z.string()).describe('The updated list of labels for the issue').nullish(),
  assigneeId: z
    .string()
    .describe(
      'The updated assignee account ID. Use the "search_jira_users" tool to find the account ID of a user by name or email.'
    )
    .nullish()
});

export const getJiraIssueSchema = z.object({
  issueId: z.string().describe('The key or ID of the Jira issue (e.g., "PROJ-123").')
});

export const createJiraIssueSchema = z.object({
  projectKey: z.string(),
  summary: z.string().describe('A brief summary or title for the issue'),
  description: z.string().describe('A detailed description of the issue').nullish(),
  issueTypeId: z
    .string()
    .describe(
      `The ID of the issue type. Use the 'get_jira_issue_types' tool to find the appropriate ID based on the user's request and issue type details.`
    ),
  priority: z.string().describe('The name of the priority (e.g., High, Medium)').nullish(),
  assigneeId: z
    .string()
    .describe(
      'The account ID of the user to assign the issue to. Use the "search_jira_users" tool to find account ID of a user by name or email.'
    )
    .nullish(),
  labels: z.array(z.string()).nullish().describe('Labels to attach to the issue')
});

export const assignJiraIssueSchema = z.object({
  issueId: z.string().describe('The Jira issue ID (e.g., PROJ-123)'),
  accountId: z.string().describe('The ID of the person to assign the issue to')
});

export const addJiraCommentSchema = z.object({
  issueId: z.string().describe('The Jira issue ID (e.g., PROJ-123)'),
  comment: z.string().describe('The comment text to add to the issue')
});

export const getJiraCommentsSchema = z.object({
  issueId: z.string().describe('The Jira issue ID (e.g., PROJ-123)')
});

export const searchJiraUsersSchema = z.object({
  query: z.string().describe('The query to search for in Jira users')
});

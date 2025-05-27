import { z } from 'zod';

export const baseSearchIssuesOrPullRequestsSchema = z.object({
  type: z
    .enum(['issue', 'pr'])
    .describe(
      'Specify whether to search for issues or pull requests. Both are tracked the same way in GitHub'
    ),
  keyword: z
    .string()
    .describe(
      'Text to search for in issue titles and descriptions. Can include multiple words or phrases'
    )
    .optional(),
  reporter: z
    .string()
    .describe(
      'GitHub username of the person who created the issue/PR. Filters results to show only their submissions'
    )
    .optional(),
  assignee: z
    .string()
    .describe('GitHub username of the person who is assigned to the issue/PR.')
    .optional(),
  status: z
    .enum(['open', 'closed'])
    .describe('Filter issues by their status (open or closed)')
    .optional(),
  sort: z
    .enum(['comments', 'reactions', 'created', 'updated'])
    .describe('Sort by: number of comments, reactions, creation date, or last update')
    .optional(),
  order: z
    .enum(['asc', 'desc'])
    .describe('Sort order: ascending (oldest/least first) or descending (newest/most first)')
    .optional(),
  label: z
    .string()
    .describe('Filter issues by their labels. Can include multiple labels separated by commas')
    .optional(),
  page: z.number().describe('Page number for pagination, starting at 1')
});

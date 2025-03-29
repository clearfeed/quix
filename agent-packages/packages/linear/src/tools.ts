import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import {
  GetIssueParams,
  SearchIssuesParams,
  LinearConfig,
  CreateIssueParams,
} from './types';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { LinearClient } from '@linear/sdk';
import { isEmpty } from 'lodash';
import { PaginationOrderBy } from '@linear/sdk/dist/_generated_documents';

const LINEAR_TOOL_SELECTION_PROMPT = `
For Linear-related queries, consider using Linear tools when the user wants to:
- Search for issues 
- View issue status and details
- Create new issues 
- Add comments to issues
- Track project progress
`;

const LINEAR_RESPONSE_GENERATION_PROMPT = `
When formatting Linear responses:
- Always include issue IDs and identifiers
- Format issue status and priority in bold
- Include relevant assignee information
- Show issue creation and update times in human-readable format
- Format issue descriptions maintaining proper markdown
- List comments clearly
`;

export function createLinearToolsExport(config: LinearConfig): ToolConfig {
  const client = new LinearClient({ accessToken: config.accessToken });

  const tools: DynamicStructuredTool<any>[] = [
    new DynamicStructuredTool({
      name: 'search_linear_issues',
      description: 'Search Linear issues using a query string',
      schema: z.object({
        query: z.string().describe('The search query'),
        limit: z
          .number()
          .describe('Maximum number of issues to return')
          .optional(),
      }),
      func: async (args: SearchIssuesParams) => {
        try {
          const limit = args.limit || 10;
          const { nodes: issues } = await client.searchIssues(args.query, {
            orderBy: PaginationOrderBy.UpdatedAt,
            first: limit,
          });
          return {
            success: true,
            data: issues,
          };
        } catch (error) {
          return {
            success: false,
            error: `Failed to search Linear issues`,
          };
        }
      },
    }),
    new DynamicStructuredTool({
      name: 'get_linear_issue',
      description:
        'Get detailed information about a specific Linear issue by key',
      schema: z.object({
        issueKey: z
          .string()
          .describe('The key of the issue to retrieve (e.g., PROJ-123)'),
      }),
      func: async (args: GetIssueParams) => {
        try {
          const { nodes: issues } = await client.searchIssues(args.issueKey);
          if (!issues.length) {
            return {
              success: false,
              error: 'Issue not found',
            };
          }
          return {
            success: true,
            data: issues[0],
          };
        } catch (error: unknown) {
          return {
            success: false,
            error: `Failed to fetch Linear issue by key: ${args.issueKey}`,
          };
        }
      },
    }),
    new DynamicStructuredTool({
      name: 'create_linear_issue',
      description: 'Create a new issue in Linear',
      schema: z.object({
        teamKey: !isEmpty(config.defaultConfig?.teamId)
          ? z
              .string()
              .describe(
                'The identifier or key of the team to create the issue in (required)',
              )
              .optional()
          : z
              .string()
              .describe(
                'The identifier or key of the team to create the issue in',
              ),
        title: z.string().describe('The title of the issue'),
        description: z
          .string()
          .describe('The description of the issue')
          .optional(),
        priority: z
          .number()
          .describe('The priority of the issue (1-4, where 1 is highest)')
          .optional(),
        assigneeId: z
          .string()
          .describe('The ID of the user to assign the issue to')
          .optional(),
      }),
      func: async (args: CreateIssueParams) => {
        try {
          let teamId: string | undefined;
          if (args.teamKey) {
            const team = await client.teams({
              filter: {
                key: {
                  eq: args.teamKey,
                },
              },
            });
            teamId = team.nodes[0].id;
          } else if (config.defaultConfig?.teamId) {
            teamId = config.defaultConfig.teamId;
          }
          if (!teamId) {
            return {
              success: false,
              error:
                'Team identifier must be provided when no default team is configured',
            };
          }
          const issue = await client.createIssue({
            teamId,
            title: args.title,
            description: args.description,
            priority: args.priority,
            assigneeId: args.assigneeId,
          });
          return {
            success: true,
            data: issue,
          };
        } catch (error) {
          return {
            success: false,
            error: `Failed to create Linear issue`,
          };
        }
      },
    }),
  ];

  return {
    tools,
    prompts: {
      toolSelection: LINEAR_TOOL_SELECTION_PROMPT,
      responseGeneration: LINEAR_RESPONSE_GENERATION_PROMPT,
    },
  };
}

import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { GitHubService } from './index';
import { GitHubConfig, SearchPRsParams } from './types';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

const GITHUB_TOOL_SELECTION_PROMPT = `
For GitHub-related queries, consider using GitHub tools when the user wants to:
- Search for repositories or issues
- View pull request information
- Check commit history or branch status
- Access repository details and metadata
- View or manage GitHub issues
`;

const GITHUB_RESPONSE_GENERATION_PROMPT = `
When formatting GitHub responses:
- Include repository names and issue/PR numbers
- Format commit hashes in monospace
- Present branch names and status clearly
- Include relevant timestamps in human-readable format
- Format code snippets using proper markdown
- Use bullet points for listing multiple items
`;

export function createGitHubToolsExport(config: GitHubConfig): ToolConfig {
  const service = new GitHubService(config);

  const tools: DynamicStructuredTool<any>[] = [
    new DynamicStructuredTool({
      name: 'search_github_prs',
      description: 'Search GitHub PRs based on status, keywords, and reporter',
      schema: z.object({
        repo: z.string().describe('The name of the repository to search in'),
        status: z.enum(['open', 'closed', 'merged']).describe('The status of PRs to search for'),
        keyword: z.string().describe('The keyword to search for in PR titles and descriptions'),
        reporter: z.string().describe('The GitHub username of the PR author')
      }),
      func: async (args: SearchPRsParams) => service.searchPRs(args)
    }),
    new DynamicStructuredTool({
      name: 'get_github_pr',
      description: 'Get detailed information about a specific GitHub PR by number',
      schema: z.object({
        repo: z.string().describe('The name of the repository containing the PR'),
        prNumber: z.number().describe('The number of the PR to fetch')
      }),
      func: async (args: { repo: string; prNumber: number }) => service.getPR(args.prNumber, args.repo)
    })
  ];


  return {
    tools,
    prompts: {
      toolSelection: GITHUB_TOOL_SELECTION_PROMPT,
      responseGeneration: GITHUB_RESPONSE_GENERATION_PROMPT
    }
  };
} 
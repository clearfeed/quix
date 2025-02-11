import { Tool, Tools, ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { GitHubService } from './index';
import { GitHubConfig, SearchPRsParams } from './types';

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

  const tools: ToolConfig['tools'] = [
    {
      type: 'function',
      function: {
        name: 'search_github_prs',
        description: 'Search GitHub PRs based on status, keywords, and reporter',
        parameters: {
          type: 'object',
          properties: {
            repo: {
              type: 'string',
              description: 'The name of the repository to search in'
            },
            status: {
              type: 'string',
              enum: ['open', 'closed', 'merged'],
              description: 'The status of PRs to search for'
            },
            keyword: {
              type: 'string',
              description: 'The keyword to search for in PR titles and descriptions'
            },
            reporter: {
              type: 'string',
              description: 'The GitHub username of the PR author'
            }
          },
          required: ['repo']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'get_github_pr',
        description: 'Get detailed information about a specific GitHub PR by number',
        parameters: {
          type: 'object',
          properties: {
            repo: {
              type: 'string',
              description: 'The name of the repository containing the PR'
            },
            prNumber: {
              type: 'number',
              description: 'The PR number to fetch'
            }
          },
          required: ['repo', 'prNumber']
        }
      }
    }
  ];

  const handlers = {
    search_github_prs: (args: SearchPRsParams) => service.searchPRs(args),
    get_github_pr: (args: { repo: string; prNumber: number }) => service.getPR(args.prNumber, args.repo)
  };

  return {
    tools,
    handlers,
    prompts: {
      toolSelection: GITHUB_TOOL_SELECTION_PROMPT,
      responseGeneration: GITHUB_RESPONSE_GENERATION_PROMPT
    }
  };
} 
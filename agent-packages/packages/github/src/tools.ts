import { GitHubService } from './index';
import { SearchPRsParams, SearchPRsResponse, GetPRResponse, GitHubConfig } from './types';

export interface GitHubTools {
  search_github_prs: {
    type: 'function';
    function: {
      name: 'search_github_prs';
      description: 'Search GitHub PRs based on status, keywords, and reporter';
      parameters: {
        type: 'object';
        properties: {
          repo: {
            type: 'string';
            description: 'The name of the repository to search in';
          };
          status: {
            type: 'string';
            description: 'The status of PRs to search for (e.g., open, closed, merged)';
          };
          keyword: {
            type: 'string';
            description: 'The keyword to search for in PR titles and descriptions';
          };
          reporter: {
            type: 'string';
            description: 'The GitHub username of the PR author';
          };
        };
        required: ['repo'];
      };
    };
    handler: (args: SearchPRsParams) => Promise<SearchPRsResponse>;
  };
  get_github_pr: {
    type: 'function';
    function: {
      name: 'get_github_pr';
      description: 'Get detailed information about a specific GitHub PR by number';
      parameters: {
        type: 'object';
        properties: {
          prNumber: {
            type: 'number';
            description: 'The PR number to fetch';
          };
          repo: {
            type: 'string';
            description: 'The name of the repository containing the PR';
          };
        };
        required: ['prNumber', 'repo'];
      };
    };
    handler: (args: { prNumber: number; repo: string }) => Promise<GetPRResponse>;
  };
}

export function createGitHubTools(config: GitHubConfig): GitHubTools {
  const service = new GitHubService(config);

  return {
    search_github_prs: {
      type: 'function',
      function: {
        name: 'search_github_prs',
        description: 'Search GitHub PRs based on status, keywords, and reporter',
        parameters: {
          type: 'object',
          properties: {
            repo: {
              type: 'string',
              description: 'The name of the repository to search in',
            },
            status: {
              type: 'string',
              description: 'The status of PRs to search for (e.g., open, closed, merged)',
            },
            keyword: {
              type: 'string',
              description: 'The keyword to search for in PR titles and descriptions',
            },
            reporter: {
              type: 'string',
              description: 'The GitHub username of the PR author',
            },
          },
          required: ['repo'],
        },
      },
      handler: (params) => service.searchPRs(params),
    },
    get_github_pr: {
      type: 'function',
      function: {
        name: 'get_github_pr',
        description: 'Get detailed information about a specific GitHub PR by number',
        parameters: {
          type: 'object',
          properties: {
            prNumber: {
              type: 'number',
              description: 'The PR number to fetch',
            },
            repo: {
              type: 'string',
              description: 'The name of the repository containing the PR',
            },
          },
          required: ['prNumber', 'repo'],
        },
      },
      handler: ({ prNumber, repo }) => service.getPR(prNumber, repo),
    },
  };
}

export function createGitHubToolsExport(config: GitHubConfig) {
  const tools = createGitHubTools(config);
  return {
    tools: Object.values(tools),
    handlers: Object.fromEntries(
      Object.entries(tools).map(([_, tool]) => [tool.function.name, tool.handler])
    ),
  };
} 
import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { GitHubService } from './index';
import { GitHubConfig, SearchIssuesParams } from './types';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { CodeSearchParams, CreateIssueParams } from './types/index';

const GITHUB_TOOL_SELECTION_PROMPT = `
For GitHub-related queries, consider using GitHub tools when the user wants to:
- Search for repositories or issues
- View pull request information
- Check commit history or branch status
- Access repository details and metadata
- View or manage GitHub issues
- PRs and Issues are interchangeable terms in GitHub
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
      name: 'search_github_issues',
      description: 'Search GitHub issues or PRs based on status, keywords, and reporter. PRs and Issues are interchangeable terms in GitHub',
      schema: z.object({
        repo: config.repo
          ? z.string().describe('Repository name to search issues or PRs in').optional().default(config.repo)
          : z.string().describe('Repository name to search issues or PRs in (required)'),
        owner: config.owner
          ? z.string().describe('Owner of the repository to search issues or PRs in').optional().default(config.owner)
          : z.string().describe('Owner of the repository to search issues or PRs in (required)'),
        type: z.enum(['issue', 'pull-request']).describe('The type of issue or PR to search for'),
        keyword: z.string().describe('The keyword to search for in issue or PR titles and descriptions'),
        reporter: z.string().describe('The GitHub username of the issue or PR author').optional(),
      }),
      func: async (args: SearchIssuesParams) => service.searchIssues(args)
    }),
    new DynamicStructuredTool({
      name: 'get_github_issue',
      description: 'Get detailed information about a specific GitHub issue or PR by number. PRs and Issues are interchangeable terms in GitHub',
      schema: z.object({
        repo: config.repo
          ? z.string().describe('Repository name from which the issue or PR should be retrieved').optional().default(config.repo)
          : z.string().describe('Repository name from which the issue or PR should be retrieved (required)'),
        owner: config.owner
          ? z.string().describe('Owner of the repository containing the issue or PR').optional().default(config.owner)
          : z.string().describe('Owner of the repository containing the issue or PR (required)'),
        issueNumber: z.number().describe('The number of the issue or PR to fetch. PRs and Issues are interchangeable terms in GitHub')
      }),
      func: async (args: { repo: string; owner: string, issueNumber: number }) => service.getIssue(args.issueNumber, { repo: args.repo, owner: args.owner })
    }),
    new DynamicStructuredTool({
      name: 'add_github_assignee',
      description: 'Add an assignee or assign someone to a GitHub issue or PR. PRs and Issues are interchangeable terms in GitHub',
      schema: z.object({
        repo: config.repo
          ? z.string().describe('Repository where the issue or PR exists for assigning a user').optional().default(config.repo)
          : z.string().describe('Repository where the issue or PR exists for assigning a user (required)'),
        owner: config.owner
          ? z.string().describe('Owner of the repository where the issue or PR exists').optional().default(config.owner)
          : z.string().describe('Owner of the repository where the issue or PR exists (required)'),
        issueNumber: z.number().describe('The number of the issue or PR to add the assignee to'),
        assignee: z.string().describe('The GitHub username of the assignee')
      }),
      func: async (args: { repo: string; owner: string; issueNumber: number; assignee: string }) => service.addAssigneeToIssue(args.issueNumber, args.assignee, { repo: args.repo, owner: args.owner })
    }),
    new DynamicStructuredTool({
      name: 'remove_github_assignee',
      description: 'Remove an assignee or unassign someone from a GitHub issue or PR. PRs and Issues are interchangeable terms in GitHub',
      schema: z.object({
        repo: config.repo
          ? z.string().describe('Repository where the issue or PR exists for removing an assignee').optional().default(config.repo)
          : z.string().describe('Repository where the issue or PR exists for removing an assignee (required)'),
        owner: config.owner
          ? z.string().describe('Owner of the repository where the issue or PR exists').optional().default(config.owner)
          : z.string().describe('Owner of the repository where the issue or PR exists (required)'),
        issueNumber: z.number().describe('The number of the issue or PR to remove the assignee from'),
        assignee: z.string().describe('The GitHub username of the assignee to remove')
      }),
      func: async (args: { repo: string; owner: string; issueNumber: number; assignee: string }) => service.removeAssigneeFromIssue(args.issueNumber, args.assignee, { repo: args.repo, owner: args.owner })
    }),
    new DynamicStructuredTool({
      name: 'get_github_users',
      description: 'Get all users in a GitHub organization',
      schema: z.object({
        owner: config.owner
          ? z.string().describe('Github Organizarion name').optional().default(config.owner)
          : z.string().describe('Github Organizarion name (required)'),
      }),
      func: async (args: { owner: string }) => service.getUsers(args.owner)
    }),
    new DynamicStructuredTool({
      name: 'create_github_issue',
      description: 'Creates an issue in a GitHub repository',
      schema: z.object({
        repo: config.repo
          ? z.string().describe('The GitHub repository name where issue will be created').optional().default(config.repo)
          : z.string().describe('The GitHub repository name where issue will be created (required)'),
        owner: config.owner
          ? z.string().describe('The owner of the repository').optional().default(config.owner)
          : z.string().describe('The owner of the repository (requied)'),
        title: z.string().describe('The title of the issue'),
        description: z.string().optional().describe('The description of the issue'),
      }),
      func: async (params: CreateIssueParams) =>
        service.createIssue(params),
    }),
    new DynamicStructuredTool({
      name: 'search_github_code',
      description: 'Find implementation details, function definitions, or code snippets in a GitHub repository by searching with natural language or keywords.',
      schema: z.object({
        repo: config?.repo
          ? z.string().describe('The name of the GitHub repository to search in').optional().default(config.repo)
          : z.string().describe('The name of the GitHub repository to search in (required)'),
        owner: config?.owner
          ? z.string().describe('The owner of the GitHub repository').optional().default(config.owner)
          : z.string().describe('The owner of the GitHub repository (required)'),
        query: z.string().describe('The keyword to search for in code files within the repository')
      }),
      func: async (params: CodeSearchParams) => service.searchCode(params)
    }),
  ];

  return {
    tools,
    prompts: {
      toolSelection: GITHUB_TOOL_SELECTION_PROMPT,
      responseGeneration: GITHUB_RESPONSE_GENERATION_PROMPT
    }
  };
}
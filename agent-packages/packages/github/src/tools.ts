import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { GitHubService } from './index';
import { GitHubConfig } from './types';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

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

const searchIssuesSchema = z.object({
  repo: z.string().describe('The name of the repository to search in'),
  type: z.enum(['issue', 'pull-request']).describe('The type of issue or PR to search for'),
  keyword: z.string().describe('The keyword to search for in issue or PR titles and descriptions'),
  reporter: z.string().describe('The GitHub username of the issue or PR author').optional(),
});

const getIssueSchema = z.object({
  repo: z.string().describe('The name of the repository containing the issue'),
  issueNumber: z.number().describe('The number of the issue or PR to fetch. PRs and Issues are interchangeable terms in GitHub')
});

const addAssigneeSchema = z.object({
  repo: z.string().describe('The name of the repository containing the issue or PR'),
  issueNumber: z.number().describe('The number of the issue or PR to add the assignee to'),
  assignee: z.string().describe('The GitHub username of the assignee')
});

const removeAssigneeSchema = z.object({
  repo: z.string().describe('The name of the repository containing the issue or PR'),
  issueNumber: z.number().describe('The number of the issue or PR to remove the assignee from'),
  assignee: z.string().describe('The GitHub username of the assignee to remove')
});

const getUsersSchema = z.object({});

export function createGitHubToolsExport(config: GitHubConfig): ToolConfig {
  const service = new GitHubService(config);

  const tools: DynamicStructuredTool<any>[] = [
    new DynamicStructuredTool({
      name: 'search_github_issues',
      description: 'Search GitHub issues or PRs based on status, keywords, and reporter. PRs and Issues are interchangeable terms in GitHub',
      schema: searchIssuesSchema,
      func: async (args: z.infer<typeof searchIssuesSchema>) => service.searchIssues(args)
    }),
    new DynamicStructuredTool({
      name: 'get_github_issue',
      description: 'Get detailed information about a specific GitHub issue or PR by number. PRs and Issues are interchangeable terms in GitHub',
      schema: getIssueSchema,
      func: async (args: z.infer<typeof getIssueSchema>) => service.getIssue(args.issueNumber, args.repo)
    }),
    new DynamicStructuredTool({
      name: 'add_github_assignee',
      description: 'Add an assignee or assign someone to a GitHub issue or PR. PRs and Issues are interchangeable terms in GitHub',
      schema: addAssigneeSchema,
      func: async (args: z.infer<typeof addAssigneeSchema>) => service.addAssigneeToIssue(args.issueNumber, args.repo, args.assignee)
    }),
    new DynamicStructuredTool({
      name: 'remove_github_assignee',
      description: 'Remove an assignee or unassign someone from a GitHub issue or PR. PRs and Issues are interchangeable terms in GitHub',
      schema: removeAssigneeSchema,
      func: async (args: z.infer<typeof removeAssigneeSchema>) => service.removeAssigneeFromIssue(args.issueNumber, args.repo, args.assignee)
    }),
    new DynamicStructuredTool({
      name: 'get_github_users',
      description: 'Get all users in a GitHub organization',
      schema: getUsersSchema,
      func: async (args: z.infer<typeof getUsersSchema>) => service.getUsers()
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
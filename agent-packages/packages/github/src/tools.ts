import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { GitHubService } from './index';
import {
  GitHubConfig,
  SearchIssuesParams,
  CreateOrUpdateFileParams,
  SearchRepositoriesParams,
  CreateRepositoryParams,
  GetFileContentsParams,
  CreatePullRequestParams,
  CreateBranchParams,
  ListCommitsParams,
  ListIssuesParams,
  UpdateIssueParams,
  AddIssueCommentParams,
  SearchUsersParams,
  PullRequestParams,
  ListPullRequestsParams,
  CreatePullRequestReviewParams,
  MergePullRequestParams,
  UpdatePullRequestBranchParams,
  SearchCodeParams,
  SearchIssuesGlobalParams
} from './types';
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
      name: 'search_repository_issues',
      description:
        'Search issues or PRs within a specific repository based on status, keywords, and reporter',
      schema: z.object({
        repo: config.repo
          ? z
              .string()
              .describe(
                'Name of the repository to search in. This identifies which project to look for issues/PRs'
              )
              .optional()
              .default(config.repo)
          : z
              .string()
              .describe(
                'Name of the repository to search in. This identifies which project to look for issues/PRs (required)'
              ),
        owner: config.owner
          ? z
              .string()
              .describe(
                'Username or organization that owns the repository. This is the first part of the repository URL'
              )
              .optional()
              .default(config.owner)
          : z
              .string()
              .describe(
                'Username or organization that owns the repository. This is the first part of the repository URL (required)'
              ),
        type: z
          .enum(['issue', 'pull-request'])
          .describe(
            'Specify whether to search for issues or pull requests. Both are tracked the same way in GitHub'
          ),
        keyword: z
          .string()
          .describe(
            'Text to search for in issue titles and descriptions. Can include multiple words or phrases'
          ),
        reporter: z
          .string()
          .describe(
            'GitHub username of the person who created the issue/PR. Filters results to show only their submissions'
          )
          .optional(),
        status: z
          .enum(['open', 'closed'])
          .describe('Filter issues by their status (open or closed)')
          .optional()
      }),
      func: async (args: SearchIssuesParams) => service.searchIssues(args)
    }),
    new DynamicStructuredTool({
      name: 'get_github_issue',
      description:
        'Get detailed information about a specific GitHub issue or PR by number. PRs and Issues are interchangeable terms in GitHub',
      schema: z.object({
        repo: config.repo
          ? z
              .string()
              .describe('Repository name from which the issue or PR should be retrieved')
              .optional()
              .default(config.repo)
          : z
              .string()
              .describe(
                'Repository name from which the issue or PR should be retrieved (required)'
              ),
        owner: config.owner
          ? z
              .string()
              .describe('Owner of the repository containing the issue or PR')
              .optional()
              .default(config.owner)
          : z.string().describe('Owner of the repository containing the issue or PR (required)'),
        issueNumber: z
          .number()
          .describe(
            'The number of the issue or PR to fetch. PRs and Issues are interchangeable terms in GitHub'
          )
      }),
      func: async (args: { repo: string; owner: string; issueNumber: number }) =>
        service.getIssue(args.issueNumber, { repo: args.repo, owner: args.owner })
    }),
    new DynamicStructuredTool({
      name: 'add_github_assignee',
      description:
        'Add an assignee or assign someone to a GitHub issue or PR. PRs and Issues are interchangeable terms in GitHub',
      schema: z.object({
        repo: config.repo
          ? z
              .string()
              .describe('Repository where the issue or PR exists for assigning a user')
              .optional()
              .default(config.repo)
          : z
              .string()
              .describe('Repository where the issue or PR exists for assigning a user (required)'),
        owner: config.owner
          ? z
              .string()
              .describe('Owner of the repository where the issue or PR exists')
              .optional()
              .default(config.owner)
          : z.string().describe('Owner of the repository where the issue or PR exists (required)'),
        issueNumber: z.number().describe('The number of the issue or PR to add the assignee to'),
        assignee: z.string().describe('The GitHub username of the assignee')
      }),
      func: async (args: { repo: string; owner: string; issueNumber: number; assignee: string }) =>
        service.addAssigneeToIssue(args.issueNumber, args.assignee, {
          repo: args.repo,
          owner: args.owner
        })
    }),
    new DynamicStructuredTool({
      name: 'remove_github_assignee',
      description:
        'Remove an assignee or unassign someone from a GitHub issue or PR. PRs and Issues are interchangeable terms in GitHub',
      schema: z.object({
        repo: config.repo
          ? z
              .string()
              .describe('Repository where the issue or PR exists for removing an assignee')
              .optional()
              .default(config.repo)
          : z
              .string()
              .describe(
                'Repository where the issue or PR exists for removing an assignee (required)'
              ),
        owner: config.owner
          ? z
              .string()
              .describe('Owner of the repository where the issue or PR exists')
              .optional()
              .default(config.owner)
          : z.string().describe('Owner of the repository where the issue or PR exists (required)'),
        issueNumber: z
          .number()
          .describe('The number of the issue or PR to remove the assignee from'),
        assignee: z.string().describe('The GitHub username of the assignee to remove')
      }),
      func: async (args: { repo: string; owner: string; issueNumber: number; assignee: string }) =>
        service.removeAssigneeFromIssue(args.issueNumber, args.assignee, {
          repo: args.repo,
          owner: args.owner
        })
    }),
    new DynamicStructuredTool({
      name: 'get_github_users',
      description: 'Get all users in a GitHub organization',
      schema: z.object({
        owner: config.owner
          ? z.string().describe('Github Organizarion name').optional().default(config.owner)
          : z.string().describe('Github Organizarion name (required)')
      }),
      func: async (args: { owner: string }) => service.getUsers(args.owner)
    }),
    new DynamicStructuredTool({
      name: 'create_github_issue',
      description: 'Creates an issue in a GitHub repository',
      schema: z.object({
        repo: config.repo
          ? z
              .string()
              .describe('The GitHub repository name where issue will be created')
              .optional()
              .default(config.repo)
          : z
              .string()
              .describe('The GitHub repository name where issue will be created (required)'),
        owner: config.owner
          ? z.string().describe('The owner of the repository').optional().default(config.owner)
          : z.string().describe('The owner of the repository (requied)'),
        title: z.string().describe('The title of the issue'),
        description: z.string().optional().describe('The description of the issue')
      }),
      func: async (params: CreateIssueParams) => service.createIssue(params)
    }),
    new DynamicStructuredTool({
      name: 'search_repository_code',
      description:
        'Search for code within a specific repository using natural language or keywords',
      schema: z.object({
        repo: config?.repo
          ? z
              .string()
              .describe('The name of the GitHub repository to search in')
              .optional()
              .default(config.repo)
          : z.string().describe('The name of the GitHub repository to search in (required)'),
        owner: config?.owner
          ? z
              .string()
              .describe('The owner of the GitHub repository')
              .optional()
              .default(config.owner)
          : z.string().describe('The owner of the GitHub repository (required)'),
        query: z.string().describe('The keyword to search for in code files within the repository')
      }),
      func: async (params: CodeSearchParams) => service.searchCode(params)
    }),
    new DynamicStructuredTool({
      name: 'create_or_update_file',
      description: 'Create a new file or update an existing file in a GitHub repository',
      schema: z.object({
        owner: config.owner
          ? z
              .string()
              .describe('Username or organization that owns the repository')
              .optional()
              .default(config.owner)
          : z.string().describe('Username or organization that owns the repository'),
        repo: config.repo
          ? z
              .string()
              .describe('Name of the repository where the file will be created/updated')
              .optional()
              .default(config.repo)
          : z.string().describe('Name of the repository where the file will be created/updated'),
        path: z
          .string()
          .describe(
            'Full path to the file in the repository, including filename and extension (e.g., "docs/README.md")'
          ),
        content: z
          .string()
          .describe(
            'The actual content to write to the file. For text files, this is the text content; for binary files, base64 encoded content'
          ),
        message: z
          .string()
          .describe('Git commit message describing what changes were made and why'),
        branch: z
          .string()
          .describe(
            'Name of the branch where the file should be created/updated (e.g., "main", "feature/new-docs")'
          ),
        sha: z
          .string()
          .describe(
            'The SHA hash of the file being replaced. Required when updating an existing file, omit when creating new'
          )
          .optional()
      }),
      func: async (params: CreateOrUpdateFileParams) => service.createOrUpdateFile(params)
    }),
    new DynamicStructuredTool({
      name: 'search_repositories',
      description: 'Search for GitHub repositories',
      schema: z.object({
        query: z.string().describe('Search query'),
        page: z.number().optional()
      }),
      func: async (params: SearchRepositoriesParams) => service.searchRepositories(params)
    }),
    new DynamicStructuredTool({
      name: 'create_repository',
      description: 'Create a new GitHub repository',
      schema: z.object({
        name: z
          .string()
          .describe(
            'Name for the new repository. Should be URL-friendly, using letters, numbers, hyphens'
          ),
        description: z
          .string()
          .describe(
            "A short description of what this repository is for. Helps others understand the project's purpose"
          )
          .optional(),
        private: z
          .boolean()
          .describe(
            'Whether the repository should be private (true) or public (false). Private repos are only visible to you and collaborators'
          )
          .optional(),
        autoInit: z
          .boolean()
          .describe(
            'Whether to initialize with a README file. Recommended true for new projects to provide initial documentation'
          )
          .optional()
      }),
      func: async (params: CreateRepositoryParams) => service.createRepository(params)
    }),
    new DynamicStructuredTool({
      name: 'get_file_contents',
      description: 'Get contents of a file or directory from a GitHub repository',
      schema: z.object({
        owner: config.owner ? z.string().optional().default(config.owner) : z.string(),
        repo: config.repo ? z.string().optional().default(config.repo) : z.string(),
        path: z.string().describe('Path to file/directory'),
        branch: z.string().optional()
      }),
      func: async (params: GetFileContentsParams) => service.getFileContents(params)
    }),
    new DynamicStructuredTool({
      name: 'create_pull_request',
      description: 'Create a new pull request to propose and collaborate on changes',
      schema: z.object({
        owner: config.owner
          ? z
              .string()
              .describe('Username or organization that owns the repository')
              .optional()
              .default(config.owner)
          : z.string().describe('Username or organization that owns the repository'),
        repo: config.repo
          ? z
              .string()
              .describe('Name of the repository where the PR will be created')
              .optional()
              .default(config.repo)
          : z.string().describe('Name of the repository where the PR will be created'),
        title: z
          .string()
          .describe('Clear, descriptive title for the pull request that summarizes the changes'),
        head: z
          .string()
          .describe('Name of the branch containing your changes (e.g., "feature/new-feature")'),
        base: z
          .string()
          .describe(
            'Name of the branch you want to merge changes into, typically "main" or "master"'
          ),
        body: z
          .string()
          .describe('Detailed description of the changes, explaining what was changed and why')
          .optional(),
        draft: z
          .boolean()
          .describe(
            'Whether to create as a draft PR (true) or regular PR (false). Draft PRs cannot be merged'
          )
          .optional(),
        maintainer_can_modify: z
          .boolean()
          .describe(
            'Allow repository maintainers to modify your PR branch. Recommended true for collaboration'
          )
          .optional()
          .default(true)
      }),
      func: async (params: CreatePullRequestParams) => service.createPullRequest(params)
    }),
    new DynamicStructuredTool({
      name: 'create_branch',
      description: 'Create a new branch in a GitHub repository',
      schema: z.object({
        owner: config.owner ? z.string().optional().default(config.owner) : z.string(),
        repo: config.repo ? z.string().optional().default(config.repo) : z.string(),
        branch: z.string().describe('Name for the new branch'),
        from_branch: z.string().optional()
      }),
      func: async (params: CreateBranchParams) => service.createBranch(params)
    }),
    new DynamicStructuredTool({
      name: 'list_commits',
      description: 'Get list of commits of a branch',
      schema: z.object({
        owner: config.owner ? z.string().optional().default(config.owner) : z.string(),
        repo: config.repo ? z.string().optional().default(config.repo) : z.string(),
        sha: z.string().optional(),
        page: z.number().optional(),
        perPage: z
          .number()
          .int('Page size must be an integer')
          .min(1, 'Page size must be at least 1')
          .max(100, 'GitHub API limits page size to maximum of 100')
          .describe('Number of items per page (min: 1, max: 100)')
          .optional()
      }),
      func: async (params: ListCommitsParams) => service.listCommits(params)
    }),
    new DynamicStructuredTool({
      name: 'list_issues',
      description: 'List and filter issues in a GitHub repository',
      schema: z.object({
        owner: config.owner
          ? z
              .string()
              .describe('Username or organization that owns the repository')
              .optional()
              .default(config.owner)
          : z.string().describe('Username or organization that owns the repository'),
        repo: config.repo
          ? z
              .string()
              .describe('Name of the repository to list issues from')
              .optional()
              .default(config.repo)
          : z.string().describe('Name of the repository to list issues from'),
        state: z
          .enum(['open', 'closed', 'all'])
          .describe('Filter issues by their state: open, closed, or all')
          .optional(),
        sort: z
          .enum(['created', 'updated', 'comments'])
          .describe('How to sort issues: by creation date, last update, or number of comments')
          .optional(),
        direction: z
          .enum(['asc', 'desc'])
          .describe('Sort direction: ascending (oldest first) or descending (newest first)')
          .optional(),
        since: z
          .string()
          .describe('ISO 8601 timestamp to filter issues updated after this date')
          .optional(),
        page: z.number().describe('Page number for pagination, starting at 1').optional(),
        per_page: z
          .number()
          .int('Page size must be an integer')
          .min(1, 'Page size must be at least 1')
          .max(100, 'GitHub API limits page size to maximum of 100')
          .describe('Number of items per page (min: 1, max: 100)')
          .optional(),
        labels: z
          .array(z.string())
          .describe('Filter issues by label names (e.g., ["bug", "high-priority"])')
          .optional()
      }),
      func: async (params: ListIssuesParams) => service.listIssues(params)
    }),
    new DynamicStructuredTool({
      name: 'update_issue',
      description: 'Update an existing issue in a GitHub repository',
      schema: z.object({
        owner: config.owner
          ? z
              .string()
              .describe('Username or organization that owns the repository')
              .optional()
              .default(config.owner)
          : z.string().describe('Username or organization that owns the repository'),
        repo: config.repo
          ? z
              .string()
              .describe('Name of the repository containing the issue')
              .optional()
              .default(config.repo)
          : z.string().describe('Name of the repository containing the issue'),
        issue_number: z.number().describe('The issue number to update (e.g., 123)'),
        title: z.string().describe('New title for the issue').optional(),
        body: z.string().describe('New description/content for the issue').optional(),
        state: z
          .enum(['open', 'closed'])
          .describe('Change issue state to open or closed')
          .optional(),
        assignees: z
          .array(z.string())
          .describe('New list of GitHub usernames to assign (replaces existing assignees)')
          .optional(),
        labels: z
          .array(z.string())
          .describe('New list of labels to apply (replaces existing labels)')
          .optional(),
        milestone: z
          .number()
          .describe('New milestone number to associate with the issue')
          .optional()
      }),
      func: async (params: UpdateIssueParams) => service.updateIssue(params)
    }),
    new DynamicStructuredTool({
      name: 'add_issue_comment',
      description: 'Add a comment to an existing issue or pull request',
      schema: z.object({
        owner: config.owner
          ? z
              .string()
              .describe('Username or organization that owns the repository')
              .optional()
              .default(config.owner)
          : z.string().describe('Username or organization that owns the repository'),
        repo: config.repo
          ? z
              .string()
              .describe('Name of the repository containing the issue')
              .optional()
              .default(config.repo)
          : z.string().describe('Name of the repository containing the issue'),
        issue_number: z.number().describe('The issue or PR number to comment on (e.g., 123)'),
        body: z.string().describe('The comment text to add. Can include markdown formatting')
      }),
      func: async (params: AddIssueCommentParams) => service.addIssueComment(params)
    }),
    new DynamicStructuredTool({
      name: 'search_users',
      description: 'Search for GitHub users by username, name, or other criteria',
      schema: z.object({
        q: z
          .string()
          .describe(
            'Search query using GitHub user search syntax. Can include location:, language:, followers:, or other qualifiers'
          ),
        sort: z
          .enum(['followers', 'repositories', 'joined'])
          .describe('Sort users by: number of followers, number of repositories, or join date')
          .optional(),
        order: z
          .enum(['asc', 'desc'])
          .describe(
            'Sort order: ascending (lowest/oldest first) or descending (highest/newest first)'
          )
          .optional(),
        page: z.number().describe('Page number for pagination, starting at 1').optional(),
        per_page: z
          .number()
          .int('Page size must be an integer')
          .min(1, 'Page size must be at least 1')
          .max(100, 'GitHub API limits page size to maximum of 100')
          .describe('Number of users per page (min: 1, max: 100)')
          .optional()
      }),
      func: async (params: SearchUsersParams) => service.searchUsers(params)
    }),
    new DynamicStructuredTool({
      name: 'get_pull_request',
      description: 'Get details of a specific pull request',
      schema: z.object({
        owner: config.owner ? z.string().optional().default(config.owner) : z.string(),
        repo: config.repo ? z.string().optional().default(config.repo) : z.string(),
        pull_number: z.number()
      }),
      func: async (params: PullRequestParams) => service.getPullRequest(params)
    }),
    new DynamicStructuredTool({
      name: 'list_pull_requests',
      description: 'List and filter repository pull requests',
      schema: z.object({
        owner: config.owner ? z.string().optional().default(config.owner) : z.string(),
        repo: config.repo ? z.string().optional().default(config.repo) : z.string(),
        state: z.enum(['open', 'closed', 'all']).optional(),
        head: z.string().optional(),
        base: z.string().optional(),
        sort: z.enum(['created', 'updated', 'popularity', 'long-running']).optional(),
        direction: z.enum(['asc', 'desc']).optional(),
        per_page: z
          .number()
          .int('Page size must be an integer')
          .min(1, 'Page size must be at least 1')
          .max(100, 'GitHub API limits page size to maximum of 100')
          .describe('Number of items per page (min: 1, max: 100)')
          .optional(),
        page: z.number().optional()
      }),
      func: async (params: ListPullRequestsParams) => service.listPullRequests(params)
    }),
    new DynamicStructuredTool({
      name: 'create_pull_request_review',
      description: 'Create a review on a pull request with comments and approval status',
      schema: z.object({
        owner: config.owner
          ? z
              .string()
              .describe('Username or organization that owns the repository')
              .optional()
              .default(config.owner)
          : z.string().describe('Username or organization that owns the repository'),
        repo: config.repo
          ? z
              .string()
              .describe('Name of the repository containing the PR')
              .optional()
              .default(config.repo)
          : z.string().describe('Name of the repository containing the PR'),
        pull_number: z.number().describe('The pull request number to review (e.g., 123)'),
        body: z.string().describe('Overall review comment explaining your feedback or decision'),
        event: z
          .enum(['APPROVE', 'REQUEST_CHANGES', 'COMMENT'])
          .describe(
            'Type of review: APPROVE to accept changes, REQUEST_CHANGES to request modifications, COMMENT for neutral feedback'
          ),
        commit_id: z
          .string()
          .describe(
            'Specific commit SHA to attach the review to. Usually the latest commit in the PR'
          )
          .optional(),
        comments: z
          .array(
            z.object({
              path: z
                .string()
                .describe('File path where the comment applies (e.g., "src/main.js")'),
              position: z.number().describe('Line number in the file where the comment applies'),
              body: z.string().describe('The actual comment text for this specific line')
            })
          )
          .describe('Line-specific comments to add to the review')
          .optional()
      }),
      func: async (params: CreatePullRequestReviewParams) => service.createPullRequestReview(params)
    }),
    new DynamicStructuredTool({
      name: 'merge_pull_request',
      description: 'Merge a pull request into its base branch',
      schema: z.object({
        owner: config.owner
          ? z
              .string()
              .describe('Username or organization that owns the repository')
              .optional()
              .default(config.owner)
          : z.string().describe('Username or organization that owns the repository'),
        repo: config.repo
          ? z
              .string()
              .describe('Name of the repository containing the PR')
              .optional()
              .default(config.repo)
          : z.string().describe('Name of the repository containing the PR'),
        pull_number: z.number().describe('The pull request number to merge (e.g., 123)'),
        commit_title: z
          .string()
          .describe('Title for the merge commit. If not provided, GitHub will generate one')
          .optional(),
        commit_message: z
          .string()
          .describe('Additional details for the merge commit message')
          .optional(),
        merge_method: z
          .enum(['merge', 'squash', 'rebase'])
          .describe(
            'How to merge: "merge" creates merge commit, "squash" combines all commits, "rebase" adds commits individually'
          )
          .optional()
      }),
      func: async (params: MergePullRequestParams) => service.mergePullRequest(params)
    }),
    new DynamicStructuredTool({
      name: 'search_code_global',
      description:
        'Search for code across all public GitHub repositories using keywords, file paths, or language',
      schema: z.object({
        q: z
          .string()
          .describe(
            'Search query using GitHub code search syntax. Can include filename:, language:, repo:, or other qualifiers'
          ),
        order: z
          .enum(['asc', 'desc'])
          .describe('Sort order: ascending (oldest first) or descending (newest first)')
          .optional(),
        page: z.number().describe('Page number for pagination, starting at 1').optional(),
        per_page: z
          .number()
          .int('Page size must be an integer')
          .min(1, 'Page size must be at least 1')
          .max(100, 'GitHub API limits page size to maximum of 100')
          .describe('Number of results per page (min: 1, max: 100)')
          .optional()
      }),
      func: async (params: SearchCodeParams) => service.searchCodeGlobal(params)
    }),
    new DynamicStructuredTool({
      name: 'search_issues_global',
      description: 'Search for issues and pull requests across all GitHub repositories',
      schema: z.object({
        q: z
          .string()
          .describe(
            'Search query using GitHub issues search syntax. Can include is:issue/pr, state:open/closed, label:name, etc.'
          ),
        sort: z
          .enum(['comments', 'reactions', 'created', 'updated'])
          .describe('Sort by: number of comments, reactions, creation date, or last update')
          .optional(),
        order: z
          .enum(['asc', 'desc'])
          .describe('Sort order: ascending (oldest/least first) or descending (newest/most first)')
          .optional(),
        page: z.number().describe('Page number for pagination, starting at 1').optional(),
        per_page: z
          .number()
          .int('Page size must be an integer')
          .min(1, 'Page size must be at least 1')
          .max(100, 'GitHub API limits page size to maximum of 100')
          .describe('Number of results per page (min: 1, max: 100)')
          .optional()
      }),
      func: async (params: SearchIssuesGlobalParams) => service.searchIssuesGlobal(params)
    }),
    new DynamicStructuredTool({
      name: 'get_pull_request_status',
      description: 'Get the combined status of all status checks for a pull request',
      schema: z.object({
        owner: config.owner
          ? z
              .string()
              .describe('Username or organization that owns the repository')
              .optional()
              .default(config.owner)
          : z.string().describe('Username or organization that owns the repository'),
        repo: config.repo
          ? z
              .string()
              .describe('Name of the repository containing the PR')
              .optional()
              .default(config.repo)
          : z.string().describe('Name of the repository containing the PR'),
        pull_number: z.number().describe('The pull request number to get status for (e.g., 123)')
      }),
      func: async (params: PullRequestParams) => service.getPullRequestStatus(params)
    }),
    new DynamicStructuredTool({
      name: 'get_pull_request_files',
      description: 'Get the list of files changed in a pull request',
      schema: z.object({
        owner: config.owner
          ? z
              .string()
              .describe('Username or organization that owns the repository')
              .optional()
              .default(config.owner)
          : z.string().describe('Username or organization that owns the repository'),
        repo: config.repo
          ? z
              .string()
              .describe('Name of the repository containing the PR')
              .optional()
              .default(config.repo)
          : z.string().describe('Name of the repository containing the PR'),
        pull_number: z
          .number()
          .describe('The pull request number to get changed files for (e.g., 123)')
      }),
      func: async (params: PullRequestParams) => service.getPullRequestFiles(params)
    }),
    new DynamicStructuredTool({
      name: 'get_pull_request_comments',
      description: 'Get the review comments on a pull request',
      schema: z.object({
        owner: config.owner
          ? z
              .string()
              .describe('Username or organization that owns the repository')
              .optional()
              .default(config.owner)
          : z.string().describe('Username or organization that owns the repository'),
        repo: config.repo
          ? z
              .string()
              .describe('Name of the repository containing the PR')
              .optional()
              .default(config.repo)
          : z.string().describe('Name of the repository containing the PR'),
        pull_number: z.number().describe('The pull request number to get comments for (e.g., 123)')
      }),
      func: async (params: PullRequestParams) => service.getPullRequestComments(params)
    }),
    new DynamicStructuredTool({
      name: 'get_pull_request_reviews',
      description: 'Get the reviews on a pull request',
      schema: z.object({
        owner: config.owner
          ? z
              .string()
              .describe('Username or organization that owns the repository')
              .optional()
              .default(config.owner)
          : z.string().describe('Username or organization that owns the repository'),
        repo: config.repo
          ? z
              .string()
              .describe('Name of the repository containing the PR')
              .optional()
              .default(config.repo)
          : z.string().describe('Name of the repository containing the PR'),
        pull_number: z.number().describe('The pull request number to get reviews for (e.g., 123)')
      }),
      func: async (params: PullRequestParams) => service.getPullRequestReviews(params)
    }),
    new DynamicStructuredTool({
      name: 'update_pull_request_branch',
      description: 'Update a pull request branch with latest changes from base branch',
      schema: z.object({
        owner: config.owner
          ? z
              .string()
              .describe('Username or organization that owns the repository')
              .optional()
              .default(config.owner)
          : z.string().describe('Username or organization that owns the repository'),
        repo: config.repo
          ? z
              .string()
              .describe('Name of the repository containing the PR')
              .optional()
              .default(config.repo)
          : z.string().describe('Name of the repository containing the PR'),
        pull_number: z.number().describe('The pull request number to update (e.g., 123)'),
        expected_head_sha: z
          .string()
          .describe("Expected SHA of the PR's HEAD ref. Used to ensure the branch hasn't changed")
          .optional()
      }),
      func: async (params: UpdatePullRequestBranchParams) => service.updatePullRequestBranch(params)
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

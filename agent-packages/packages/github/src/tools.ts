import { ToolConfig, ToolOperation, tool, Tool } from '@clearfeed-ai/quix-common-agent';
import { GitHubService } from './index';
import {
  GitHubConfig,
  CreateOrUpdateFileParams,
  SearchRepositoriesParams,
  CreateRepositoryParams,
  GetFileContentsParams,
  CreatePullRequestParams,
  CreateBranchParams,
  ListCommitsParams,
  UpdateIssueParams,
  AddIssueCommentParams,
  SearchUsersParams,
  PullRequestParams,
  CreatePullRequestReviewParams,
  MergePullRequestParams,
  UpdatePullRequestBranchParams,
  SearchIssuesOrPullRequestsParams,
  SearchIssuesGlobalParams,
  GetGithubIssueParams,
  AddGithubAssigneeParams,
  RemoveGithubAssigneeParams,
  GetOrganizationUsersParams,
  CreateGithubIssueParams,
  SearchCodeGlobalParams,
  GetPullRequestStatusParams,
  GetPullRequestFilesParams,
  GetPullRequestCommentsParams,
  GetPullRequestReviewsParams,
  SearchRepositoryCodeParams
} from './types';
import {
  baseSearchIssuesOrPullRequestsSchema,
  searchIssuesOrPullRequestsSchema,
  getGithubIssueSchema,
  addGithubAssigneeSchema,
  removeGithubAssigneeSchema,
  getOrganizationUsersSchema,
  createGithubIssueSchema,
  searchRepositoryCodeSchema,
  createOrUpdateFileSchema,
  searchRepositoriesSchema,
  createRepositorySchema,
  getFileContentsSchema,
  createPullRequestSchema,
  createBranchSchema,
  listCommitsSchema,
  updateIssueSchema,
  addIssueCommentSchema,
  searchGithubUsersSchema,
  getPullRequestSchema,
  createPullRequestReviewSchema,
  mergePullRequestSchema,
  searchCodeGlobalSchema,
  getPullRequestStatusSchema,
  getPullRequestFilesSchema,
  getPullRequestCommentsSchema,
  getPullRequestReviewsSchema,
  updatePullRequestBranchSchema
} from './schema';

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

export async function createGitHubToolsExport(config: GitHubConfig): Promise<ToolConfig> {
  const service = await GitHubService.create(config);

  const tools: Tool[] = [
    tool({
      name: 'search_issues_or_pull_requests',
      description:
        'Search issues or PRs within a specific repository based on status, keywords, and reporter',
      schema: searchIssuesOrPullRequestsSchema(config),
      operation: [ToolOperation.READ],
      func: async (args: SearchIssuesOrPullRequestsParams) => {
        return service.searchIssuesOrPullRequests(args);
      }
    }),
    tool({
      name: 'get_github_issue',
      description:
        'Get detailed information about a specific GitHub issue or PR by number. PRs and Issues are interchangeable terms in GitHub',
      schema: getGithubIssueSchema(config),
      operation: [ToolOperation.READ],
      func: async (args: GetGithubIssueParams) => {
        return service.getIssue(args.issueNumber, {
          repo: args.repo,
          owner: args.owner
        });
      }
    }),
    tool({
      name: 'add_github_assignee',
      description:
        'Add an assignee or assign someone to a GitHub issue or PR. PRs and Issues are interchangeable terms in GitHub',
      schema: addGithubAssigneeSchema(config),
      operation: [ToolOperation.UPDATE],
      func: async (args: AddGithubAssigneeParams) => {
        return service.addAssigneeToIssue(args.issueNumber, args.assignee, {
          repo: args.repo,
          owner: args.owner
        });
      }
    }),
    tool({
      name: 'remove_github_assignee',
      description:
        'Remove an assignee or unassign someone from a GitHub issue or PR. PRs and Issues are interchangeable terms in GitHub',
      schema: removeGithubAssigneeSchema(config),
      operation: [ToolOperation.UPDATE],
      func: async (args: RemoveGithubAssigneeParams) => {
        return service.removeAssigneeFromIssue(args.issueNumber, args.assignee, {
          repo: args.repo,
          owner: args.owner
        });
      }
    }),
    tool({
      name: 'get_organization_users',
      description: 'Get all users in a GitHub organization',
      schema: getOrganizationUsersSchema(config),
      operation: [ToolOperation.READ],
      func: async (args: GetOrganizationUsersParams) => {
        return service.getOrganizationUsers(args.owner);
      }
    }),
    tool({
      name: 'create_github_issue',
      description: 'Creates an issue in a GitHub repository',
      schema: createGithubIssueSchema(config),
      operation: [ToolOperation.CREATE],
      func: async (args: CreateGithubIssueParams) => service.createIssue(args)
    }),
    tool({
      name: 'search_repository_code',
      description:
        'Search for code within a specific repository using natural language or keywords',
      schema: searchRepositoryCodeSchema(config),
      operation: [ToolOperation.READ],
      func: async (args: SearchRepositoryCodeParams) => service.searchCode(args)
    }),
    tool({
      name: 'create_or_update_file',
      description: 'Create a new file or update an existing file in a GitHub repository',
      schema: createOrUpdateFileSchema(config),
      operation: [ToolOperation.CREATE, ToolOperation.UPDATE],
      func: async (args: CreateOrUpdateFileParams) => service.createOrUpdateFile(args)
    }),
    tool({
      name: 'search_repositories',
      description: 'Search for GitHub repositories',
      schema: searchRepositoriesSchema,
      operation: [ToolOperation.READ],
      func: async (args: SearchRepositoriesParams) => service.searchRepositories(args)
    }),
    tool({
      name: 'create_repository',
      description: 'Create a new GitHub repository',
      schema: createRepositorySchema,
      operation: [ToolOperation.CREATE],
      func: async (args: CreateRepositoryParams) => service.createRepository(args)
    }),
    tool({
      name: 'get_file_contents',
      description: 'Get contents of a file or directory from a GitHub repository',
      schema: getFileContentsSchema(config),
      operation: [ToolOperation.READ],
      func: async (args: GetFileContentsParams) => service.getFileContents(args)
    }),
    tool({
      name: 'create_pull_request',
      description: 'Create a new pull request to propose and collaborate on changes',
      schema: createPullRequestSchema(config),
      operation: [ToolOperation.CREATE],
      func: async (args: CreatePullRequestParams) => service.createPullRequest(args)
    }),
    tool({
      name: 'create_branch',
      description: 'Create a new branch in a GitHub repository',
      schema: createBranchSchema(config),
      operation: [ToolOperation.CREATE],
      func: async (args: CreateBranchParams) => service.createBranch(args)
    }),
    tool({
      name: 'list_commits',
      description: 'Get list of commits of a branch',
      schema: listCommitsSchema(config),
      operation: [ToolOperation.READ],
      func: async (args: ListCommitsParams) => service.listCommits(args)
    }),
    tool({
      name: 'update_issue',
      description: 'Update an existing issue in a GitHub repository',
      schema: updateIssueSchema(config),
      operation: [ToolOperation.UPDATE],
      func: async (args: UpdateIssueParams) => service.updateIssue(args)
    }),
    tool({
      name: 'add_issue_comment',
      description: 'Add a comment to an existing issue or pull request',
      schema: addIssueCommentSchema(config),
      operation: [ToolOperation.CREATE],
      func: async (args: AddIssueCommentParams) => service.addIssueComment(args)
    }),
    tool({
      name: 'search_github_users',
      description: 'Search for GitHub users by username, name, or other criteria',
      schema: searchGithubUsersSchema(config),
      operation: [ToolOperation.READ],
      func: async (args: SearchUsersParams) => service.searchUsers(args)
    }),
    tool({
      name: 'get_pull_request',
      description: 'Get details of a specific pull request',
      schema: getPullRequestSchema(config),
      operation: [ToolOperation.READ],
      func: async (args: PullRequestParams) => service.getPullRequest(args)
    }),
    tool({
      name: 'create_pull_request_review',
      description: 'Create a review on a pull request with comments and approval status',
      schema: createPullRequestReviewSchema(config),
      operation: [ToolOperation.CREATE],
      func: async (args: CreatePullRequestReviewParams) => service.createPullRequestReview(args)
    }),
    tool({
      name: 'merge_pull_request',
      description: 'Merge a pull request into its base branch',
      schema: mergePullRequestSchema(config),
      operation: [ToolOperation.UPDATE],
      func: async (args: MergePullRequestParams) => service.mergePullRequest(args)
    }),
    tool({
      name: 'search_code_global',
      description:
        'Search for code across all public GitHub repositories using keywords, file paths, or language',
      schema: searchCodeGlobalSchema,
      operation: [ToolOperation.READ],
      func: async (args: SearchCodeGlobalParams) => service.searchCodeGlobal(args)
    }),
    tool({
      name: 'search_issues_global',
      description: 'Search for issues and pull requests across all GitHub repositories',
      schema: baseSearchIssuesOrPullRequestsSchema,
      operation: [ToolOperation.READ],
      func: async (args: SearchIssuesGlobalParams) => service.searchIssuesGlobal(args)
    }),
    tool({
      name: 'get_pull_request_status',
      description: 'Get the combined status of all status checks for a pull request',
      schema: getPullRequestStatusSchema(config),
      operation: [ToolOperation.READ],
      func: async (args: GetPullRequestStatusParams) => service.getPullRequestStatus(args)
    }),
    tool({
      name: 'get_pull_request_files',
      description: 'Get the list of files changed in a pull request',
      schema: getPullRequestFilesSchema(config),
      operation: [ToolOperation.READ],
      func: async (args: GetPullRequestFilesParams) => service.getPullRequestFiles(args)
    }),
    tool({
      name: 'get_pull_request_comments',
      description: 'Get the review comments on a pull request',
      schema: getPullRequestCommentsSchema(config),
      operation: [ToolOperation.READ],
      func: async (args: GetPullRequestCommentsParams) => service.getPullRequestComments(args)
    }),
    tool({
      name: 'get_pull_request_reviews',
      description: 'Get the reviews on a pull request',
      schema: getPullRequestReviewsSchema(config),
      operation: [ToolOperation.READ],
      func: async (args: GetPullRequestReviewsParams) => service.getPullRequestReviews(args)
    }),
    tool({
      name: 'update_pull_request_branch',
      description: 'Update a pull request branch with latest changes from base branch',
      schema: updatePullRequestBranchSchema(config),
      operation: [ToolOperation.UPDATE],
      func: async (args: UpdatePullRequestBranchParams) => service.updatePullRequestBranch(args)
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

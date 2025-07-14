import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
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
import { DynamicStructuredTool } from '@langchain/core/tools';
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

  const tools = [
    new DynamicStructuredTool({
      name: 'search_issues_or_pull_requests',
      description:
        'Search issues or PRs within a specific repository based on status, keywords, and reporter',
      schema: searchIssuesOrPullRequestsSchema(config),
      func: async (args: SearchIssuesOrPullRequestsParams) => {
        return service.searchIssuesOrPullRequests(args);
      }
    }),
    new DynamicStructuredTool({
      name: 'get_github_issue',
      description:
        'Get detailed information about a specific GitHub issue or PR by number. PRs and Issues are interchangeable terms in GitHub',
      schema: getGithubIssueSchema(config),
      func: async (args: GetGithubIssueParams) => {
        return service.getIssue(args.issueNumber, {
          repo: args.repo,
          owner: args.owner
        });
      }
    }),
    new DynamicStructuredTool({
      name: 'add_github_assignee',
      description:
        'Add an assignee or assign someone to a GitHub issue or PR. PRs and Issues are interchangeable terms in GitHub',
      schema: addGithubAssigneeSchema(config),
      func: async (args: AddGithubAssigneeParams) => {
        return service.addAssigneeToIssue(args.issueNumber, args.assignee, {
          repo: args.repo,
          owner: args.owner
        });
      }
    }),
    new DynamicStructuredTool({
      name: 'remove_github_assignee',
      description:
        'Remove an assignee or unassign someone from a GitHub issue or PR. PRs and Issues are interchangeable terms in GitHub',
      schema: removeGithubAssigneeSchema(config),
      func: async (args: RemoveGithubAssigneeParams) => {
        return service.removeAssigneeFromIssue(args.issueNumber, args.assignee, {
          repo: args.repo,
          owner: args.owner
        });
      }
    }),
    new DynamicStructuredTool({
      name: 'get_organization_users',
      description: 'Get all users in a GitHub organization',
      schema: getOrganizationUsersSchema(config),
      func: async (args: GetOrganizationUsersParams) => {
        return service.getOrganizationUsers(args.owner);
      }
    }),
    new DynamicStructuredTool({
      name: 'create_github_issue',
      description: 'Creates an issue in a GitHub repository',
      schema: createGithubIssueSchema(config),
      func: async (args: CreateGithubIssueParams) => service.createIssue(args)
    }),
    new DynamicStructuredTool({
      name: 'search_repository_code',
      description:
        'Search for code within a specific repository using natural language or keywords',
      schema: searchRepositoryCodeSchema(config),
      func: async (args: SearchRepositoryCodeParams) => service.searchCode(args)
    }),
    new DynamicStructuredTool({
      name: 'create_or_update_file',
      description: 'Create a new file or update an existing file in a GitHub repository',
      schema: createOrUpdateFileSchema(config),
      func: async (args: CreateOrUpdateFileParams) => service.createOrUpdateFile(args)
    }),
    new DynamicStructuredTool({
      name: 'search_repositories',
      description: 'Search for GitHub repositories',
      schema: searchRepositoriesSchema,
      func: async (args: SearchRepositoriesParams) => service.searchRepositories(args)
    }),
    new DynamicStructuredTool({
      name: 'create_repository',
      description: 'Create a new GitHub repository',
      schema: createRepositorySchema,
      func: async (args: CreateRepositoryParams) => service.createRepository(args)
    }),
    new DynamicStructuredTool({
      name: 'get_file_contents',
      description: 'Get contents of a file or directory from a GitHub repository',
      schema: getFileContentsSchema(config),
      func: async (args: GetFileContentsParams) => service.getFileContents(args)
    }),
    new DynamicStructuredTool({
      name: 'create_pull_request',
      description: 'Create a new pull request to propose and collaborate on changes',
      schema: createPullRequestSchema(config),
      func: async (args: CreatePullRequestParams) => service.createPullRequest(args)
    }),
    new DynamicStructuredTool({
      name: 'create_branch',
      description: 'Create a new branch in a GitHub repository',
      schema: createBranchSchema(config),
      func: async (args: CreateBranchParams) => service.createBranch(args)
    }),
    new DynamicStructuredTool({
      name: 'list_commits',
      description: 'Get list of commits of a branch',
      schema: listCommitsSchema(config),
      func: async (args: ListCommitsParams) => service.listCommits(args)
    }),
    new DynamicStructuredTool({
      name: 'update_issue',
      description: 'Update an existing issue in a GitHub repository',
      schema: updateIssueSchema(config),
      func: async (args: UpdateIssueParams) => service.updateIssue(args)
    }),
    new DynamicStructuredTool({
      name: 'add_issue_comment',
      description: 'Add a comment to an existing issue or pull request',
      schema: addIssueCommentSchema(config),
      func: async (args: AddIssueCommentParams) => service.addIssueComment(args)
    }),
    new DynamicStructuredTool({
      name: 'search_github_users',
      description: 'Search for GitHub users by username, name, or other criteria',
      schema: searchGithubUsersSchema(config),
      func: async (args: SearchUsersParams) => service.searchUsers(args)
    }),
    new DynamicStructuredTool({
      name: 'get_pull_request',
      description: 'Get details of a specific pull request',
      schema: getPullRequestSchema(config),
      func: async (args: PullRequestParams) => service.getPullRequest(args)
    }),
    new DynamicStructuredTool({
      name: 'create_pull_request_review',
      description: 'Create a review on a pull request with comments and approval status',
      schema: createPullRequestReviewSchema(config),
      func: async (args: CreatePullRequestReviewParams) => service.createPullRequestReview(args)
    }),
    new DynamicStructuredTool({
      name: 'merge_pull_request',
      description: 'Merge a pull request into its base branch',
      schema: mergePullRequestSchema(config),
      func: async (args: MergePullRequestParams) => service.mergePullRequest(args)
    }),
    new DynamicStructuredTool({
      name: 'search_code_global',
      description:
        'Search for code across all public GitHub repositories using keywords, file paths, or language',
      schema: searchCodeGlobalSchema,
      func: async (args: SearchCodeGlobalParams) => service.searchCodeGlobal(args)
    }),
    new DynamicStructuredTool({
      name: 'search_issues_global',
      description: 'Search for issues and pull requests across all GitHub repositories',
      schema: baseSearchIssuesOrPullRequestsSchema,
      func: async (args: SearchIssuesGlobalParams) => service.searchIssuesGlobal(args)
    }),
    new DynamicStructuredTool({
      name: 'get_pull_request_status',
      description: 'Get the combined status of all status checks for a pull request',
      schema: getPullRequestStatusSchema(config),
      func: async (args: GetPullRequestStatusParams) => service.getPullRequestStatus(args)
    }),
    new DynamicStructuredTool({
      name: 'get_pull_request_files',
      description: 'Get the list of files changed in a pull request',
      schema: getPullRequestFilesSchema(config),
      func: async (args: GetPullRequestFilesParams) => service.getPullRequestFiles(args)
    }),
    new DynamicStructuredTool({
      name: 'get_pull_request_comments',
      description: 'Get the review comments on a pull request',
      schema: getPullRequestCommentsSchema(config),
      func: async (args: GetPullRequestCommentsParams) => service.getPullRequestComments(args)
    }),
    new DynamicStructuredTool({
      name: 'get_pull_request_reviews',
      description: 'Get the reviews on a pull request',
      schema: getPullRequestReviewsSchema(config),
      func: async (args: GetPullRequestReviewsParams) => service.getPullRequestReviews(args)
    }),
    new DynamicStructuredTool({
      name: 'update_pull_request_branch',
      description: 'Update a pull request branch with latest changes from base branch',
      schema: updatePullRequestBranchSchema(config),
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

import { z } from 'zod';
import { GitHubConfig } from './types';

export const baseSearchIssuesOrPullRequestsSchema = z.object({
  type: z
    .enum(['issue', 'pr'])
    .describe(
      'Specify whether to search for issues or pull requests. Both are tracked the same way in GitHub'
    ),
  keyword: z
    .string()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe(
      'Text to search for in issue titles and descriptions. Can include multiple words or phrases'
    ),
  reporter: z
    .string()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe(
      'GitHub username of the person who created the issue/PR. Filters results to show only their submissions'
    ),
  assignee: z
    .string()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe('GitHub username of the person who is assigned to the issue/PR.'),
  status: z
    .enum(['open', 'closed'])
    .nullish()
    .transform((val) => val ?? undefined)
    .describe('Filter issues by their status (open or closed)'),
  sort: z
    .enum(['comments', 'reactions', 'created', 'updated'])
    .nullish()
    .transform((val) => val ?? undefined)
    .describe('Sort by: number of comments, reactions, creation date, or last update'),
  order: z
    .enum(['asc', 'desc'])
    .nullish()
    .transform((val) => val ?? undefined)
    .describe('Sort order: ascending (oldest/least first) or descending (newest/most first)'),
  label: z
    .string()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe('Filter issues by their labels. Can include multiple labels separated by commas'),
  page: z.number().describe('Page number for pagination, starting at 1')
});

export const searchIssuesOrPullRequestsSchema = (config: GitHubConfig) =>
  baseSearchIssuesOrPullRequestsSchema.extend({
    repo: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.repo))
      .describe(
        config.repo
          ? 'Name of the repository to search in. This identifies which project to look for issues/PRs'
          : 'Name of the repository to search in. This identifies which project to look for issues/PRs (required)'
      ),
    owner: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.owner))
      .describe(
        config.owner
          ? 'Username or organization that owns the repository. This is the first part of the repository URL'
          : 'Username or organization that owns the repository. This is the first part of the repository URL (required)'
      )
  });

export const getGithubIssueSchema = (config: GitHubConfig) =>
  z.object({
    repo: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.repo))
      .describe(
        config.repo
          ? 'Repository name from which the issue or PR should be retrieved'
          : 'Repository name from which the issue or PR should be retrieved (required)'
      ),
    owner: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.owner))
      .describe(
        config.owner
          ? 'Owner of the repository containing the issue or PR'
          : 'Owner of the repository containing the issue or PR (required)'
      ),
    issueNumber: z
      .number()
      .describe(
        'The number of the issue or PR to fetch. PRs and Issues are interchangeable terms in GitHub'
      )
  });

export const addGithubAssigneeSchema = (config: GitHubConfig) =>
  z.object({
    repo: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.repo))
      .describe(
        config.repo
          ? 'Repository where the issue or PR exists for assigning a user'
          : 'Repository where the issue or PR exists for assigning a user (required)'
      ),
    owner: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.owner))
      .describe(
        config.owner
          ? 'Owner of the repository where the issue or PR exists'
          : 'Owner of the repository where the issue or PR exists (required)'
      ),
    issueNumber: z.number().describe('The number of the issue or PR to add the assignee to'),
    assignee: z.string().describe('The GitHub username of the assignee')
  });

export const removeGithubAssigneeSchema = (config: GitHubConfig) =>
  z.object({
    repo: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.repo))
      .describe(
        config.repo
          ? 'Repository where the issue or PR exists for removing an assignee'
          : 'Repository where the issue or PR exists for removing an assignee (required)'
      ),
    owner: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.owner))
      .describe(
        config.owner
          ? 'Owner of the repository where the issue or PR exists'
          : 'Owner of the repository where the issue or PR exists (required)'
      ),
    issueNumber: z.number().describe('The number of the issue or PR to remove the assignee from'),
    assignee: z.string().describe('The GitHub username of the assignee to remove')
  });

export const getOrganizationUsersSchema = (config: GitHubConfig) =>
  z.object({
    owner: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.owner))
      .describe(config.owner ? 'Github Organization name' : 'Github Organization name (required)')
  });

export const createGithubIssueSchema = (config: GitHubConfig) =>
  z.object({
    repo: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.repo))
      .describe(
        config.repo
          ? 'The GitHub repository name where issue will be created'
          : 'The GitHub repository name where issue will be created (required)'
      ),
    owner: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.owner))
      .describe(
        config.owner ? 'The owner of the repository' : 'The owner of the repository (required)'
      ),
    title: z.string().describe('The title of the issue'),
    description: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('The description of the issue'),
    assignee: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('The GitHub username of the assignee (optional)')
  });

export const searchRepositoryCodeSchema = (config: GitHubConfig) =>
  z.object({
    repo: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.repo))
      .describe(
        config.repo
          ? 'The name of the GitHub repository to search in'
          : 'The name of the GitHub repository to search in (required)'
      ),
    owner: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.owner))
      .describe(
        config.owner
          ? 'The owner of the GitHub repository'
          : 'The owner of the GitHub repository (required)'
      ),
    query: z.string().describe('The keyword to search for in code files within the repository'),
    page: z.number().default(1).describe('The page number to search for'),
    per_page: z
      .number()
      .int('Page size must be an integer')
      .min(1, 'Page size must be at least 1')
      .max(100, 'GitHub API limits page size to maximum of 100')
      .describe('Number of items per page (min: 1, max: 100)')
      .default(100)
  });

export const createOrUpdateFileSchema = (config: GitHubConfig) =>
  z.object({
    owner: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.owner))
      .describe(
        config.owner
          ? 'Username or organization that owns the repository'
          : 'Username or organization that owns the repository (required)'
      ),
    repo: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.repo))
      .describe(
        config.repo
          ? 'Name of the repository where the file will be created/updated'
          : 'Name of the repository where the file will be created/updated (required)'
      ),
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
    message: z.string().describe('Git commit message describing what changes were made and why'),
    branch: z
      .string()
      .describe(
        'Name of the branch where the file should be created/updated (e.g., "main", "feature/new-docs")'
      ),
    sha: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe(
        'The SHA hash of the file being replaced. Required when updating an existing file, omit when creating new'
      )
  });

export const searchRepositoriesSchema = z.object({
  query: z.string().describe('Search query'),
  page: z
    .number()
    .nullish()
    .transform((val) => val ?? 1)
    .describe('Page number for pagination, starting at 1')
});

export const createRepositorySchema = z.object({
  name: z
    .string()
    .describe(
      'Name for the new repository. Should be URL-friendly, using letters, numbers, hyphens'
    ),
  description: z
    .string()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe(
      "A short description of what this repository is for. Helps others understand the project's purpose"
    ),
  private: z
    .boolean()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe(
      'Whether the repository should be private (true) or public (false). Private repos are only visible to you and collaborators'
    ),
  autoInit: z
    .boolean()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe(
      'Whether to initialize with a README file. Recommended true for new projects to provide initial documentation'
    )
});

export const getFileContentsSchema = (config: GitHubConfig) =>
  z.object({
    owner: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.owner))
      .describe(
        config.owner
          ? 'Username or organization that owns the repository'
          : 'Username or organization that owns the repository (required)'
      ),
    repo: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.repo))
      .describe(
        config.repo
          ? 'Name of the repository containing the file or directory'
          : 'Name of the repository containing the file or directory (required)'
      ),
    path: z.string().describe('Path to file/directory'),
    branch: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Branch name (optional)')
  });

export const createPullRequestSchema = (config: GitHubConfig) =>
  z.object({
    owner: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.owner))
      .describe(
        config.owner
          ? 'Username or organization that owns the repository'
          : 'Username or organization that owns the repository (required)'
      ),
    repo: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.repo))
      .describe(
        config.repo
          ? 'Name of the repository where the PR will be created'
          : 'Name of the repository where the PR will be created (required)'
      ),
    title: z
      .string()
      .describe('Clear, descriptive title for the pull request that summarizes the changes'),
    head: z
      .string()
      .describe('Name of the branch containing your changes (e.g., "feature/new-feature")'),
    base: z
      .string()
      .describe('Name of the branch you want to merge changes into, typically "main" or "master"'),
    body: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Detailed description of the changes, explaining what was changed and why'),
    draft: z
      .boolean()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe(
        'Whether to create as a draft PR (true) or regular PR (false). Draft PRs cannot be merged'
      ),
    maintainer_can_modify: z
      .boolean()
      .nullish()
      .transform((val) => val ?? true)
      .describe(
        'Allow repository maintainers to modify your PR branch. Recommended true for collaboration'
      )
  });

export const createBranchSchema = (config: GitHubConfig) =>
  z.object({
    owner: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.owner))
      .describe(
        config.owner
          ? 'Username or organization that owns the repository'
          : 'Username or organization that owns the repository (required)'
      ),
    repo: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.repo))
      .describe(
        config.repo
          ? 'Name of the repository where the branch will be created'
          : 'Name of the repository where the branch will be created (required)'
      ),
    branch: z.string().describe('Name for the new branch'),
    from_branch: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Name of the branch to branch from (optional)')
  });

export const listCommitsSchema = (config: GitHubConfig) =>
  z.object({
    owner: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.owner))
      .describe(
        config.owner
          ? 'Username or organization that owns the repository'
          : 'Username or organization that owns the repository (required)'
      ),
    repo: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.repo))
      .describe(
        config.repo
          ? 'Name of the repository to list commits from'
          : 'Name of the repository to list commits from (required)'
      ),
    sha: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('The SHA or branch to start listing commits from (optional)'),
    page: z
      .number()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Page number for pagination (optional)'),
    perPage: z
      .number()
      .int('Page size must be an integer')
      .min(1, 'Page size must be at least 1')
      .max(100, 'GitHub API limits page size to maximum of 100')
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Number of items per page (min: 1, max: 100)')
  });

export const updateIssueSchema = (config: GitHubConfig) =>
  z.object({
    owner: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.owner))
      .describe(
        config.owner
          ? 'Username or organization that owns the repository'
          : 'Username or organization that owns the repository (required)'
      ),
    repo: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.repo))
      .describe(
        config.repo
          ? 'Name of the repository containing the issue'
          : 'Name of the repository containing the issue (required)'
      ),
    issue_number: z.number().describe('The issue number to update (e.g., 123)'),
    title: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('New title for the issue'),
    body: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('New description/content for the issue'),
    state: z
      .enum(['open', 'closed'])
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Change issue state to open or closed'),
    labels: z
      .array(z.string())
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('New list of labels to apply (replaces existing labels)'),
    assignees: z
      .array(z.string())
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('New list of GitHub usernames to assign (replaces existing assignees)'),
    milestone: z
      .number()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('New milestone number to associate with the issue')
  });

export const addIssueCommentSchema = (config: GitHubConfig) =>
  z.object({
    owner: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.owner))
      .describe(
        config.owner
          ? 'Username or organization that owns the repository'
          : 'Username or organization that owns the repository (required)'
      ),
    repo: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.repo))
      .describe(
        config.repo
          ? 'Name of the repository containing the issue'
          : 'Name of the repository containing the issue (required)'
      ),
    issue_number: z.number().describe('The issue or PR number to comment on (e.g., 123)'),
    body: z.string().describe('The comment text to add. Can include markdown formatting')
  });

export const searchGithubUsersSchema = (_config: GitHubConfig) =>
  z.object({
    q: z
      .string()
      .describe(
        'Search query using GitHub user search syntax. Can include location:, language:, followers:, or other qualifiers'
      ),
    sort: z
      .enum(['followers', 'repositories', 'joined'])
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Sort users by: number of followers, number of repositories, or join date'),
    order: z
      .enum(['asc', 'desc'])
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Sort order: ascending (lowest/oldest first) or descending (highest/newest first)'),
    page: z
      .number()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Page number for pagination, starting at 1'),
    per_page: z
      .number()
      .int('Page size must be an integer')
      .min(1, 'Page size must be at least 1')
      .max(100, 'GitHub API limits page size to maximum of 100')
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Number of users per page (min: 1, max: 100)')
  });

export const getPullRequestSchema = (config: GitHubConfig) =>
  z.object({
    owner: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.owner))
      .describe(
        config.owner
          ? 'Username or organization that owns the repository'
          : 'Username or organization that owns the repository (required)'
      ),
    repo: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.repo))
      .describe(
        config.repo
          ? 'Name of the repository containing the PR'
          : 'Name of the repository containing the PR (required)'
      ),
    pull_number: z.number().describe('The pull request number to fetch (e.g., 123)')
  });

export const createPullRequestReviewSchema = (config: GitHubConfig) =>
  z.object({
    owner: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.owner))
      .describe(
        config.owner
          ? 'Username or organization that owns the repository'
          : 'Username or organization that owns the repository (required)'
      ),
    repo: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.repo))
      .describe(
        config.repo
          ? 'Name of the repository containing the PR'
          : 'Name of the repository containing the PR (required)'
      ),
    pull_number: z.number().describe('The pull request number to review (e.g., 123)'),
    body: z.string().describe('Overall review comment explaining your feedback or decision'),
    event: z
      .enum(['APPROVE', 'REQUEST_CHANGES', 'COMMENT'])
      .describe(
        'Type of review: APPROVE to accept changes, REQUEST_CHANGES to request modifications, COMMENT for neutral feedback'
      ),
    commit_id: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Specific commit SHA to attach the review to. Usually the latest commit in the PR'),
    comments: z
      .array(
        z.object({
          path: z.string().describe('File path where the comment applies (e.g., "src/main.js")'),
          position: z.number().describe('Line number in the file where the comment applies'),
          body: z.string().describe('The actual comment text for this specific line')
        })
      )
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Line-specific comments to add to the review')
  });

export const mergePullRequestSchema = (config: GitHubConfig) =>
  z.object({
    owner: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.owner))
      .describe(
        config.owner
          ? 'Username or organization that owns the repository'
          : 'Username or organization that owns the repository (required)'
      ),
    repo: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.repo))
      .describe(
        config.repo
          ? 'Name of the repository containing the PR'
          : 'Name of the repository containing the PR (required)'
      ),
    pull_number: z.number().describe('The pull request number to merge (e.g., 123)'),
    commit_title: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Title for the merge commit. If not provided, GitHub will generate one'),
    commit_message: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Additional details for the merge commit message'),
    merge_method: z
      .enum(['merge', 'squash', 'rebase'])
      .nullish()
      .transform((val) => val ?? undefined)
      .describe(
        'How to merge: "merge" creates merge commit, "squash" combines all commits, "rebase" adds commits individually'
      )
  });

export const searchCodeGlobalSchema = z.object({
  q: z
    .string()
    .describe(
      'Search query using GitHub code search syntax. Can include filename:, language:, repo:, or other qualifiers'
    ),
  order: z
    .enum(['asc', 'desc'])
    .nullish()
    .transform((val) => val ?? undefined)
    .describe('Sort order: ascending (oldest first) or descending (newest first)'),
  page: z
    .number()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe('Page number for pagination, starting at 1'),
  per_page: z
    .number()
    .int('Page size must be an integer')
    .min(1, 'Page size must be at least 1')
    .max(100, 'GitHub API limits page size to maximum of 100')
    .nullish()
    .transform((val) => val ?? undefined)
    .describe('Number of results per page (min: 1, max: 100)')
});

export const getPullRequestStatusSchema = (config: GitHubConfig) =>
  z.object({
    owner: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.owner))
      .describe(
        config.owner
          ? 'Username or organization that owns the repository'
          : 'Username or organization that owns the repository (required)'
      ),
    repo: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.repo))
      .describe(
        config.repo
          ? 'Name of the repository containing the PR'
          : 'Name of the repository containing the PR (required)'
      ),
    pull_number: z.number().describe('The pull request number to get status for (e.g., 123)')
  });

export const getPullRequestFilesSchema = (config: GitHubConfig) =>
  z.object({
    owner: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.owner))
      .describe(
        config.owner
          ? 'Username or organization that owns the repository'
          : 'Username or organization that owns the repository (required)'
      ),
    repo: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.repo))
      .describe(
        config.repo
          ? 'Name of the repository containing the PR'
          : 'Name of the repository containing the PR (required)'
      ),
    pull_number: z.number().describe('The pull request number to get changed files for (e.g., 123)')
  });

export const getPullRequestCommentsSchema = (config: GitHubConfig) =>
  z.object({
    owner: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.owner))
      .describe(
        config.owner
          ? 'Username or organization that owns the repository'
          : 'Username or organization that owns the repository (required)'
      ),
    repo: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.repo))
      .describe(
        config.repo
          ? 'Name of the repository containing the PR'
          : 'Name of the repository containing the PR (required)'
      ),
    pull_number: z.number().describe('The pull request number to get comments for (e.g., 123)')
  });

export const getPullRequestReviewsSchema = (config: GitHubConfig) =>
  z.object({
    owner: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.owner))
      .describe(
        config.owner
          ? 'Username or organization that owns the repository'
          : 'Username or organization that owns the repository (required)'
      ),
    repo: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.repo))
      .describe(
        config.repo
          ? 'Name of the repository containing the PR'
          : 'Name of the repository containing the PR (required)'
      ),
    pull_number: z.number().describe('The pull request number to get reviews for (e.g., 123)')
  });

export const updatePullRequestBranchSchema = (config: GitHubConfig) =>
  z.object({
    owner: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.owner))
      .describe(
        config.owner
          ? 'Username or organization that owns the repository'
          : 'Username or organization that owns the repository (required)'
      ),
    repo: z
      .string()
      .nullish()
      .transform((val) => String(val ?? config.repo))
      .describe(
        config.repo
          ? 'Name of the repository containing the PR'
          : 'Name of the repository containing the PR (required)'
      ),
    pull_number: z.number().describe('The pull request number to update (e.g., 123)'),
    expected_head_sha: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe("Expected SHA of the PR's HEAD ref. Used to ensure the branch hasn't changed")
  });

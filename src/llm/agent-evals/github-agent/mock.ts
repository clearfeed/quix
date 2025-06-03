// src/llm/agent-evals/github/mock.ts

import { BaseResponse } from '@clearfeed-ai/quix-common-agent';
import type { Endpoints } from '@octokit/types';
import { TestCase } from '../common/types';
import { createMockedTools } from '../common/utils';
import type {
  SearchCodeResponse,
  SearchIssuesOrPullRequestsResponse,
  GetPRResponse
} from '@clearfeed-ai/quix-github-agent';

//
// Locally define any response‐shapes that are not directly exported by `packages/github/src/types`
//

// --- Get a single GitHub issue or PR (issues and PRs share almost the same shape) ---
export interface GetIssueResponse
  extends BaseResponse<{
    issue: {
      number: number;
      title: string;
      body: string;
      state: string;
      user: { login: string };
      created_at: string;
      updated_at: string;
      html_url: string;
      labels: Array<{ name: string }>;
    };
  }> {}

// --- Add an assignee to an issue/PR ---
export interface AddAssigneeResponse
  extends BaseResponse<{
    issueNumber: number;
    assignees: string[];
  }> {}

// --- Remove an assignee from an issue/PR ---
export interface RemoveAssigneeResponse
  extends BaseResponse<{
    issueNumber: number;
    assignees: string[];
  }> {}

// --- Get all users in a GitHub organization ---
export interface GetOrganizationUsersResponse
  extends BaseResponse<{
    users: Array<{
      login: string;
      id: number;
      avatar_url: string;
      html_url: string;
    }>;
  }> {}

// --- Create a new GitHub issue ---
export interface CreateIssueResponse
  extends BaseResponse<{
    number: number;
    title: string;
    body: string;
    state: string;
    user: { login: string };
    html_url: string;
    labels: Array<{ name: string }>;
  }> {}

// --- Create or update a file in a GitHub repo ---
export interface CreateOrUpdateFileResponse
  extends BaseResponse<{
    path: string;
    sha: string;
    url: string;
    commitMessage: string;
    branch: string;
  }> {}

// --- Search for GitHub repositories ---
export interface SearchRepositoriesResponse
  extends BaseResponse<{
    total_count: number;
    incomplete_results: boolean;
    items: Array<{
      name: string;
      full_name: string;
      description?: string;
      html_url: string;
      stargazers_count: number;
      language?: string;
    }>;
  }> {}

// --- Create a new GitHub repository ---
export interface CreateRepositoryResponse
  extends BaseResponse<{
    name: string;
    full_name: string;
    description?: string;
    html_url: string;
    private: boolean;
    default_branch: string;
  }> {}

// --- Get contents of a file or directory ---
export interface GetFileContentsResponse
  extends BaseResponse<{
    path: string;
    content: string;
    encoding: string;
    size: number;
    html_url: string;
  }> {}

// --- Create a new pull request ---
export interface CreatePullRequestResponse
  extends BaseResponse<{
    number: number;
    title: string;
    body?: string;
    state: string;
    user: { login: string };
    html_url: string;
    headRefName: string;
    baseRefName: string;
    created_at: string;
    updated_at: string;
  }> {}

// --- Create a new branch ---
export interface CreateBranchResponse
  extends BaseResponse<{
    ref: string;
    sha: string;
    repository_url: string;
  }> {}

// --- List commits on a branch ---
export interface ListCommitsResponse
  extends BaseResponse<{
    commits: Array<{
      sha: string;
      commit: {
        message: string;
        author: { name: string; date: string };
      };
      html_url: string;
    }>;
  }> {}

// --- Update an existing issue ---
export interface UpdateIssueResponse
  extends BaseResponse<{
    issueNumber: number;
    title?: string;
    body?: string;
    state?: 'open' | 'closed';
    labels?: string[];
    assignees?: string[];
    updatedAt: string;
    htmlUrl: string;
  }> {}

// --- Add a comment to an issue/PR ---
export interface AddIssueCommentResponse
  extends BaseResponse<{
    id: number;
    body: string;
    user: { login: string };
    created_at: string;
    updated_at: string;
    html_url: string;
  }> {}

// --- Search for GitHub users by criteria ---
export interface GitHubSearchUsersResponse
  extends BaseResponse<{
    total_count: number;
    incomplete_results: boolean;
    items: Array<{
      login: string;
      id: number;
      avatar_url: string;
      html_url: string;
    }>;
  }> {}

// --- Create a review on a pull request ---
export interface CreatePullRequestReviewResponse
  extends BaseResponse<{
    id: number;
    body: string;
    user: { login: string };
    state: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
    submitted_at: string;
    comments?: Array<{
      path: string;
      position: number;
      body: string;
      id: number;
    }>;
  }> {}

// --- Merge a pull request ---
export interface MergePullRequestResponse
  extends BaseResponse<{
    merged: boolean;
    sha: string;
    message: string;
  }> {}

// --- Search issues/PRs globally (across all repos) ---
//     We reuse the same shape as SearchIssuesOrPullRequestsResponse.
export type SearchIssuesGlobalResponse = SearchIssuesOrPullRequestsResponse;

// --- Get combined status checks for a pull request ---
export interface GetPullRequestStatusResponse
  extends BaseResponse<{
    state: string;
    statuses: Array<{
      state: string;
      context: string;
      description: string;
      target_url: string;
    }>;
  }> {}

// --- Get list of files changed in a pull request ---
export interface GetPullRequestFilesResponse
  extends BaseResponse<{
    files: Array<{
      filename: string;
      status: string;
      additions: number;
      deletions: number;
      changes: number;
      raw_url?: string;
      blob_url?: string;
      patch?: string;
    }>;
  }> {}

// --- Get review comments on a pull request ---
export interface GetPullRequestCommentsResponse
  extends BaseResponse<{
    comments: Array<{
      id: number;
      body: string;
      user: { login: string };
      created_at: string;
      updated_at?: string;
      html_url?: string;
    }>;
  }> {}

// --- Get reviews on a pull request ---
export interface GetPullRequestReviewsResponse
  extends BaseResponse<{
    reviews: Array<{
      id: number;
      state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED';
      body: string;
      user: { login: string };
      submitted_at: string;
    }>;
  }> {}

// --- Update a pull request branch with upstream changes ---
export interface UpdatePullRequestBranchResponse
  extends BaseResponse<{
    merged: boolean;
    message: string;
    sha: string;
  }> {}

//
// Map each tool name to its mock‐response generator
//
export type ToolResponseTypeMap = {
  search_issues_or_pull_requests: (overrides?: {
    success?: boolean;
    error?: string;
    issuesOrPullRequests?: Endpoints['GET /search/issues']['response']['data']['items'];
    pagination?: string;
  }) => SearchIssuesOrPullRequestsResponse;

  get_github_issue: (overrides?: {
    success?: boolean;
    error?: string;
    number?: number;
    title?: string;
    body?: string;
    state?: string;
    user?: string;
    labels?: Array<{ name: string }>;
    created_at?: string;
    updated_at?: string;
    html_url?: string;
  }) => GetIssueResponse;

  add_github_assignee: (overrides?: {
    success?: boolean;
    error?: string;
    issueNumber?: number;
    assignees?: string[];
  }) => AddAssigneeResponse;

  remove_github_assignee: (overrides?: {
    success?: boolean;
    error?: string;
    issueNumber?: number;
    assignees?: string[];
  }) => RemoveAssigneeResponse;

  get_organization_users: (overrides?: {
    success?: boolean;
    error?: string;
    users?: Array<{
      login: string;
      id: number;
      avatar_url: string;
      html_url: string;
    }>;
  }) => GetOrganizationUsersResponse;

  create_github_issue: (overrides?: {
    success?: boolean;
    error?: string;
    number?: number;
    title?: string;
    body?: string;
    state?: string;
    user?: string;
    html_url?: string;
    labels?: Array<{ name: string }>;
  }) => CreateIssueResponse;

  search_repository_code: (overrides?: {
    success?: boolean;
    error?: string;
    total_count?: number;
    incomplete_results?: boolean;
    items?: Array<{
      name: string;
      path: string;
      html_url: string;
    }>;
  }) => SearchCodeResponse;

  create_or_update_file: (overrides?: {
    success?: boolean;
    error?: string;
    path?: string;
    sha?: string;
    url?: string;
    commitMessage?: string;
    branch?: string;
  }) => CreateOrUpdateFileResponse;

  search_repositories: (overrides?: {
    success?: boolean;
    error?: string;
    total_count?: number;
    incomplete_results?: boolean;
    items?: Array<{
      name: string;
      full_name: string;
      description?: string;
      html_url: string;
      stargazers_count: number;
      language?: string;
    }>;
  }) => SearchRepositoriesResponse;

  create_repository: (overrides?: {
    success?: boolean;
    error?: string;
    name?: string;
    full_name?: string;
    description?: string;
    html_url?: string;
    private?: boolean;
    default_branch?: string;
  }) => CreateRepositoryResponse;

  get_file_contents: (overrides?: {
    success?: boolean;
    error?: string;
    path?: string;
    content?: string;
    encoding?: string;
    size?: number;
    html_url?: string;
  }) => GetFileContentsResponse;

  create_pull_request: (overrides?: {
    success?: boolean;
    error?: string;
    number?: number;
    title?: string;
    body?: string;
    state?: string;
    user?: string;
    html_url?: string;
    headRefName?: string;
    baseRefName?: string;
    created_at?: string;
    updated_at?: string;
  }) => CreatePullRequestResponse;

  create_branch: (overrides?: {
    success?: boolean;
    error?: string;
    ref?: string;
    sha?: string;
    repository_url?: string;
  }) => CreateBranchResponse;

  list_commits: (overrides?: {
    success?: boolean;
    error?: string;
    commits?: Array<{
      sha: string;
      commit: {
        message: string;
        author: { name: string; date: string };
      };
      html_url: string;
    }>;
  }) => ListCommitsResponse;

  update_issue: (overrides?: {
    success?: boolean;
    error?: string;
    issueNumber?: number;
    title?: string;
    body?: string;
    state?: 'open' | 'closed';
    labels?: string[];
    assignees?: string[];
    updatedAt?: string;
    htmlUrl?: string;
  }) => UpdateIssueResponse;

  add_issue_comment: (overrides?: {
    success?: boolean;
    error?: string;
    id?: number;
    body?: string;
    user?: string;
    created_at?: string;
    updated_at?: string;
    html_url?: string;
  }) => AddIssueCommentResponse;

  search_github_users: (overrides?: {
    success?: boolean;
    error?: string;
    total_count?: number;
    incomplete_results?: boolean;
    items?: Array<{
      login: string;
      id: number;
      avatar_url: string;
      html_url: string;
    }>;
  }) => GitHubSearchUsersResponse;

  get_pull_request: (overrides?: {
    success?: boolean;
    error?: string;
    number?: number;
    title?: string;
    body?: string;
    state?: string;
    user?: string;
    created_at?: string;
    updated_at?: string;
    html_url?: string;
    headRefName?: string;
    baseRefName?: string;
    labels?: Array<{ name: string }>;
  }) => GetPRResponse;

  create_pull_request_review: (overrides?: {
    success?: boolean;
    error?: string;
    id?: number;
    body?: string;
    user?: string;
    state?: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
    submitted_at?: string;
    comments?: Array<{
      path: string;
      position: number;
      body: string;
      id: number;
    }>;
  }) => CreatePullRequestReviewResponse;

  merge_pull_request: (overrides?: {
    success?: boolean;
    error?: string;
    merged?: boolean;
    sha?: string;
    message?: string;
  }) => MergePullRequestResponse;

  search_code_global: (overrides?: {
    success?: boolean;
    error?: string;
    total_count?: number;
    incomplete_results?: boolean;
    items?: Array<{
      name: string;
      path: string;
      html_url: string;
      repository: { full_name: string };
    }>;
  }) => SearchCodeResponse;

  search_issues_global: (overrides?: {
    success?: boolean;
    error?: string;
    issuesOrPullRequests?: Endpoints['GET /search/issues']['response']['data']['items'];
    pagination?: string;
  }) => SearchIssuesGlobalResponse;

  get_pull_request_status: (overrides?: {
    success?: boolean;
    error?: string;
    state?: string;
    statuses?: Array<{
      state: string;
      context: string;
      description: string;
      target_url: string;
    }>;
  }) => GetPullRequestStatusResponse;

  get_pull_request_files: (overrides?: {
    success?: boolean;
    error?: string;
    files?: Array<{
      filename: string;
      status: string;
      additions: number;
      deletions: number;
      changes: number;
      raw_url?: string;
      blob_url?: string;
      patch?: string;
    }>;
  }) => GetPullRequestFilesResponse;

  get_pull_request_comments: (overrides?: {
    success?: boolean;
    error?: string;
    comments?: Array<{
      id: number;
      body: string;
      user: { login: string };
      created_at: string;
      updated_at?: string;
      html_url?: string;
    }>;
  }) => GetPullRequestCommentsResponse;

  get_pull_request_reviews: (overrides?: {
    success?: boolean;
    error?: string;
    reviews?: Array<{
      id: number;
      state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED';
      body: string;
      user: { login: string };
      submitted_at: string;
    }>;
  }) => GetPullRequestReviewsResponse;

  update_pull_request_branch: (overrides?: {
    success?: boolean;
    error?: string;
    merged?: boolean;
    message?: string;
    sha?: string;
  }) => UpdatePullRequestBranchResponse;
};

//
// Provide a default “toolResponseMap” for all GitHub tools.
// Each entry returns a BaseResponse<…> with either override values or sensible defaults.
//

const toolResponseMap: ToolResponseTypeMap = {
  // 1. search_issues_or_pull_requests
  search_issues_or_pull_requests: (overrides = {}) => {
    const response: SearchIssuesOrPullRequestsResponse = {
      success: overrides.success ?? true,
      data: {
        issuesOrPullRequests: (overrides.issuesOrPullRequests ?? []) as any,
        pagination: overrides.pagination ?? ''
      },
      error: overrides.error
    };
    return response;
  },

  // 2. get_github_issue
  get_github_issue: (overrides = {}) => {
    const response: GetIssueResponse = {
      success: overrides.success ?? true,
      data: {
        issue: {
          number: overrides.number ?? 1,
          title: overrides.title ?? 'Sample Issue',
          body: overrides.body ?? 'This is a sample issue body.',
          state: overrides.state ?? 'open',
          user: { login: overrides.user ?? 'octocat' },
          created_at: overrides.created_at ?? new Date().toISOString(),
          updated_at: overrides.updated_at ?? new Date().toISOString(),
          html_url:
            overrides.html_url ?? `https://github.com/owner/repo/issues/${overrides.number ?? 1}`,
          labels: overrides.labels ?? [{ name: 'bug' }]
        }
      },
      error: overrides.error
    };
    return response;
  },

  // 3. add_github_assignee
  add_github_assignee: (overrides = {}) => {
    const response: AddAssigneeResponse = {
      success: overrides.success ?? true,
      data: {
        issueNumber: overrides.issueNumber ?? 1,
        assignees: overrides.assignees ?? ['octocat']
      },
      error: overrides.error
    };
    return response;
  },

  // 4. remove_github_assignee
  remove_github_assignee: (overrides = {}) => {
    const response: RemoveAssigneeResponse = {
      success: overrides.success ?? true,
      data: {
        issueNumber: overrides.issueNumber ?? 1,
        assignees: overrides.assignees ?? []
      },
      error: overrides.error
    };
    return response;
  },

  // 5. get_organization_users
  get_organization_users: (overrides = {}) => {
    const response: GetOrganizationUsersResponse = {
      success: overrides.success ?? true,
      data: {
        users: overrides.users || [
          {
            login: 'octocat',
            id: 1,
            avatar_url: 'https://github.com/images/error/octocat_happy.gif',
            html_url: 'https://github.com/octocat'
          }
        ]
      },
      error: overrides.error
    };
    return response;
  },

  // 6. create_github_issue
  create_github_issue: (overrides = {}) => {
    const response: CreateIssueResponse = {
      success: overrides.success ?? true,
      data: {
        number: overrides.number ?? 1,
        title: overrides.title ?? 'New Issue',
        body: overrides.body ?? 'This is a new issue created by mock.',
        state: overrides.state ?? 'open',
        user: { login: overrides.user ?? 'octocat' },
        html_url:
          overrides.html_url ?? `https://github.com/owner/repo/issues/${overrides.number ?? 1}`,
        labels: overrides.labels ?? []
      },
      error: overrides.error
    };
    return response;
  },

  // 7. search_repository_code
  search_repository_code: (overrides = {}) => {
    const response: SearchCodeResponse = {
      total_count: overrides.total_count ?? 0,
      incomplete_results: overrides.incomplete_results ?? false,
      items: (overrides.items ?? []) as any
    } as any;
    return response;
  },

  // 8. create_or_update_file
  create_or_update_file: (overrides = {}) => {
    const response: CreateOrUpdateFileResponse = {
      success: overrides.success ?? true,
      data: {
        path: overrides.path ?? 'README.md',
        sha: overrides.sha ?? 'abc123',
        url:
          overrides.url ??
          `https://api.github.com/repos/owner/repo/contents/${overrides.path ?? 'README.md'}`,
        commitMessage: overrides.commitMessage ?? 'Mock commit message',
        branch: overrides.branch ?? 'main'
      },
      error: overrides.error
    };
    return response;
  },

  // 9. search_repositories
  search_repositories: (overrides = {}) => {
    const response: SearchRepositoriesResponse = {
      success: overrides.success ?? true,
      data: {
        total_count: overrides.total_count ?? 0,
        incomplete_results: overrides.incomplete_results ?? false,
        items: overrides.items ?? []
      },
      error: overrides.error
    };
    return response;
  },

  // 10. create_repository
  create_repository: (overrides = {}) => {
    const response: CreateRepositoryResponse = {
      success: overrides.success ?? true,
      data: {
        name: overrides.name ?? 'new-repo',
        full_name: overrides.full_name ?? 'owner/new-repo',
        description: overrides.description,
        html_url: overrides.html_url ?? 'https://github.com/owner/new-repo',
        private: overrides.private ?? false,
        default_branch: overrides.default_branch ?? 'main'
      },
      error: overrides.error
    };
    return response;
  },

  // 11. get_file_contents
  get_file_contents: (overrides = {}) => {
    const response: GetFileContentsResponse = {
      success: overrides.success ?? true,
      data: {
        path: overrides.path ?? 'README.md',
        content: overrides.content ?? Buffer.from('Hello, world!', 'utf8').toString('base64'),
        encoding: overrides.encoding ?? 'base64',
        size: overrides.size ?? 13,
        html_url: overrides.html_url ?? 'https://github.com/owner/repo/blob/main/README.md'
      },
      error: overrides.error
    };
    return response;
  },

  // 12. create_pull_request
  create_pull_request: (overrides = {}) => {
    const response: CreatePullRequestResponse = {
      success: overrides.success ?? true,
      data: {
        number: overrides.number ?? 1,
        title: overrides.title ?? 'New Pull Request',
        body: overrides.body,
        state: overrides.state ?? 'open',
        user: { login: overrides.user ?? 'octocat' },
        html_url:
          overrides.html_url ?? `https://github.com/owner/repo/pull/${overrides.number ?? 1}`,
        headRefName: overrides.headRefName ?? 'feature-branch',
        baseRefName: overrides.baseRefName ?? 'main',
        created_at: overrides.created_at ?? new Date().toISOString(),
        updated_at: overrides.updated_at ?? new Date().toISOString()
      },
      error: overrides.error
    };
    return response;
  },

  // 13. create_branch
  create_branch: (overrides = {}) => {
    const response: CreateBranchResponse = {
      success: overrides.success ?? true,
      data: {
        ref: overrides.ref ?? 'refs/heads/feature-branch',
        sha: overrides.sha ?? 'abc123',
        repository_url: overrides.repository_url ?? 'https://api.github.com/repos/owner/repo'
      },
      error: overrides.error
    };
    return response;
  },

  // 14. list_commits
  list_commits: (overrides = {}) => {
    const response: ListCommitsResponse = {
      success: overrides.success ?? true,
      data: {
        commits: overrides.commits ?? []
      },
      error: overrides.error
    };
    return response;
  },

  // 15. update_issue
  update_issue: (overrides = {}) => {
    const response: UpdateIssueResponse = {
      success: overrides.success ?? true,
      data: {
        issueNumber: overrides.issueNumber ?? 1,
        title: overrides.title,
        body: overrides.body,
        state: overrides.state,
        labels: overrides.labels,
        assignees: overrides.assignees,
        updatedAt: overrides.updatedAt ?? new Date().toISOString(),
        htmlUrl:
          overrides.htmlUrl ?? `https://github.com/owner/repo/issues/${overrides.issueNumber ?? 1}`
      },
      error: overrides.error
    };
    return response;
  },

  // 16. add_issue_comment
  add_issue_comment: (overrides = {}) => {
    const response: AddIssueCommentResponse = {
      success: overrides.success ?? true,
      data: {
        id: overrides.id ?? 1,
        body: overrides.body ?? 'This is a mock comment.',
        user: { login: overrides.user ?? 'octocat' },
        created_at: overrides.created_at ?? new Date().toISOString(),
        updated_at: overrides.updated_at ?? new Date().toISOString(),
        html_url:
          overrides.html_url ?? `https://github.com/owner/repo/issues/comments/${overrides.id ?? 1}`
      },
      error: overrides.error
    };
    return response;
  },

  // 17. search_github_users
  search_github_users: (overrides = {}) => {
    const response: GitHubSearchUsersResponse = {
      success: overrides.success ?? true,
      data: {
        total_count: overrides.total_count ?? 0,
        incomplete_results: overrides.incomplete_results ?? false,
        items: overrides.items ?? []
      },
      error: overrides.error
    };
    return response;
  },

  // 18. get_pull_request (uses imported GetPRResponse)
  get_pull_request: (overrides = {}) => {
    // We cast minimal shape onto GetPRResponse
    const response = {
      success: overrides.success ?? true,
      data: {
        pullRequest: {
          number: overrides.number ?? 1,
          title: overrides.title ?? 'Sample PR',
          body: overrides.body ?? '',
          state: overrides.state ?? 'open',
          user: { login: overrides.user ?? 'octocat' },
          created_at: overrides.created_at ?? new Date().toISOString(),
          updated_at: overrides.updated_at ?? new Date().toISOString(),
          html_url:
            overrides.html_url ?? `https://github.com/owner/repo/pull/${overrides.number ?? 1}`,
          headRefName: overrides.headRefName ?? 'feature-branch',
          baseRefName: overrides.baseRefName ?? 'main',
          labels: overrides.labels ?? []
        }
      },
      error: overrides.error
    } as unknown as GetPRResponse;
    return response;
  },

  // 19. create_pull_request_review
  create_pull_request_review: (overrides = {}) => {
    const response: CreatePullRequestReviewResponse = {
      success: overrides.success ?? true,
      data: {
        id: overrides.id ?? 1,
        body: overrides.body ?? 'Looks good to me.',
        user: { login: overrides.user ?? 'octocat' },
        state: overrides.state ?? 'APPROVE',
        submitted_at: overrides.submitted_at ?? new Date().toISOString(),
        comments: overrides.comments
      },
      error: overrides.error
    };
    return response;
  },

  // 20. merge_pull_request
  merge_pull_request: (overrides = {}) => {
    const response: MergePullRequestResponse = {
      success: overrides.success ?? true,
      data: {
        merged: overrides.merged ?? true,
        sha: overrides.sha ?? 'abc123',
        message: overrides.message ?? 'Pull request merged successfully.'
      },
      error: overrides.error
    };
    return response;
  },

  // 21. search_code_global (reuses SearchCodeResponse)
  search_code_global: (overrides = {}) => {
    const response: SearchCodeResponse = {
      total_count: overrides.total_count ?? 0,
      incomplete_results: overrides.incomplete_results ?? false,
      items: overrides.items ?? []
    } as any;
    return response;
  },

  // 22. search_issues_global (reuses SearchIssuesOrPullRequestsResponse)
  search_issues_global: (overrides = {}) => {
    const response: SearchIssuesOrPullRequestsResponse = {
      success: overrides.success ?? true,
      data: {
        issuesOrPullRequests: (overrides.issuesOrPullRequests ?? []) as any,
        pagination: overrides.pagination ?? ''
      },
      error: overrides.error
    };
    return response;
  },

  // 23. get_pull_request_status
  get_pull_request_status: (overrides = {}) => {
    const response: GetPullRequestStatusResponse = {
      success: overrides.success ?? true,
      data: {
        state: overrides.state ?? 'success',
        statuses: overrides.statuses ?? []
      },
      error: overrides.error
    };
    return response;
  },

  // 24. get_pull_request_files
  get_pull_request_files: (overrides = {}) => {
    const response: GetPullRequestFilesResponse = {
      success: overrides.success ?? true,
      data: {
        files: overrides.files ?? []
      },
      error: overrides.error
    };
    return response;
  },

  // 25. get_pull_request_comments
  get_pull_request_comments: (overrides = {}) => {
    const response: GetPullRequestCommentsResponse = {
      success: overrides.success ?? true,
      data: {
        comments: overrides.comments ?? []
      },
      error: overrides.error
    };
    return response;
  },

  // 26. get_pull_request_reviews
  get_pull_request_reviews: (overrides = {}) => {
    const response: GetPullRequestReviewsResponse = {
      success: overrides.success ?? true,
      data: {
        reviews: overrides.reviews ?? []
      },
      error: overrides.error
    };
    return response;
  },

  // 27. update_pull_request_branch
  update_pull_request_branch: (overrides = {}) => {
    const response: UpdatePullRequestBranchResponse = {
      success: overrides.success ?? true,
      data: {
        merged: overrides.merged ?? true,
        message: overrides.message ?? 'Branch updated with base changes.',
        sha: overrides.sha ?? 'abc123'
      },
      error: overrides.error
    };
    return response;
  }
};

//
// Factory to create mocked GitHub tools for agent‐eval tests
//
export function createGithubMockedTools(
  config: unknown,
  testCase: TestCase<ToolResponseTypeMap>,
  originalTools: any[]
) {
  return createMockedTools(config, testCase, toolResponseMap, originalTools);
}

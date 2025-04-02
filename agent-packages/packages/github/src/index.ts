import { Octokit, RestEndpointMethodTypes } from '@octokit/rest';
import { BaseResponse, BaseService } from '@clearfeed-ai/quix-common-agent';
import {
  GitHubConfig,
  SearchIssuesParams,
  SearchIssuesResponse,
  CreateOrUpdateFileParams,
  PushFilesParams,
  SearchRepositoriesParams,
  CreateRepositoryParams,
  GetFileContentsParams,
  CreatePullRequestParams,
  ForkRepositoryParams,
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
  SearchCodeResponse,
  SearchIssuesGlobalParams
} from './types';
import { CodeSearchParams, CreateIssueParams } from './types/index';

export * from './types';
export * from './tools';

export class GitHubService implements BaseService<GitHubConfig> {
  private client: Octokit;
  private config: GitHubConfig;

  validateConfig(config?: Record<string, any>): { isValid: boolean; error?: string } & Record<string, any> {
    const repoOwner = config?.owner || this.config.owner;
    const repoName = config?.repo || this.config.repo;

    if (!repoOwner) {
      return { isValid: false, error: 'Owner must be provided or configured.' };
    }
    if (!repoName) {
      return { isValid: false, error: 'Repository name must be provided or configured.' };
    }

    return { isValid: true, repoOwner, repoName };
  }

  constructor(config: GitHubConfig) {
    this.config = config;
    this.client = new Octokit({ auth: config.token });
    if (!config.token) {
      throw new Error('GitHub integration is not configured. Please pass in a token.');
    }
  }

  async searchIssues(params: SearchIssuesParams): Promise<SearchIssuesResponse> {
    try {
      const validation = this.validateConfig({ owner: params.owner, repo: params.repo });
      const repo = validation.repoName;
      const owner = validation.repoOwner;

      let query = `repo:${owner}/${repo} is:${params.type}`;

      if (params.keyword) query += ` in:title,body ${params.keyword}`;
      if (params.reporter) query += ` author:${params.reporter}`;

      const response = await this.client.search.issuesAndPullRequests({
        q: query,
        per_page: 10,
        sort: 'updated',
        order: 'desc'
      });

      return {
        success: true,
        data: {
          issues: response.data.items
        }
      };
    } catch (error) {
      console.error('Error searching GitHub PRs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search GitHub PRs'
      };
    }
  }

  async getIssue(issueNumber: number, params: { owner?: string; repo?: string }): Promise<BaseResponse<RestEndpointMethodTypes['issues']['get']['response']['data']>> {
    try {
      const validation = this.validateConfig({ owner: params.owner, repo: params.repo });
      const repo = validation.repoName;
      const owner = validation.repoOwner;
      const response = await this.client.issues.get({
        owner,
        repo,
        issue_number: issueNumber
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching GitHub issue:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch GitHub issue' };
    }
  }

  async addAssigneeToIssue(issueNumber: number, assignee: string, params: { owner?: string; repo?: string }): Promise<
    BaseResponse<RestEndpointMethodTypes['issues']['addAssignees']['response']['data']>
  > {
    try {
      const validation = this.validateConfig({ owner: params.owner, repo: params.repo });
      const repo = validation.repoName;
      const owner = validation.repoOwner;
      const response = await this.client.issues.addAssignees({
        owner,
        repo,
        issue_number: issueNumber,
        assignees: [assignee]
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error assigning GitHub issue:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to assign GitHub issue' };
    }
  }

  async removeAssigneeFromIssue(issueNumber: number, assignee: string, params: { owner?: string; repo?: string }): Promise<
    BaseResponse<RestEndpointMethodTypes['issues']['removeAssignees']['response']['data']>
  > {
    try {
      const validation = this.validateConfig({ owner: params.owner, repo: params.repo });
      const repo = validation.repoName;
      const owner = validation.repoOwner;
      const response = await this.client.issues.removeAssignees({
        owner,
        repo,
        issue_number: issueNumber,
        assignees: [assignee]
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error removing assignee from GitHub issue:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to remove assignee from GitHub issue' };
    }
  }

  async getUsers(owner: string): Promise<BaseResponse<RestEndpointMethodTypes['orgs']['listMembers']['response']['data']>> {
    try {
      const orgOwner = owner || this.config.owner;
      if (!orgOwner) throw new Error('Owner must be provided when no default owner is configured.');
      const response = await this.client.orgs.listMembers({
        org: orgOwner
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching GitHub users:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch GitHub users' };
    }
  }

  async createIssue(params: CreateIssueParams): Promise<BaseResponse<{ issueUrl: string }>> {
    try {
      const validation = this.validateConfig({ owner: params.owner, repo: params.repo });
      const repo = validation.repoName;
      const owner = validation.repoOwner;
      const response = await this.client.issues.create({
        owner,
        repo,
        title: params.title,
        body: params.description || ''
      });
      return {
        success: true,
        data: {
          issueUrl: response.data.html_url
        }
      };
    } catch (error) {
      console.error('Error creating GitHub issue:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create GitHub issue' };
    }
  }

  async searchCode(params: CodeSearchParams): Promise<BaseResponse<RestEndpointMethodTypes['search']['code']['response']['data']['items']>> {
    try {
      const query = params.query;
      const validation = this.validateConfig({ owner: params.owner, repo: params.repo });
      const repo = validation.repoName;
      const owner = validation.repoOwner;

      const response = await this.client.search.code({
        q: `${query} repo:${owner}/${repo}`,
        per_page: 10
      });

      return {
        success: true,
        data: response.data.items
      };
    } catch (error) {
      console.error('Error searching GitHub code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search GitHub code'
      };
    }
  }

  async createOrUpdateFile(params: CreateOrUpdateFileParams): Promise<RestEndpointMethodTypes['repos']['createOrUpdateFileContents']['response']> {
    const { owner, repo, path, content, message, branch, sha } = params;
    return this.client.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
      branch,
      sha
    });
  }

  async pushFiles(params: PushFilesParams): Promise<RestEndpointMethodTypes['git']['createTree']['response']> {
    const { owner, repo, branch, files, message } = params;

    // Get the latest commit SHA
    const ref = await this.client.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`
    });
    const latestCommit = await this.client.git.getCommit({
      owner,
      repo,
      commit_sha: ref.data.object.sha
    });

    // Create blobs for each file
    const blobs = await Promise.all(
      files.map(file =>
        this.client.git.createBlob({
          owner,
          repo,
          content: Buffer.from(file.content).toString('base64'),
          encoding: 'base64'
        })
      )
    );

    // Create tree
    const tree = await this.client.git.createTree({
      owner,
      repo,
      base_tree: latestCommit.data.tree.sha,
      tree: files.map((file, index) => ({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blobs[index].data.sha
      }))
    });

    // Create commit
    const commit = await this.client.git.createCommit({
      owner,
      repo,
      message,
      tree: tree.data.sha,
      parents: [latestCommit.data.sha]
    });

    // Update branch reference
    await this.client.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: commit.data.sha
    });

    return tree;
  }

  async searchRepositories(params: SearchRepositoriesParams): Promise<RestEndpointMethodTypes['search']['repos']['response']> {
    const { query, page, perPage } = params;
    return this.client.search.repos({
      q: query,
      page,
      per_page: perPage
    });
  }

  async createRepository(params: CreateRepositoryParams): Promise<RestEndpointMethodTypes['repos']['createForAuthenticatedUser']['response']> {
    const { name, description, private: isPrivate, autoInit } = params;
    return this.client.repos.createForAuthenticatedUser({
      name,
      description,
      private: isPrivate,
      auto_init: autoInit
    });
  }

  async getFileContents(params: GetFileContentsParams): Promise<RestEndpointMethodTypes['repos']['getContent']['response']> {
    const { owner, repo, path, branch } = params;
    return this.client.repos.getContent({
      owner,
      repo,
      path,
      ref: branch
    });
  }

  async createPullRequest(params: CreatePullRequestParams): Promise<RestEndpointMethodTypes['pulls']['create']['response']> {
    const { owner, repo, title, head, base, body, draft, maintainer_can_modify } = params;
    return this.client.pulls.create({
      owner,
      repo,
      title,
      head,
      base,
      body,
      draft,
      maintainer_can_modify
    });
  }

  async forkRepository(params: ForkRepositoryParams): Promise<RestEndpointMethodTypes['repos']['createFork']['response']> {
    const { owner, repo, organization } = params;
    return this.client.repos.createFork({
      owner,
      repo,
      organization
    });
  }

  async createBranch(params: CreateBranchParams): Promise<RestEndpointMethodTypes['git']['createRef']['response']> {
    const { owner, repo, branch, from_branch } = params;
    const ref = await this.client.git.getRef({
      owner,
      repo,
      ref: `heads/${from_branch || 'main'}`
    });
    return this.client.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branch}`,
      sha: ref.data.object.sha
    });
  }

  async listCommits(params: ListCommitsParams): Promise<RestEndpointMethodTypes['repos']['listCommits']['response']> {
    const { owner, repo, sha, page, perPage } = params;
    return this.client.repos.listCommits({
      owner,
      repo,
      sha,
      page,
      per_page: perPage
    });
  }

  async listIssues(params: ListIssuesParams): Promise<RestEndpointMethodTypes['issues']['listForRepo']['response']> {
    const { owner, repo, state, sort, direction, since, page, per_page, labels } = params;
    return this.client.issues.listForRepo({
      owner,
      repo,
      state,
      sort,
      direction,
      since,
      page,
      per_page,
      labels: labels?.join(',')
    });
  }

  async updateIssue(params: UpdateIssueParams): Promise<RestEndpointMethodTypes['issues']['update']['response']> {
    const { owner, repo, issue_number, title, body, state, labels, assignees, milestone } = params;
    return this.client.issues.update({
      owner,
      repo,
      issue_number,
      title,
      body,
      state,
      labels,
      assignees,
      milestone
    });
  }

  async addIssueComment(params: AddIssueCommentParams): Promise<RestEndpointMethodTypes['issues']['createComment']['response']> {
    const { owner, repo, issue_number, body } = params;
    return this.client.issues.createComment({
      owner,
      repo,
      issue_number,
      body
    });
  }

  async searchUsers(params: SearchUsersParams): Promise<RestEndpointMethodTypes['search']['users']['response']> {
    const { q, sort, order, per_page, page } = params;
    return this.client.search.users({
      q,
      sort,
      order,
      per_page,
      page
    });
  }

  async getPullRequest(params: PullRequestParams): Promise<RestEndpointMethodTypes['pulls']['get']['response']> {
    const { owner, repo, pull_number } = params;
    return this.client.pulls.get({
      owner,
      repo,
      pull_number
    });
  }

  async listPullRequests(params: ListPullRequestsParams): Promise<RestEndpointMethodTypes['pulls']['list']['response']> {
    const { owner, repo, state, head, base, sort, direction, per_page, page } = params;
    return this.client.pulls.list({
      owner,
      repo,
      state,
      head,
      base,
      sort,
      direction,
      per_page,
      page
    });
  }

  async createPullRequestReview(params: CreatePullRequestReviewParams): Promise<RestEndpointMethodTypes['pulls']['createReview']['response']> {
    const { owner, repo, pull_number, body, event, commit_id, comments } = params;
    return this.client.pulls.createReview({
      owner,
      repo,
      pull_number,
      body,
      event,
      commit_id,
      comments
    });
  }

  async mergePullRequest(params: MergePullRequestParams): Promise<RestEndpointMethodTypes['pulls']['merge']['response']> {
    const { owner, repo, pull_number, commit_title, commit_message, merge_method } = params;
    return this.client.pulls.merge({
      owner,
      repo,
      pull_number,
      commit_title,
      commit_message,
      merge_method
    });
  }

  async getPullRequestFiles(params: PullRequestParams): Promise<RestEndpointMethodTypes['pulls']['listFiles']['response']> {
    const { owner, repo, pull_number } = params;
    return this.client.pulls.listFiles({
      owner,
      repo,
      pull_number
    });
  }

  async getPullRequestStatus(params: PullRequestParams): Promise<RestEndpointMethodTypes['repos']['getCombinedStatusForRef']['response']> {
    const { owner, repo, pull_number } = params;
    const pr = await this.client.pulls.get({
      owner,
      repo,
      pull_number
    });
    return this.client.repos.getCombinedStatusForRef({
      owner,
      repo,
      ref: pr.data.head.sha
    });
  }

  async updatePullRequestBranch(params: UpdatePullRequestBranchParams): Promise<RestEndpointMethodTypes['pulls']['updateBranch']['response']> {
    const { owner, repo, pull_number, expected_head_sha } = params;
    return this.client.pulls.updateBranch({
      owner,
      repo,
      pull_number,
      expected_head_sha
    });
  }

  async getPullRequestComments(params: PullRequestParams): Promise<RestEndpointMethodTypes['pulls']['listReviewComments']['response']> {
    const { owner, repo, pull_number } = params;
    return this.client.pulls.listReviewComments({
      owner,
      repo,
      pull_number
    });
  }

  async getPullRequestReviews(params: PullRequestParams): Promise<RestEndpointMethodTypes['pulls']['listReviews']['response']> {
    const { owner, repo, pull_number } = params;
    return this.client.pulls.listReviews({
      owner,
      repo,
      pull_number
    });
  }

  async searchCodeGlobal(params: SearchCodeParams): Promise<SearchCodeResponse> {
    const response = await this.client.rest.search.code({
      q: params.q,
      order: params.order,
      per_page: params.per_page,
      page: params.page
    });
    return response.data;
  }

  async searchIssuesGlobal(params: SearchIssuesGlobalParams): Promise<SearchIssuesResponse> {
    const response = await this.client.rest.search.issuesAndPullRequests({
      q: params.q,
      sort: params.sort,
      order: params.order,
      per_page: params.per_page,
      page: params.page
    });
    return {
      success: true,
      data: {
        issues: response.data.items
      }
    };
  }
} 

import { BaseResponse, BaseService } from '@clearfeed-ai/quix-common-agent';
import {
  GitHubConfig,
  SearchIssuesParams,
  SearchIssuesResponse,
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
  SearchCodeResponse,
  SearchIssuesGlobalParams,
  SearchPullRequestsResponse
} from './types';
import { CodeSearchParams, CreateIssueParams } from './types/index';
import type { OctokitType, RestEndpointMethodTypes } from './types/oktokit';
export * from './types';
export * from './tools';

let Octokit: typeof OctokitType;

const loadOctokit = async (): Promise<typeof Octokit> => {
  if (!Octokit) {
    const { Octokit: OctokitClass } = await import('@octokit/rest');
    Octokit = OctokitClass;
  }
  return Octokit;
};

export class GitHubService implements BaseService<GitHubConfig> {
  private client: OctokitType;
  private config: GitHubConfig;

  validateConfig(
    config?: Record<string, any>
  ): { isValid: boolean; error?: string } & Record<string, any> {
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

  private constructor(config: GitHubConfig) {
    this.config = config;
    this.client = new Octokit({ auth: config.token });
    if (!config.token) {
      throw new Error('GitHub integration is not configured. Please pass in a token.');
    }
  }

  static async create(config: GitHubConfig): Promise<GitHubService> {
    await loadOctokit();
    return new GitHubService(config);
  }

  private async checkUserCanBeAssigned(params: {
    owner: string;
    repo: string;
    issueNumber: number;
    assignee: string;
  }): Promise<boolean> {
    try {
      await this.client.issues.checkUserCanBeAssigned({
        owner: params.owner,
        repo: params.repo,
        issue_number: params.issueNumber,
        assignee: params.assignee
      });
      return true;
    } catch (error: any) {
      if (error.status === 404) {
        return false;
      }
      throw error;
    }
  }

  async searchIssues(
    params: SearchIssuesParams
  ): Promise<BaseResponse<SearchIssuesResponse['data']>> {
    try {
      const validation = this.validateConfig({ owner: params.owner, repo: params.repo });
      const repo = validation.repoName;
      const owner = validation.repoOwner;

      let query = `repo:${owner}/${repo} is:${params.type}`;

      if (params.keyword) query += ` in:title,body ${params.keyword}`;
      if (params.reporter) query += ` author:${params.reporter}`;
      if (params.status) query += ` state:${params.status}`;

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

  async getIssue(
    issueNumber: number,
    params: { owner?: string; repo?: string }
  ): Promise<BaseResponse<RestEndpointMethodTypes['issues']['get']['response']['data']>> {
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
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch GitHub issue'
      };
    }
  }

  async addAssigneeToIssue(
    issueNumber: number,
    assignee: string,
    params: { owner?: string; repo?: string }
  ): Promise<BaseResponse<RestEndpointMethodTypes['issues']['addAssignees']['response']['data']>> {
    try {
      const validation = this.validateConfig({ owner: params.owner, repo: params.repo });
      const repo = validation.repoName;
      const owner = validation.repoOwner;

      const canBeAssigned = await this.checkUserCanBeAssigned({
        owner,
        repo,
        issueNumber,
        assignee
      });
      if (!canBeAssigned) {
        throw new Error(
          `User '${assignee}' cannot be assigned to this issue. Please provide a valid GitHub username of the user who can be assigned to an issue or pull request in this repository.`
        );
      }

      const response = await this.client.issues.addAssignees({
        owner,
        repo,
        issue_number: issueNumber,
        assignees: [assignee]
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error assigning GitHub issue:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign GitHub issue'
      };
    }
  }

  async removeAssigneeFromIssue(
    issueNumber: number,
    assignee: string,
    params: { owner?: string; repo?: string }
  ): Promise<
    BaseResponse<RestEndpointMethodTypes['issues']['removeAssignees']['response']['data']>
  > {
    try {
      const validation = this.validateConfig({ owner: params.owner, repo: params.repo });
      const repo = validation.repoName;
      const owner = validation.repoOwner;
      const canBeAssigned = await this.checkUserCanBeAssigned({
        owner,
        repo,
        issueNumber,
        assignee
      });
      if (!canBeAssigned) {
        throw new Error(
          `User '${assignee}' cannot be removed from this issue. Please provide a valid GitHub username of the user who can be assigned to an issue or pull request in this repository.`
        );
      }
      const response = await this.client.issues.removeAssignees({
        owner,
        repo,
        issue_number: issueNumber,
        assignees: [assignee]
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error removing assignee from GitHub issue:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to remove assignee from GitHub issue'
      };
    }
  }

  async getUsers(
    owner: string
  ): Promise<BaseResponse<RestEndpointMethodTypes['orgs']['listMembers']['response']['data']>> {
    try {
      const orgOwner = owner || this.config.owner;
      if (!orgOwner) throw new Error('Owner must be provided when no default owner is configured.');
      const response = await this.client.orgs.listMembers({
        org: orgOwner
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching GitHub users:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch GitHub users'
      };
    }
  }

  async createIssue(params: CreateIssueParams): Promise<BaseResponse<{ issueUrl: string }>> {
    try {
      let messages: string[] = [];
      const { owner, repo, title, description, assignee } = params;

      const response = await this.client.issues.create({
        owner,
        repo,
        title,
        body: description || ''
      });

      const issueNumber = response.data.number;
      if (assignee) {
        const isAssigned = await this.addAssigneeToIssue(issueNumber, assignee, {
          owner,
          repo
        });
        if (!isAssigned.success) {
          messages.push(isAssigned.error || `Failed to assign user ${assignee} to issue`);
        }
      }
      return {
        success: true,
        data: {
          issueUrl: response.data.html_url
        },
        messages
      };
    } catch (error) {
      console.error('Error creating GitHub issue:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create GitHub issue'
      };
    }
  }

  async searchCode(
    params: CodeSearchParams
  ): Promise<BaseResponse<RestEndpointMethodTypes['search']['code']['response']['data']['items']>> {
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

  async createOrUpdateFile(
    params: CreateOrUpdateFileParams
  ): Promise<
    BaseResponse<RestEndpointMethodTypes['repos']['createOrUpdateFileContents']['response']['data']>
  > {
    try {
      const { owner, repo, path, content, message, branch, sha } = params;
      const response = await this.client.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        branch,
        sha
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating/updating GitHub file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create/update GitHub file'
      };
    }
  }

  async searchRepositories(
    params: SearchRepositoriesParams
  ): Promise<BaseResponse<RestEndpointMethodTypes['search']['repos']['response']['data']>> {
    try {
      const { query, page } = params;
      const response = await this.client.search.repos({
        q: query,
        page,
        per_page: 100
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error searching GitHub repositories:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search GitHub repositories'
      };
    }
  }

  async createRepository(
    params: CreateRepositoryParams
  ): Promise<
    BaseResponse<RestEndpointMethodTypes['repos']['createForAuthenticatedUser']['response']['data']>
  > {
    try {
      const { name, description, private: isPrivate, autoInit } = params;
      const response = await this.client.repos.createForAuthenticatedUser({
        name,
        description,
        private: isPrivate,
        auto_init: autoInit
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating GitHub repository:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create GitHub repository'
      };
    }
  }

  async getFileContents(
    params: GetFileContentsParams
  ): Promise<BaseResponse<RestEndpointMethodTypes['repos']['getContent']['response']['data']>> {
    try {
      const { owner, repo, path, branch } = params;
      const response = await this.client.repos.getContent({
        owner,
        repo,
        path,
        ref: branch
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error getting GitHub file contents:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get GitHub file contents'
      };
    }
  }

  async createPullRequest(
    params: CreatePullRequestParams
  ): Promise<BaseResponse<RestEndpointMethodTypes['pulls']['create']['response']['data']>> {
    try {
      const { owner, repo, title, head, base, body, draft, maintainer_can_modify } = params;
      const response = await this.client.pulls.create({
        owner,
        repo,
        title,
        head,
        base,
        body,
        draft,
        maintainer_can_modify
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating GitHub pull request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create GitHub pull request'
      };
    }
  }

  async createBranch(
    params: CreateBranchParams
  ): Promise<BaseResponse<RestEndpointMethodTypes['git']['createRef']['response']['data']>> {
    try {
      const { owner, repo, branch, from_branch } = params;
      const ref = await this.client.git.getRef({
        owner,
        repo,
        ref: `heads/${from_branch || 'main'}`
      });
      const response = await this.client.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branch}`,
        sha: ref.data.object.sha
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating GitHub branch:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create GitHub branch'
      };
    }
  }

  async listCommits(
    params: ListCommitsParams
  ): Promise<BaseResponse<RestEndpointMethodTypes['repos']['listCommits']['response']['data']>> {
    try {
      const { owner, repo, sha, page, perPage } = params;
      const response = await this.client.repos.listCommits({
        owner,
        repo,
        sha,
        page,
        per_page: perPage
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error listing GitHub commits:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list GitHub commits'
      };
    }
  }

  async listIssues(
    params: ListIssuesParams
  ): Promise<BaseResponse<RestEndpointMethodTypes['issues']['listForRepo']['response']['data']>> {
    try {
      const { owner, repo, state, sort, direction, since, page, per_page, labels } = params;
      const response = await this.client.issues.listForRepo({
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
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error listing GitHub issues:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list GitHub issues'
      };
    }
  }

  async updateIssue(
    params: UpdateIssueParams
  ): Promise<BaseResponse<RestEndpointMethodTypes['issues']['update']['response']['data']>> {
    try {
      const { owner, repo, issue_number, title, body, state, labels, assignees, milestone } =
        params;
      const response = await this.client.issues.update({
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
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating GitHub issue:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update GitHub issue'
      };
    }
  }

  async addIssueComment(
    params: AddIssueCommentParams
  ): Promise<BaseResponse<RestEndpointMethodTypes['issues']['createComment']['response']['data']>> {
    try {
      const { owner, repo, issue_number, body } = params;
      const response = await this.client.issues.createComment({
        owner,
        repo,
        issue_number,
        body
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error adding GitHub issue comment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add GitHub issue comment'
      };
    }
  }

  async searchUsers(
    params: SearchUsersParams
  ): Promise<BaseResponse<RestEndpointMethodTypes['search']['users']['response']['data']>> {
    try {
      const { q, sort, order, per_page, page } = params;
      const response = await this.client.search.users({
        q,
        sort,
        order,
        per_page,
        page
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error searching GitHub users:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search GitHub users'
      };
    }
  }

  async getPullRequest(
    params: PullRequestParams
  ): Promise<BaseResponse<RestEndpointMethodTypes['pulls']['get']['response']['data']>> {
    try {
      const { owner, repo, pull_number } = params;
      const response = await this.client.pulls.get({
        owner,
        repo,
        pull_number
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error getting GitHub pull request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get GitHub pull request'
      };
    }
  }

  async listPullRequests(
    params: ListPullRequestsParams
  ): Promise<BaseResponse<SearchPullRequestsResponse['data']>> {
    try {
      const { owner, repo, state, author, keyword, sort, order, per_page, page } = params;
      let query = `repo:${owner}/${repo} is:pr`;

      if (keyword) query += ` in:title,body ${keyword}`;
      if (author) query += ` author:${author}`;
      if (state) query += ` state:${state}`;
      const response = await this.client.search.issuesAndPullRequests({
        q: query,
        sort,
        order,
        per_page,
        page
      });
      return {
        success: true,
        data: {
          pullRequests: response.data.items
        }
      };
    } catch (error) {
      console.error('Error listing GitHub pull requests:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list GitHub pull requests'
      };
    }
  }

  async createPullRequestReview(
    params: CreatePullRequestReviewParams
  ): Promise<BaseResponse<RestEndpointMethodTypes['pulls']['createReview']['response']['data']>> {
    try {
      const { owner, repo, pull_number, body, event, commit_id, comments } = params;
      const response = await this.client.pulls.createReview({
        owner,
        repo,
        pull_number,
        body,
        event,
        commit_id,
        comments
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating GitHub pull request review:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create GitHub pull request review'
      };
    }
  }

  async mergePullRequest(
    params: MergePullRequestParams
  ): Promise<BaseResponse<RestEndpointMethodTypes['pulls']['merge']['response']['data']>> {
    try {
      const { owner, repo, pull_number, commit_title, commit_message, merge_method } = params;
      const response = await this.client.pulls.merge({
        owner,
        repo,
        pull_number,
        commit_title,
        commit_message,
        merge_method
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error merging GitHub pull request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to merge GitHub pull request'
      };
    }
  }

  async getPullRequestFiles(
    params: PullRequestParams
  ): Promise<BaseResponse<RestEndpointMethodTypes['pulls']['listFiles']['response']['data']>> {
    try {
      const { owner, repo, pull_number } = params;
      const response = await this.client.pulls.listFiles({
        owner,
        repo,
        pull_number
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error getting GitHub pull request files:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get GitHub pull request files'
      };
    }
  }

  async getPullRequestStatus(
    params: PullRequestParams
  ): Promise<
    BaseResponse<RestEndpointMethodTypes['repos']['getCombinedStatusForRef']['response']['data']>
  > {
    try {
      const { owner, repo, pull_number } = params;
      const pr = await this.client.pulls.get({
        owner,
        repo,
        pull_number
      });
      const response = await this.client.repos.getCombinedStatusForRef({
        owner,
        repo,
        ref: pr.data.head.sha
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error getting GitHub pull request status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get GitHub pull request status'
      };
    }
  }

  async updatePullRequestBranch(
    params: UpdatePullRequestBranchParams
  ): Promise<BaseResponse<RestEndpointMethodTypes['pulls']['updateBranch']['response']['data']>> {
    try {
      const { owner, repo, pull_number, expected_head_sha } = params;
      const response = await this.client.pulls.updateBranch({
        owner,
        repo,
        pull_number,
        expected_head_sha
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating GitHub pull request branch:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update GitHub pull request branch'
      };
    }
  }

  async getPullRequestComments(
    params: PullRequestParams
  ): Promise<
    BaseResponse<RestEndpointMethodTypes['pulls']['listReviewComments']['response']['data']>
  > {
    try {
      const { owner, repo, pull_number } = params;
      const response = await this.client.pulls.listReviewComments({
        owner,
        repo,
        pull_number
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error getting GitHub pull request comments:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get GitHub pull request comments'
      };
    }
  }

  async getPullRequestReviews(
    params: PullRequestParams
  ): Promise<BaseResponse<RestEndpointMethodTypes['pulls']['listReviews']['response']['data']>> {
    try {
      const { owner, repo, pull_number } = params;
      const response = await this.client.pulls.listReviews({
        owner,
        repo,
        pull_number
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error getting GitHub pull request reviews:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get GitHub pull request reviews'
      };
    }
  }

  async searchCodeGlobal(params: SearchCodeParams): Promise<BaseResponse<SearchCodeResponse>> {
    try {
      const response = await this.client.rest.search.code({
        q: params.q,
        order: params.order,
        per_page: params.per_page,
        page: params.page
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error searching GitHub code globally:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search GitHub code globally'
      };
    }
  }

  async searchIssuesGlobal(
    params: SearchIssuesGlobalParams
  ): Promise<BaseResponse<SearchIssuesResponse['data']>> {
    try {
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
    } catch (error) {
      console.error('Error searching GitHub issues globally:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search GitHub issues globally'
      };
    }
  }
}

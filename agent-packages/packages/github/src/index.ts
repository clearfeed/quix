import { Octokit, RestEndpointMethodTypes } from '@octokit/rest';
import { BaseResponse, BaseService } from '@clearfeed-ai/quix-common-agent';
import {
  GitHubConfig,
  SearchIssuesParams,
  SearchIssuesResponse,
} from './types';
import { CreateIssueParams } from './types/index';

export * from './types';
export * from './tools';

export class GitHubService implements BaseService<GitHubConfig> {
  private client: Octokit;

  validateConfig({ owner, repo }: { owner?: string, repo?: string }) {
    const repoOwner = owner || this.config.owner;
    const repoName = repo || this.config.repo;

    if (!repoOwner) throw new Error('Owner must be provided or configured.');
    if (!repoName) throw new Error('Repository name must be provided or configured.');

    return { isValid: true, repoOwner, repoName };
  }

  constructor(private config: GitHubConfig) {
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
            .filter(item => 'pull_request' in item)
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

  async getUsers(): Promise<BaseResponse<RestEndpointMethodTypes['orgs']['listMembers']['response']['data']>> {
    try {
      const owner = this.config.owner;
      if (!owner) throw new Error('Owner must be provided when no default owner is configured.');
      const response = await this.client.orgs.listMembers({
        org: owner
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
}
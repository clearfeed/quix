import { Octokit, RestEndpointMethodTypes } from '@octokit/rest';
import { BaseResponse, BaseService } from '@clearfeed-ai/quix-common-agent';
import {
  GitHubConfig,
  SearchIssuesParams,
  SearchIssuesResponse,
  GetPRResponse,
} from './types';

export * from './types';
export * from './tools';

export class GitHubService implements BaseService<GitHubConfig> {
  private client: Octokit;

  validateConfig() {
    if (!this.config.token || !this.config.owner) {
      return { isValid: false, error: 'GitHub integration is not configured. Please set GITHUB_TOKEN and GITHUB_OWNER environment variables.' };
    }
    return { isValid: true };
  }

  constructor(private config: GitHubConfig) {
    this.client = new Octokit({ auth: config.token });
    if (!config.token || !config.owner) {
      throw new Error('GitHub integration is not configured. Please set GITHUB_TOKEN and GITHUB_OWNER environment variables.');
    }
  }

  async searchIssues(params: SearchIssuesParams): Promise<SearchIssuesResponse> {
    try {

      let query = `repo:${this.config.owner}/${params.repo} is:${params.type}`;
      if (params.keyword) query += ` in:title,body ${params.keyword}`;
      if (params.reporter && params.reporter !== '') query += ` author:${params.reporter}`;

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

  async getIssue(issueNumber: number, repo: string): Promise<BaseResponse<RestEndpointMethodTypes['issues']['get']['response']['data']>> {
    try {
      const response = await this.client.issues.get({
        owner: this.config.owner,
        repo,
        issue_number: issueNumber
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching GitHub issue:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch GitHub issue' };
    }
  }

  async addAssigneeToIssue(issueNumber: number, repo: string, assignee: string): Promise<
    BaseResponse<RestEndpointMethodTypes['issues']['addAssignees']['response']['data']>
  > {
    try {
      const response = await this.client.issues.addAssignees({
        owner: this.config.owner,
        repo,
        issue_number: issueNumber,
        assignees: [assignee]
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error assigning GitHub PR:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to assign GitHub PR' };
    }
  }

  async removeAssigneeFromIssue(issueNumber: number, repo: string, assignee: string): Promise<
    BaseResponse<RestEndpointMethodTypes['issues']['removeAssignees']['response']['data']>
  > {
    try {
      const response = await this.client.issues.removeAssignees({
        owner: this.config.owner,
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
      const response = await this.client.orgs.listMembers({
        org: this.config.owner
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching GitHub users:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch GitHub users' };
    }
  }
} 
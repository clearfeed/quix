import { Octokit, RestEndpointMethodTypes } from '@octokit/rest';
import { BaseResponse, BaseService } from '@clearfeed-ai/quix-common-agent';
import {
  GitHubConfig,
  SearchIssuesParams,
  SearchIssuesResponse,
  GetPRResponse,
} from './types';
import { CreateIssueParams } from './types/index';

export * from './types';
export * from './tools';

export class GitHubService implements BaseService<GitHubConfig> {
  private client: Octokit;

  validateConfig() {
    if (!this.config.token || !this.config.owner || !this.config.repo) {
      return { isValid: false, error: 'GitHub integration is not configured. Please pass in a token, owner and a repo.' };
    }
    return { isValid: true };
  }

  constructor(private config: GitHubConfig) {
    this.client = new Octokit({ auth: config.token });
    if (!config.token) {
      throw new Error('GitHub integration is not configured. Please install Github in your app.');
    }
  }

  async searchIssues(params: SearchIssuesParams): Promise<SearchIssuesResponse> {
    try {
      if (!this.config.owner) {
        return {
          success: false,
          error: 'Owner must be provided when no default owner is configured.'
        }
      }
      if (!params.repo) {
        return {
          success: false,
          error: 'Repository name must be provided to search issues.'
        }
      }

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
      if (!this.config.owner) {
        return {
          success: false,
          error: 'Owner must be provided when no default owner is configured.'
        }
      }

      if (!repo && !this.config.repo) {
        return {
          success: false,
          error: 'Repository name must be provided when no default Repository is configured.'
        }
      }

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
      if (!this.config.owner) {
        return {
          success: false,
          error: 'Owner must be provided when no default owner is configured.'
        }
      }

      if (!repo && !this.config.repo) {
        return {
          success: false,
          error: 'Repository name must be provided when no default Repository is configured.'
        }
      }

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
      if (!this.config.owner) {
        return {
          success: false,
          error: 'Owner must be provided when no default owner is configured.'
        }
      }

      if (!repo && !this.config.repo) {
        return {
          success: false,
          error: 'Repository name must be provided when no default Repository is configured.'
        }
      }

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
      if (!this.config.owner) {
        return {
          success: false,
          error: 'Owner must be provided when no default owner is configured.'
        }
      }

      const response = await this.client.orgs.listMembers({
        org: this.config.owner
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching GitHub users:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch GitHub users' };
    }
  }

  async createIssue(params: CreateIssueParams): Promise<BaseResponse<{ issueUrl: string }>> {
    try {
      const owner = params?.owner || this.config.owner;
      const repo = params?.repo || this.config.repo;
      const title = params.title;
      const description = params?.description;

      if (!owner) {
        return {
          success: false,
          error: 'Owner must be provided when no default owner is configured'
        }
      }

      if (!repo) {
        return {
          success: false,
          error: 'Repository name must be provided when no default repository is configured'
        }
      }

      const response = await this.client.issues.create({
        owner,
        repo,
        title,
        body: description || "No description provided.",
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
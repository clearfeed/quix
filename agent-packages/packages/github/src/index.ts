import { Octokit } from '@octokit/rest';
import { BaseService } from '@clearfeed-ai/quix-common-agent';
import {
  GitHubConfig,
  SearchPRsParams,
  SearchPRsResponse,
  GetPRResponse,
  PullRequest
} from './types';

export * from './types';
export * from './tools';

export class GitHubService implements BaseService<GitHubConfig> {
  private client: Octokit;

  constructor(private config: GitHubConfig) {
    this.client = new Octokit({ auth: config.token });
  }

  validateConfig(): { isValid: boolean; error?: string } {
    if (!this.config.token || !this.config.owner) {
      return {
        isValid: false,
        error: 'GitHub integration is not configured. Please set GITHUB_TOKEN and GITHUB_OWNER environment variables.'
      };
    }
    return { isValid: true };
  }

  private formatPR(pr: any): PullRequest {
    return {
      number: pr.number,
      title: pr.title,
      status: pr.state,
      reporter: pr.user.login,
      createdAt: pr.created_at,
      lastUpdated: pr.updated_at,
      url: pr.html_url,
      description: pr.body,
      labels: pr.labels.map((label: { name: string }) => label.name)
    };
  }

  async searchPRs(params: SearchPRsParams): Promise<SearchPRsResponse> {
    try {
      const validation = this.validateConfig();
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      let query = `repo:${this.config.owner}/${params.repo} is:pull-request`;
      if (params.status) query += ` is:${params.status}`;
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
          pullRequests: response.data.items
            .filter(item => 'pull_request' in item)
            .map(pr => this.formatPR(pr))
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

  async getPR(prNumber: number, repo: string): Promise<GetPRResponse> {
    try {
      const validation = this.validateConfig();
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const response = await this.client.pulls.get({
        owner: this.config.owner,
        repo,
        pull_number: prNumber
      });

      return {
        success: true,
        data: {
          pullRequest: this.formatPR(response.data)
        }
      };
    } catch (error) {
      console.error('Error fetching GitHub PR:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch GitHub PR'
      };
    }
  }
} 
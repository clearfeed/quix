import { Octokit } from '@octokit/rest';
import {
  GitHubConfig,
  GitHubPR,
  GitHubPRResponse,
  SearchPRsParams,
  SearchPRsResponse,
  GetPRResponse
} from './types';

export * from './types';
export * from './tools';

export class GitHubService {
  private client: Octokit | null = null;
  private config: GitHubConfig;

  constructor(config: GitHubConfig) {
    this.config = config;
  }

  private validateConfig(): { isValid: boolean; error?: string } {
    if (!this.config.token || !this.config.owner) {
      return {
        isValid: false,
        error: 'GitHub integration is not configured. Please set GITHUB_TOKEN and GITHUB_OWNER environment variables.'
      };
    }
    return { isValid: true };
  }

  private getClient(): Octokit {
    if (!this.client) {
      const validation = this.validateConfig();
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      this.client = new Octokit({
        auth: this.config.token
      });
    }
    return this.client;
  }

  private formatPR(pr: GitHubPR): GitHubPRResponse {
    return {
      number: pr.number,
      title: pr.title,
      status: pr.state,
      reporter: pr.user.login,
      createdAt: pr.created_at,
      lastUpdated: pr.updated_at,
      url: pr.html_url,
      description: pr.body,
      labels: pr.labels.map(label => label.name)
    };
  }

  async searchPRs(params: SearchPRsParams): Promise<SearchPRsResponse> {
    try {
      const validation = this.validateConfig();
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      let query = `repo:${this.config.owner}/${params.repo}`;

      if (params.status) {
        query += ` is:${params.status}`;
      }

      if (params.keyword) {
        query += ` in:title,body ${params.keyword}`;
      }

      if (params.reporter) {
        query += ` author:${params.reporter}`;
      }

      query += ` is:pr`;

      const response = await this.getClient().search.issuesAndPullRequests({
        q: query,
        per_page: 10,
        sort: 'updated',
        order: 'desc'
      });

      const prs = response.data.items.map((pr: any) => this.formatPR(pr as unknown as GitHubPR));

      return {
        success: true,
        data: { prs }
      };
    } catch (error) {
      console.error('Error searching GitHub PRs:', error);
      return {
        success: false,
        error: 'Failed to search GitHub PRs'
      };
    }
  }

  async getPR(prNumber: number, repo: string): Promise<GetPRResponse> {
    try {
      const validation = this.validateConfig();
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const response = await this.getClient().pulls.get({
        owner: this.config.owner,
        repo: repo,
        pull_number: prNumber
      });

      return {
        success: true,
        data: {
          pr: this.formatPR(response.data as unknown as GitHubPR)
        }
      };
    } catch (error) {
      console.error('Error fetching GitHub PR:', error);
      return {
        success: false,
        error: 'Failed to fetch GitHub PR'
      };
    }
  }
} 
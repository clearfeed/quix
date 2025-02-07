import { Octokit } from '@octokit/rest';
import config from '../config';

interface GitHubPR {
  number: number;
  title: string;
  state: string;
  user: {
    login: string;
  };
  created_at: string;
  updated_at: string;
  html_url: string;
  body?: string;
  labels: Array<{ name: string }>;
}

interface GitHubPRResponse {
  number: number;
  title: string;
  status: string;
  reporter: string;
  createdAt: string;
  lastUpdated: string;
  url: string;
  description?: string;
  labels: string[];
}

export class GitHubService {
  private static instance: GitHubService;
  private client: Octokit | null = null;

  private constructor() { }

  static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService();
    }
    return GitHubService.instance;
  }

  private validateConfig(): { isValid: boolean; error?: string } {
    if (!config.github.token || !config.github.owner) {
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
        auth: config.github.token
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

  async searchPRs(params: {
    repo: string;
    status?: string;
    keyword?: string;
    reporter?: string;
  }): Promise<{ success: boolean; prs?: GitHubPRResponse[]; error?: string }> {
    try {
      const validation = this.validateConfig();
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      let query = `repo:${config.github.owner}/${params.repo}`;

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
        prs
      };
    } catch (error) {
      console.error('Error searching GitHub PRs:', error);
      return {
        success: false,
        error: 'Failed to search GitHub PRs'
      };
    }
  }

  async getPR(prNumber: number, repo: string): Promise<{ success: boolean; pr?: GitHubPRResponse; error?: string }> {
    try {
      const validation = this.validateConfig();
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const response = await this.getClient().pulls.get({
        owner: config.github.owner!,
        repo: repo,
        pull_number: prNumber
      });

      return {
        success: true,
        pr: this.formatPR(response.data as unknown as GitHubPR)
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

// Export the singleton instance
export const github = GitHubService.getInstance(); 
import { BaseService, BaseResponse } from '@clearfeed-ai/quix-common-agent';
import {
  JiraConfig,
  CreateIssueParams,
  GetIssueResponse,
  SearchIssuesResponse,
  AssignIssueResponse,
} from './types';
import JiraClient from './JiraClient';
import { AxiosError } from 'axios';

export * from './types';
export * from './tools';

export class JiraService implements BaseService<JiraConfig> {
  private client: JiraClient;

  constructor(private config: JiraConfig) {
    this.client = new JiraClient({
      host: config.host,
      username: config.username,
      password: config.password,
      apiVersion: '3',
    });
  }

  validateConfig(): { isValid: boolean; error?: string } {
    if (!this.config.host || !this.config.password) {
      return {
        isValid: false,
        error: 'JIRA integration is not configured. Please set JIRA_HOST and JIRA_API_TOKEN environment variables.'
      };
    }
    return { isValid: true };
  }

  async searchIssues(keyword: string): Promise<BaseResponse<SearchIssuesResponse>> {
    try {
      const validation = this.validateConfig();
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const jql = `text ~ "${keyword}" ORDER BY updated DESC`;
      const response = await this.client.searchIssues(jql, { maxResults: 10 });

      return {
        success: true,
        data: {
          issues: response.issues || []
        }
      };
    } catch (error) {
      console.error('Error searching Jira issues:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search Jira issues'
      };
    }
  }

  async getIssue(issueId: string): Promise<GetIssueResponse> {
    try {
      const validation = this.validateConfig();
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const issue = await this.client.getIssue(issueId);

      return {
        success: true,
        data: {
          issue
        }
      };
    } catch (error) {
      console.error('Error fetching Jira issue:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Jira issue'
      };
    }
  }

  async createIssue(params: CreateIssueParams): Promise<GetIssueResponse> {
    try {
      const validation = this.validateConfig();
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const issueData = {
        summary: params.summary,
        description: params.description,
        projectKey: params.projectKey,
        issueType: params.issueType,
        priority: params.priority,
        assignee: params.assignee
      };

      const issue = await this.client.createIssue(issueData);
      return {
        success: true,
        data: {
          issue
        }
      };
    } catch (error) {
      console.error('Error creating Jira issue:', (error as AxiosError).response?.data);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create Jira issue'
      };
    }
  }

  async assignIssue(issueId: string, assignee: string): Promise<AssignIssueResponse> {
    try {
      const validation = this.validateConfig();
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // First find the user's accountId
      const users = await this.client.searchUsers(assignee);

      if (!users || users.length === 0) {
        return {
          success: false,
          error: `Could not find user with username/email: ${assignee}`
        };
      }
      const accountId = users[0].accountId;
      await this.client.assignIssue(issueId, accountId);

      return {
        success: true
      };
    } catch (error) {
      console.error('Error assigning Jira issue:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign Jira issue'
      };
    }
  }
} 
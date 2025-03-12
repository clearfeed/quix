import { BaseService, BaseResponse } from '@clearfeed-ai/quix-common-agent';
import {
  JiraConfig,
  CreateIssueParams,
  GetIssueResponse,
  SearchIssuesResponse,
  AssignIssueResponse,
  JiraClientConfig,
  AddCommentParams,
  AddCommentResponse,
  GetCommentsResponse
} from './types';
import JiraClient from './JiraClient';
import { AxiosError } from 'axios';

export * from './types';
export * from './tools';

export class JiraService implements BaseService<JiraConfig> {
  private client: JiraClient;

  constructor(private config: JiraConfig) {
    const jiraOpts: JiraClientConfig = {
      host: config.apiHost ? config.apiHost : config.host,
      apiVersion: '3',
      auth: config.auth
    }
    this.client = new JiraClient(jiraOpts);
  }

  validateConfig(): { isValid: boolean; error?: string } {
    if (!this.config.host) {
      return {
        isValid: false,
        error: 'JIRA integration is not configured. Please pass in a host and auth object.'
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

      const projectKey = params.projectKey || this.config.defaultConfig?.projectKey;
      if (!projectKey) {
        return {
          success: false,
          error: 'Project key must be provided when no default project is configured'
        };
      }

      const issueData = {
        summary: params.summary,
        description: params.description,
        projectKey,
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

  async addComment(params: AddCommentParams): Promise<AddCommentResponse> {
    try {
      const validation = this.validateConfig();
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const comment = await this.client.addComment(params.issueId, params.comment);

      return {
        success: true,
        data: {
          comment
        }
      };
    } catch (error) {
      console.error('Error adding comment to Jira issue:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add comment to Jira issue'
      };
    }
  }

  async getComments(issueId: string): Promise<GetCommentsResponse> {
    try {
      const validation = this.validateConfig();
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const comments = await this.client.getComments(issueId, { maxResults: 20 });

      return {
        success: true,
        data: {
          comments
        }
      };
    } catch (error) {
      console.error('Error fetching comments for Jira issue:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch comments for Jira issue'
      };
    }
  }
} 
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
  GetCommentsResponse,
  UpdateIssueFields,
  UpdateIssueResponse,
  SearchUsersResponse,
  GetPrioritiesResponse
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
    };
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

  async searchIssues(
    keyword: string
  ): Promise<
    BaseResponse<{ issues: (SearchIssuesResponse['issues'][number] & { url: string })[] }>
  > {
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
          issues: (response.issues || []).map((issue) => ({
            ...issue,
            url: this.getIssueUrl(issue)
          }))
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
          issue: {
            ...issue,
            url: this.getIssueUrl(issue)
          }
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
  private getIssueUrl(issue: { key: string }): string {
    return `${this.config.host}/browse/${issue.key}`;
  }

  async createIssue(params: CreateIssueParams): Promise<GetIssueResponse> {
    try {
      const validation = this.validateConfig();
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const projectKey = params.projectKey;
      if (!projectKey) {
        return {
          success: false,
          error: 'Project key must be provided when no default project is configured'
        };
      }

      const issueData: CreateIssueParams = {
        summary: params.summary,
        projectKey,
        issueType: params.issueType
      };
      if (params.description) {
        issueData.description = params.description;
      }
      if (params.assigneeId) {
        issueData.assigneeId = params.assigneeId;
      }
      if (params.priority) {
        issueData.priority = params.priority;
      }

      const issue = await this.client.createIssue(issueData);
      return {
        success: true,
        data: {
          issue: {
            ...issue,
            url: this.getIssueUrl(issue)
          }
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

  async searchUsers(query: string): Promise<SearchUsersResponse> {
    try {
      const users = await this.client.searchUsers(query);

      return {
        success: true,
        data: { users }
      };
    } catch (error) {
      console.error('Error searching Jira users:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search Jira users'
      };
    }
  }

  async assignIssue(issueId: string, accountId: string): Promise<AssignIssueResponse> {
    try {
      const validation = this.validateConfig();
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

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

  private getCommentUrl(payload: { issueId: string; commentId: string }): string {
    return `${this.config.host}/browse/${payload.issueId}?focusedCommentId=${payload.commentId}`;
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
          comment: {
            ...comment,
            url: this.getCommentUrl({ issueId: params.issueId, commentId: comment.id })
          }
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
          comments: (comments.comments || []).map((comment) => ({
            ...comment,
            url: this.getCommentUrl({ issueId, commentId: comment.id })
          }))
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

  async updateIssue(params: {
    issueId: string;
    fields: UpdateIssueFields;
  }): Promise<UpdateIssueResponse> {
    try {
      const validation = this.validateConfig();
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      await this.client.updateIssue(params.issueId, params.fields);

      return {
        success: true,
        data: {
          issueId: params.issueId,
          url: this.getIssueUrl({ key: params.issueId }),
          fields: params.fields
        }
      };
    } catch (error) {
      console.error('Error updating Jira issue:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update Jira issue'
      };
    }
  }

  async getPriorities(): Promise<GetPrioritiesResponse> {
    try {
      const priorities = await this.client.getPriorities();
      return {
        success: true,
        data: {
          priorities
        }
      };
    } catch (error) {
      console.error('Error fetching Jira priorities:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Jira priorities'
      };
    }
  }
}

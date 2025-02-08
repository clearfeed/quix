import JiraClient from 'jira-client';
import { BaseService } from '@clearfeed/common-agent';
import {
  JiraConfig,
  JiraIssue,
  CreateIssueParams,
  GetIssueResponse,
  SearchIssuesResponse,
  AssignIssueResponse
} from './types';

export * from './types';
export * from './tools';

interface JiraIssueFields {
  summary?: string;
  status?: { name: string };
  assignee?: { displayName: string };
  priority?: { name: string };
  issuetype?: { name: string };
  description?: string;
  created?: string;
  updated?: string;
  reporter?: { displayName: string };
  labels?: string[];
}

interface JiraApiIssue {
  key: string;
  fields: JiraIssueFields;
}

interface JiraSearchResponse {
  issues: JiraApiIssue[];
}

export class JiraService implements BaseService<JiraConfig> {
  private client: JiraClient;

  constructor(private config: JiraConfig) {
    this.client = new JiraClient({
      protocol: 'https',
      host: config.host,
      username: config.username,
      password: config.password,
      apiVersion: '2',
      strictSSL: true
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

  private formatIssue(issue: JiraApiIssue): JiraIssue {
    return {
      id: issue.key,
      summary: issue.fields?.summary || '',
      status: issue.fields?.status?.name || 'To Do',
      assignee: issue.fields?.assignee?.displayName || 'Unassigned',
      priority: issue.fields?.priority?.name || 'None',
      type: issue.fields?.issuetype?.name || 'Task',
      description: issue.fields?.description || '',
      created: issue.fields?.created || new Date().toISOString(),
      reporter: issue.fields?.reporter?.displayName || 'Unknown',
      lastUpdated: issue.fields?.updated || new Date().toISOString(),
      labels: issue.fields?.labels || []
    };
  }

  async searchIssues(keyword: string): Promise<SearchIssuesResponse> {
    try {
      const validation = this.validateConfig();
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const jql = `text ~ "${keyword}" ORDER BY updated DESC`;
      const response = await this.client.searchJira(jql, { maxResults: 10 });

      return {
        success: true,
        data: {
          issues: response.issues.map((issue: JiraApiIssue) => this.formatIssue(issue))
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

      const issue = await this.client.findIssue(issueId);

      return {
        success: true,
        data: {
          issue: this.formatIssue(issue as JiraApiIssue)
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
        fields: {
          project: {
            key: params.projectKey
          },
          summary: params.summary,
          description: params.description,
          issuetype: {
            name: params.issueType
          },
          ...(params.priority && {
            priority: {
              name: params.priority
            }
          }),
          ...(params.assignee && {
            assignee: {
              name: params.assignee
            }
          })
        }
      };

      const issue = await this.client.addNewIssue(issueData) as JiraApiIssue;

      // If the response doesn't have fields (which can happen right after creation),
      // construct a minimal issue object
      const minimalIssue: JiraApiIssue = {
        key: issue.key,
        fields: {
          summary: params.summary,
          status: { name: 'To Do' },
          issuetype: { name: params.issueType },
          updated: new Date().toISOString(),
        }
      };

      return {
        success: true,
        data: {
          issue: this.formatIssue(issue.fields ? issue : minimalIssue)
        }
      };
    } catch (error) {
      console.error('Error creating Jira issue:', error);
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
      const users = await this.client.searchUsers({
        query: assignee,
        startAt: 0,
        maxResults: 1,
        includeActive: true
      });

      if (!users || users.length === 0) {
        return {
          success: false,
          error: `Could not find user with username/email: ${assignee}`
        };
      }

      const accountId = users[0].accountId;
      await this.client.updateAssignee(issueId, accountId);
      const issue = await this.client.findIssue(issueId) as JiraApiIssue;

      return {
        success: true,
        data: {
          issue: this.formatIssue(issue)
        }
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
import JiraClient from 'jira-client';
import {
  JiraConfig,
  JiraIssue,
  JiraIssueResponse,
  CreateIssueParams,
  GetIssueResponse,
  SearchIssuesResponse,
  AssignIssueResponse
} from './types';

export * from './types';
export * from './tools';

export class JiraService {
  private client: JiraClient | null = null;
  private config: JiraConfig;

  constructor(config: JiraConfig) {
    this.config = config;
  }

  private validateConfig(): { isValid: boolean; error?: string } {
    if (!this.config.host || !this.config.password) {
      return {
        isValid: false,
        error: 'JIRA integration is not configured. Please set JIRA_HOST and JIRA_API_TOKEN environment variables.'
      };
    }
    return { isValid: true };
  }

  private getClient(): JiraClient {
    if (!this.client) {
      const validation = this.validateConfig();
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      this.client = new JiraClient({
        host: this.config.host,
        username: this.config.username,
        password: this.config.password,
        protocol: 'https',
        apiVersion: '2',
        strictSSL: true
      });
    }
    return this.client;
  }

  private formatIssue(issue: JiraIssue, inputParams?: Partial<JiraIssueResponse>): JiraIssueResponse {
    return {
      id: issue.key,
      summary: issue.fields?.summary || inputParams?.summary || '',
      status: issue.fields?.status?.name || 'To Do',
      assignee: issue.fields?.assignee?.displayName || inputParams?.assignee || 'Unassigned',
      priority: issue.fields?.priority?.name || inputParams?.priority || 'None',
      type: issue.fields?.issuetype?.name || inputParams?.type || 'Task',
      description: issue.fields?.description || inputParams?.description || '',
      created: issue.fields?.created || new Date().toISOString(),
      reporter: issue.fields?.reporter?.displayName || 'Unknown',
      lastUpdated: issue.fields?.updated || new Date().toISOString(),
      labels: issue.fields?.labels || []
    };
  }

  async getIssue(issueId: string): Promise<GetIssueResponse> {
    try {
      const validation = this.validateConfig();
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const issue: JiraIssue = await this.getClient().findIssue(issueId);
      return {
        success: true,
        data: {
          issue: this.formatIssue(issue)
        }
      };
    } catch (error) {
      console.error('Error fetching Jira issue:', error);
      return {
        success: false,
        error: 'Failed to fetch Jira issue'
      };
    }
  }

  async searchIssues(keyword: string): Promise<SearchIssuesResponse> {
    try {
      const validation = this.validateConfig();
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const jql = `text ~ "${keyword}" ORDER BY updated DESC`;
      const response = await this.getClient().searchJira(jql, {
        maxResults: 10,
        fields: ['summary', 'status', 'assignee', 'priority', 'updated', 'issuetype', 'labels'],
      });

      return {
        success: true,
        data: {
          issues: response.issues.map((issue: JiraIssue) => this.formatIssue(issue))
        }
      };
    } catch (error) {
      console.error('Error searching Jira issues:', error);
      return {
        success: false,
        error: 'Failed to search Jira issues'
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

      const issue = await this.getClient().addNewIssue(issueData);

      // If the response doesn't have fields (which can happen right after creation),
      // construct a minimal issue object
      const minimalIssue: JiraIssue = {
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
          issue: this.formatIssue(issue.fields ? issue : minimalIssue, params)
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

  private async findUserAccountId(username: string): Promise<string | null> {
    try {
      const client = this.getClient() as any;
      const users = await client.searchUsers({
        query: username,
        startAt: 0,
        maxResults: 1,
        includeActive: true
      });
      if (users && users.length > 0) {
        return users[0].accountId;
      }
      return null;
    } catch (error) {
      console.error('Error finding user account ID:', error);
      return null;
    }
  }

  async assignIssue(issueId: string, assignee: string): Promise<AssignIssueResponse> {
    try {
      const validation = this.validateConfig();
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const accountId = await this.findUserAccountId(assignee);
      if (!accountId) {
        return {
          success: false,
          error: `Could not find user with username/email: ${assignee}`
        };
      }

      const client = this.getClient() as any;
      await client.updateAssigneeWithId(issueId, accountId);

      return {
        success: true
      };
    } catch (error) {
      console.error('Error assigning Jira issue:', error);
      return {
        success: false,
        error: 'Failed to assign Jira issue'
      };
    }
  }
} 
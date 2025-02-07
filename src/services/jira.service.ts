import JiraClient from 'jira-client';
import config from '../config';

interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    status: { name: string };
    assignee?: { displayName: string };
    priority?: { name: string };
    issuetype: { name: string };
    updated: string;
    description?: string;
    created?: string;
    reporter?: { displayName: string };
    labels?: string[];
  };
}

interface JiraIssueResponse {
  id: string;
  summary: string;
  status: string;
  assignee: string;
  priority: string;
  type: string;
  description?: string;
  created?: string;
  reporter: string;
  lastUpdated: string;
  labels?: string[];
}

export class JiraService {
  private static instance: JiraService;
  private client: JiraClient | null = null;

  private constructor() { }

  static getInstance(): JiraService {
    if (!JiraService.instance) {
      JiraService.instance = new JiraService();
    }
    return JiraService.instance;
  }

  private validateConfig(): { isValid: boolean; error?: string } {
    if (!config.jira.host || !config.jira.password) {
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
        host: config.jira.host!,
        username: config.jira.username,
        password: config.jira.password!,
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

  async getIssue(issueId: string): Promise<{ success: boolean; issue?: JiraIssueResponse; error?: string }> {
    try {
      const validation = this.validateConfig();
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const issue: JiraIssue = await this.getClient().findIssue(issueId);
      return {
        success: true,
        issue: this.formatIssue(issue)
      };
    } catch (error) {
      console.error('Error fetching Jira issue:', error);
      return {
        success: false,
        error: 'Failed to fetch Jira issue'
      };
    }
  }

  async searchIssues(keyword: string): Promise<{ success: boolean; issues?: JiraIssueResponse[]; error?: string }> {
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
        issues: response.issues.map((issue: JiraIssue) => this.formatIssue(issue))
      };
    } catch (error) {
      console.error('Error searching Jira issues:', error);
      return {
        success: false,
        error: 'Failed to search Jira issues'
      };
    }
  }

  async createIssue(params: {
    projectKey: string;
    summary: string;
    description: string;
    issueType: string;
    priority?: string;
    assignee?: string;
  }): Promise<{ success: boolean; issue?: JiraIssueResponse; error?: string }> {
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
        issue: this.formatIssue(issue.fields ? issue : minimalIssue, params)
      };
    } catch (error) {
      console.error('Error creating Jira issue:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create Jira issue'
      };
    }
  }
}

// Export the singleton instance
export const jira = JiraService.getInstance();

// These exports can be removed if not needed elsewhere
// export const getJiraIssue = (issueId: string) => jiraService.getIssue(issueId);
// export const searchJiraIssues = (keyword: string) => jiraService.searchIssues(keyword);
// export const createJiraIssue = (params: Parameters<typeof jiraService.createIssue>[0]) => jiraService.createIssue(params); 
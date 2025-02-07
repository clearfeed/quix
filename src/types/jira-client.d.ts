declare module 'jira-client' {
  interface JiraClientOptions {
    host: string;
    username?: string;
    password?: string;
    protocol?: string;
    apiVersion?: string;
    strictSSL?: boolean;
  }

  interface SearchJiraOptions {
    maxResults?: number;
    fields?: string[];
  }

  class JiraApi {
    constructor(options: JiraClientOptions);
    searchJira(jql: string, options?: SearchJiraOptions): Promise<{
      issues: Array<{
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
      }>;
    }>;
    findIssue(issueId: string): Promise<{
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
    }>;
    addNewIssue(issueData: {
      fields: {
        project: { key: string };
        summary: string;
        description: string;
        issuetype: { name: string };
        priority?: { name: string };
        assignee?: { name: string };
        labels?: string[];
      };
    }): Promise<{
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
    }>;
  }

  export default JiraApi;
} 
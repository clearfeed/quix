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
      };
    }>;
  }

  export default JiraApi;
} 
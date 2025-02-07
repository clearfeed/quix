export interface JiraConfig {
  host: string;
  username: string;
  password: string;
}

export interface JiraIssue {
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

export interface JiraIssueResponse {
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

export interface JiraResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateIssueParams {
  projectKey: string;
  summary: string;
  description: string;
  issueType: string;
  priority?: string;
  assignee?: string;
}

export interface GetIssueResponse extends JiraResponse<{
  issue: JiraIssueResponse;
}> { }

export interface SearchIssuesResponse extends JiraResponse<{
  issues: JiraIssueResponse[];
}> { }

export interface AssignIssueResponse extends JiraResponse<void> { } 
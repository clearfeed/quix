import { CreateIssueParams, JiraClientConfig, JiraIssueResponse, SearchIssuesResponse, JiraProjectResponse, JiraUserResponse } from "./types";
import axios, { AxiosInstance } from "axios";

export class JiraClient {
  private axiosInstance: AxiosInstance;

  constructor(config: JiraClientConfig) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if ('username' in config.auth) {
      headers.Authorization = `Basic ${Buffer.from(`${config.auth.username}:${config.auth.password}`).toString('base64')}`;
    } else {
      headers.Authorization = `Bearer ${config.auth.bearerToken.trim()}`;
    }
    this.axiosInstance = axios.create({
      baseURL: `${config.host}/rest/api/${config.apiVersion}`,
      headers
    });
    console.log('Jira client created', headers);
  }

  async makeApiCall(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    metadata?: {
      data?: Record<string, any>;
      userId?: string;
      maxBodyLength?: number;
      maxContentLength?: number;
      headers?: Record<string, any>;
      params?: Record<string, any>;
    }
  ) {
    let headers: Record<string, any> = {};
    if (metadata?.headers) {
      headers = { ...metadata.headers };
    }

    const response = await this.axiosInstance.request({
      method,
      url: path,
      data: metadata?.data,
      params: metadata?.params,
      headers
    });
    return response.data;
  }

  async assignIssue(issueId: string, accountId: string): Promise<void> {
    await this.makeApiCall('PUT', `/issue/${issueId}/assignee`, {
      data: {
        accountId
      }
    });
  }

  async getIssue(issueId: string): Promise<JiraIssueResponse> {
    const response = await this.makeApiCall('GET', `/issue/${issueId}`);
    return response;
  }

  async searchIssues(jql: string, options: { maxResults?: number }): Promise<SearchIssuesResponse> {
    const response = await this.makeApiCall('GET', '/search', {
      params: { jql, fields: ['summary', 'description', 'status', 'priority', 'assignee'], maxResults: options.maxResults }
    });
    return response;
  }

  async createIssue(issue: CreateIssueParams): Promise<JiraIssueResponse> {
    const project = await this.getProject(issue.projectKey);
    if (!project) {
      throw new Error(`Project ${issue.projectKey} not found`);
    }

    const issueType = project.issueTypes.find(type => type.name === issue.issueType);
    if (!issueType) {
      throw new Error(`Issue type ${issue.issueType} not found in project ${issue.projectKey}`);
    }

    const response = await this.makeApiCall('POST', '/issue', {
      data: {
        fields: {
          project: {
            id: project.id
          },
          issuetype: {
            id: issueType.id
          },
          summary: issue.summary,
          description: {
            content: [
              {
                content: [
                  {
                    text: issue.description,
                    type: "text"
                  }
                ],
                type: "paragraph"
              }
            ],
            type: "doc",
            version: 1
          }
        }
      }
    });
    return this.getIssue(response.key);
  }

  async getProject(key: string): Promise<JiraProjectResponse> {
    const response = await this.makeApiCall('GET', `/project/${key}`);
    return response;
  }

  async searchUsers(query: string): Promise<JiraUserResponse[]> {
    const response = await this.makeApiCall('GET', `/user/search`, {
      params: { query }
    });
    return response;
  }
}

export default JiraClient;
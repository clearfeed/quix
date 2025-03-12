import { CreateIssueParams, JiraClientConfig, JiraIssueResponse, SearchIssuesResponse, JiraProjectResponse, JiraUserResponse, JiraCommentResponse, JiraIssueComments, UpdateIssueFields, UpdateIssueResponse } from "./types";
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

  async createIssue(params: CreateIssueParams): Promise<JiraIssueResponse> {
    const { projectKey, summary, description, issueType, priority, assignee } = params;
    if (!projectKey) {
      throw new Error('Project key is required');
    }

    const project = await this.getProject(projectKey);
    if (!project) {
      throw new Error(`Project ${projectKey} not found`);
    }

    // Validate issue type exists in project
    const issueTypeObj = project.issueTypes.find(type => type.name === issueType);
    if (!issueTypeObj) {
      throw new Error(`Issue type ${issueType} not found in project ${projectKey}`);
    }

    const response = await this.makeApiCall('POST', '/issue', {
      data: {
        fields: {
          project: { id: project.id },
          summary,
          description: description ? { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: description }] }] } : undefined,
          issuetype: { id: issueTypeObj.id }
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

  async addComment(issueId: string, comment: string): Promise<JiraCommentResponse> {
    const response = await this.makeApiCall('POST', `/issue/${issueId}/comment`, {
      data: {
        body: {
          content: [
            {
              content: [
                {
                  text: comment,
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
    });
    return response;
  }

  async getComments(issueId: string, options?: { maxResults?: number; startAt?: number }): Promise<JiraIssueComments> {
    const params: Record<string, any> = {};
    if (options?.maxResults) {
      params.maxResults = options.maxResults;
    }
    if (options?.startAt) {
      params.startAt = options.startAt;
    }

    const response = await this.makeApiCall('GET', `/issue/${issueId}/comment`, {
      params
    });
    return response;
  }

  async updateIssue(issueId: string, fields: UpdateIssueFields): Promise<UpdateIssueResponse> {
    let description;
    if (fields.description) {
      description = {
        type: 'doc',
        version: 1,
        content: [{ type: 'paragraph', content: [{ type: 'text', text: fields.description }] }]
      };
    }
    const response = await this.makeApiCall('PUT', `/issue/${issueId}`, {
      data: {
        fields: {
          ...fields,
          ...(description ? { description } : {}),
          ...(fields.assigneeId ? { assignee: { id: fields.assigneeId } } : {}),
          ...(fields.labels ? { labels: fields.labels } : {}),
          ...(fields.priority ? { priority: { name: fields.priority.charAt(0).toUpperCase() + fields.priority.slice(1) } } : {})
        }
      }
    });
    return response;
  }
}

export default JiraClient;
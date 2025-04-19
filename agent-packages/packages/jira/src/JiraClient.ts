import {
  CreateIssueParams,
  JiraClientConfig,
  JiraIssueResponse,
  SearchIssuesResponse,
  JiraProjectResponse,
  JiraUserResponse,
  JiraCommentResponse,
  JiraIssueComments,
  UpdateIssueFields,
  UpdateIssueResponse,
  JiraPriorityResponse,
  JiraIssueTypeResponse,
  JiraLabels
} from './types';
import axios, { AxiosInstance } from 'axios';
import * as jwt from 'atlassian-jwt';

export class JiraClient {
  private axiosInstance: AxiosInstance;
  private config: JiraClientConfig;

  constructor(config: JiraClientConfig) {
    this.config = config;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if ('username' in config.auth) {
      headers.Authorization = `Basic ${Buffer.from(`${config.auth.username}:${config.auth.password}`).toString('base64')}`;
    } else if ('bearerToken' in config.auth) {
      headers.Authorization = `Bearer ${config.auth.bearerToken.trim()}`;
    }
    this.axiosInstance = axios.create({
      baseURL: `${config.host}/rest/api/${config.apiVersion}`,
      headers
    });
  }

  private async getToken(payload: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    sharedSecret: string;
    atlassianConnectAppKey: string;
  }): Promise<string> {
    const { method, path, sharedSecret, atlassianConnectAppKey } = payload;
    const now = new Date();
    const tokenData: Record<string, any> = {
      iat: Math.floor(now.getTime() / 1000),
      exp: Math.floor((now.getTime() + 120000) / 1000),
      iss: atlassianConnectAppKey,
      qsh: jwt.createQueryStringHash(
        jwt.fromMethodAndUrl(method, this.axiosInstance.defaults.baseURL + path)
      )
    };
    const token = jwt.encodeSymmetric(tokenData, sharedSecret);
    return token;
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

    if ('sharedSecret' in this.config.auth) {
      const queryParams = metadata?.params
        ? `?${new URLSearchParams(metadata.params).toString()}`
        : '';
      const token = await this.getToken({
        method,
        path: `${path}${queryParams}`,
        sharedSecret: this.config.auth.sharedSecret,
        atlassianConnectAppKey: this.config.auth.atlassianConnectAppKey
      });
      headers.Authorization = `JWT ${token}`;
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
      params: {
        jql,
        fields: ['summary', 'description', 'status', 'priority', 'assignee'],
        maxResults: options.maxResults
      }
    });
    return response;
  }

  async createIssue(params: CreateIssueParams): Promise<JiraIssueResponse> {
    const { projectKey, summary, issueType, priority, assigneeId, labels } = params;
    if (!projectKey) {
      throw new Error('Project key is required');
    }

    const project = await this.getProject(projectKey);
    if (!project) {
      throw new Error(`Project ${projectKey} not found`);
    }

    const response = await this.makeApiCall('POST', '/issue', {
      data: {
        fields: {
          project: { id: project.id },
          summary,
          issuetype: { name: issueType },
          ...(assigneeId ? { assignee: { accountId: assigneeId } } : {}),
          ...(priority ? { priority: { name: priority } } : {}),
          ...(labels ? { labels } : {})
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
                  type: 'text'
                }
              ],
              type: 'paragraph'
            }
          ],
          type: 'doc',
          version: 1
        }
      }
    });
    return response;
  }

  async getComments(
    issueId: string,
    options?: { maxResults?: number; startAt?: number }
  ): Promise<JiraIssueComments> {
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
    const { assigneeId, summary, priority, labels, issueType } = fields;
    const response = await this.makeApiCall('PUT', `/issue/${issueId}`, {
      data: {
        fields: {
          ...(assigneeId ? { assignee: { accountId: assigneeId } } : {}),
          ...(summary ? { summary } : {}),
          ...(priority
            ? {
                priority: {
                  name: priority
                }
              }
            : {}),
          ...(labels ? { labels } : {}),
          ...(issueType ? { issuetype: { name: issueType } } : {})
        }
      }
    });
    return response;
  }

  async getPriorities(): Promise<JiraPriorityResponse[]> {
    const response = await this.makeApiCall('GET', '/priority');
    return response;
  }

  async getIssueTypes(): Promise<JiraIssueTypeResponse[]> {
    const response = await this.makeApiCall('GET', '/issuetype');
    return response;
  }

  async getLabels(): Promise<JiraLabels> {
    const response = await this.makeApiCall('GET', '/label');
    return response;
  }
}

export default JiraClient;

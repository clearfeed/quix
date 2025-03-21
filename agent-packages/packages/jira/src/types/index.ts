import { BaseConfig, BaseResponse } from '@clearfeed-ai/quix-common-agent';

export type JiraAuth = {
  username: string;
  password: string;
} | {
  bearerToken: string;
} | {
  sharedSecret: string;
  atlassianConnectAppKey: string;
}

export interface JiraConfig extends BaseConfig {
  host: string;
  defaultConfig?: {
    projectKey?: string;
  };
  auth: JiraAuth;
  apiHost?: string;
}

export interface JiraIssueResponse {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    status: {
      name: string;
      id: string;
      statusCategory: {
        key: string;
        name: string;
      };
    };
    assignee: {
      accountId: string;
      displayName: string;
      emailAddress: string;
    } | null;
    priority: {
      id: string;
      name: string;
    } | null;
    issuetype: {
      id: string;
      name: string;
      description?: string;
    };
    description?: {
      type: string;
      version: number;
      content: Array<{
        type: string;
        content?: Array<{
          type: string;
          text: string;
          marks?: Array<{
            type: string;
            attrs?: Record<string, string>;
          }>;
        }>;
      }>;
    };
    created: string;
    reporter: {
      accountId: string;
      displayName: string;
      emailAddress: string;
    };
    updated: string;
    labels: string[];
  };
}

export interface JiraResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateIssueParams {
  projectKey?: string;
  summary: string;
  description?: string;
  issueType: string;
  priority?: string;
  assignee?: string;
}

export type SearchIssuesResponse = {
  issues: {
    id: JiraIssueResponse['id'];
    key: JiraIssueResponse['key'];
    fields: {
      summary: JiraIssueResponse['fields']['summary'];
      description: JiraIssueResponse['fields']['description'];
      status: JiraIssueResponse['fields']['status'];
      priority: JiraIssueResponse['fields']['priority'];
      assignee: JiraIssueResponse['fields']['assignee'];
    }
  }[];
};

export type GetIssueResponse = BaseResponse<{
  issue: JiraIssueResponse;
}>;

export type AssignIssueResponse = BaseResponse<void>;

export type JiraClientConfig = {
  host: string;
  auth: JiraAuth;
  apiVersion: string;
};

export type JiraProjectResponse = {
  self: string;
  id: string;
  key: string;
  name: string;
  description: string;
  issueTypes: Array<{
    id: string;
    name: string;
    description: string;
    subtask: boolean;
  }>;
};

export interface JiraUserResponse {
  self: string;
  accountId: string;
  accountType: string;
  emailAddress: string;
  displayName: string;
  active: boolean;
};

export interface JiraCommentResponse {
  id: string;
  self: string;
  body: {
    type: string;
    version: number;
    content: Array<{
      type: string;
      content?: Array<{
        type: string;
        text: string;
        marks?: Array<{
          type: string;
          attrs?: Record<string, string>;
        }>;
      }>;
    }>;
  };
  author: {
    accountId: string;
    displayName: string;
    emailAddress: string;
  };
  created: string;
  updated: string;
}

export interface JiraIssueComments {
  comments: JiraCommentResponse[];
  total: number;
  maxResults: number;
  startAt: number;
}

export type AddCommentParams = {
  issueId: string;
  comment: string;
};

export type AddCommentResponse = BaseResponse<{
  comment: JiraCommentResponse;
}>;

export type GetCommentsResponse = BaseResponse<{
  comments: JiraIssueComments;
}>;

export interface UpdateIssueFields {
  summary?: string;
  description?: string;
  priority?: string;
  assigneeId?: string;
  labels?: string[];
}

export type UpdateIssueResponse = BaseResponse<void>;

export type SearchUsersResponse = BaseResponse<{
  users: JiraUserResponse[];
}>;
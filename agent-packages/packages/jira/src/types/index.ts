import { BaseConfig, BaseResponse } from '@clearfeed-ai/quix-common-agent';
import { addJiraCommentSchema, createJiraIssueSchema, updateJiraTicketSchema } from '../schema';
import { z } from 'zod';

export type JiraAuth =
  | {
      username: string;
      password: string;
    }
  | {
      bearerToken: string;
    }
  | {
      sharedSecret: string;
      atlassianConnectAppKey: string;
    };

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

export type CreateIssueParams = z.infer<typeof createJiraIssueSchema>;

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
    };
  }[];
};

export type GetIssueResponse = BaseResponse<{
  issue: JiraIssueResponse & { url: string };
}>;

export type AssignIssueResponse = BaseResponse<{
  issueId: string;
  assignee: {
    accountId: string;
    user: JiraUserResponse;
  };
  url: string;
}>;

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
}

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

export type AddCommentParams = z.infer<typeof addJiraCommentSchema>;

export type AddCommentResponse = BaseResponse<{
  comment: JiraCommentResponse & { url: string };
}>;

export type GetCommentsResponse = BaseResponse<{
  comments: (JiraIssueComments['comments'][number] & { url: string })[];
}>;

export type UpdateIssueParams = z.infer<typeof updateJiraTicketSchema>;
export type UpdateIssueFields = Omit<UpdateIssueParams, 'issueId'>;
export type UpdateIssueResponse = BaseResponse<{
  issueId: string;
  url: string;
  fields: UpdateIssueFields;
}>;

export type SearchUsersResponse = BaseResponse<{
  users: JiraUserResponse[];
}>;

export interface JiraIssueTypeResponse {
  self: string;
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  subtask: boolean;
}

export type GetIssueTypesResponse = BaseResponse<{
  issueTypes: JiraIssueTypeResponse[];
}>;

export type JiraCreateIssueMetadataField = {
  fieldId: string;
  hasDefaultValue: boolean;
  key: string;
  name: string;
  operations: string[];
  required: boolean;
  allowedValues: {
    id: string;
    name: string;
  }[];
};

export type JiraCreateIssueMetadata = {
  fields: JiraCreateIssueMetadataField[];
  maxResults: number;
  startAt: number;
  total: number;
};

export type JiraUpdateIssueMetadataField = {
  fieldId: string;
  hasDefaultValue: boolean;
  key: string;
  name: string;
  operations: string[];
  allowedValues: {
    id: string;
    name: string;
  }[];
  required: boolean;
};

export type JiraUpdateIssueMetadata = {
  fields: Record<string, JiraUpdateIssueMetadataField>;
  maxResults: number;
  startAt: number;
  total: number;
};

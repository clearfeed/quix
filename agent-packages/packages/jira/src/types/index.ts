import { BaseConfig, BaseResponse } from '@clearfeed/common-agent';

export interface JiraConfig extends BaseConfig {
  host: string;
  username: string;
  password: string;
}

export interface JiraIssue {
  id: string;
  summary: string;
  status: string;
  assignee: string;
  priority: string;
  type: string;
  description: string;
  created: string;
  reporter: string;
  lastUpdated: string;
  labels: string[];
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

export type CreateIssueParams = {
  projectKey: string;
  summary: string;
  description: string;
  issueType: string;
  priority?: string;
  assignee?: string;
};

export type SearchIssuesResponse = BaseResponse<{
  issues: JiraIssue[];
}>;

export type GetIssueResponse = BaseResponse<{
  issue: JiraIssue;
}>;

export type AssignIssueResponse = BaseResponse<{
  issue: JiraIssue;
}>; 
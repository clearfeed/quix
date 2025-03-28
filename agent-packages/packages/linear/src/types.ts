import { BaseResponse } from '@clearfeed-ai/quix-common-agent';
import { Issue } from '@linear/sdk';

export type LinearAuth = {
  apiKey: string;
};

export interface LinearConfig {
  accessToken: string;
  defaultConfig?: {
    /**
     * The ID of the team to create the issue in
     */
    teamId: string;
  };
}

export interface GetIssueParams {
  issueKey: string;
}

export interface SearchIssuesParams {
  query: string;
  limit?: number;
}

export interface CreateIssueParams {
  teamKey?: string;
  title: string;
  description?: string;
  priority?: number;
  assigneeId?: string;
}

export interface AddCommentParams {
  issueKey: string;
  comment: string;
}

export type GetIssueResponse = BaseResponse<Issue>;
export type SearchIssuesResponse = BaseResponse<{
  issues: Issue[];
}>;
export type CreateIssueResponse = BaseResponse<Issue>;
export type AddCommentResponse = BaseResponse<{
  success: boolean;
  issueId: string;
}>;

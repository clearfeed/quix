import { BaseConfig, BaseResponse } from '@clearfeed/quix-common-agent';

export interface GitHubConfig extends BaseConfig {
  token: string;
  owner: string;
}

export interface PullRequest {
  number: number;
  title: string;
  status: string;
  reporter: string;
  createdAt: string;
  lastUpdated: string;
  url: string;
  description: string | null;
  labels: string[];
}

export type SearchPRsParams = {
  repo: string;
  status?: string;
  keyword?: string;
  reporter?: string;
};

export type SearchPRsResponse = BaseResponse<{
  pullRequests: PullRequest[];
}>;

export type GetPRResponse = BaseResponse<{
  pullRequest: PullRequest;
}>; 
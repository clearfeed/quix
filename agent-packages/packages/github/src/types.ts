import { BaseConfig, BaseResponse } from '@clearfeed-ai/quix-common-agent';
import type { RestEndpointMethodTypes } from './types/oktokit';
import type { Endpoints } from '@octokit/types';
import { baseSearchIssuesOrPullRequestsSchema, searchIssuesOrPullRequestsSchema } from './schema';
import { z } from 'zod';

export interface GitHubConfig extends BaseConfig {
  token: string;
  owner?: string;
  repo?: string;
}

// Search types
export interface SearchCodeParams {
  q: string;
  order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export type SearchIssuesGlobalParams = z.infer<typeof baseSearchIssuesOrPullRequestsSchema>;

export type SearchIssuesOrPullRequestsParams = z.infer<typeof searchIssuesOrPullRequestsSchema>;

export type SearchCodeResponse = Endpoints['GET /search/code']['response']['data'];
export type SearchIssuesOrPullRequestsResponse = BaseResponse<{
  issuesOrPullRequests: Endpoints['GET /search/issues']['response']['data']['items'];
  pagination: string;
}>;

type SearchResultItem =
  RestEndpointMethodTypes['search']['issuesAndPullRequests']['response']['data']['items'][number];
export type PullRequest = SearchResultItem;

export type GetPRResponse = BaseResponse<{
  pullRequest: SearchResultItem;
}>;

// File types
export interface FileContent {
  path: string;
  content: string;
}

export interface GetFileContentsParams {
  owner: string;
  repo: string;
  path: string;
  branch?: string;
}

// Repository types
export interface CreateRepositoryParams {
  name: string;
  description?: string;
  private?: boolean;
  autoInit?: boolean;
}

export interface CreateOrUpdateFileParams {
  owner: string;
  repo: string;
  path: string;
  content: string;
  message: string;
  branch: string;
  sha?: string;
}

export interface SearchRepositoriesParams {
  query: string;
  page?: number;
}

export interface CreatePullRequestParams {
  owner: string;
  repo: string;
  title: string;
  head: string;
  base: string;
  body?: string;
  draft?: boolean;
  maintainer_can_modify?: boolean;
}

export interface CreateBranchParams {
  owner: string;
  repo: string;
  branch: string;
  from_branch?: string;
}

export interface ListCommitsParams {
  owner: string;
  repo: string;
  sha?: string;
  page?: number;
  perPage?: number;
}

export interface UpdateIssueParams {
  owner: string;
  repo: string;
  issue_number: number;
  title?: string;
  body?: string;
  state?: 'open' | 'closed';
  labels?: string[];
  assignees?: string[];
  milestone?: number;
}

export interface AddIssueCommentParams {
  owner: string;
  repo: string;
  issue_number: number;
  body: string;
}

export interface SearchUsersParams {
  q: string;
  sort?: 'followers' | 'repositories' | 'joined';
  order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface PullRequestParams {
  owner: string;
  repo: string;
  pull_number: number;
}

export interface CreatePullRequestReviewParams extends PullRequestParams {
  body: string;
  event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
  commit_id?: string;
  comments?: Array<{
    path: string;
    position: number;
    body: string;
  }>;
}

export interface MergePullRequestParams extends PullRequestParams {
  commit_title?: string;
  commit_message?: string;
  merge_method?: 'merge' | 'squash' | 'rebase';
}

export interface UpdatePullRequestBranchParams extends PullRequestParams {
  expected_head_sha?: string;
}

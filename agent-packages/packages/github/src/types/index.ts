import { BaseConfig, BaseResponse } from '@clearfeed-ai/quix-common-agent';
import type { RestEndpointMethodTypes } from './oktokit';
import type { Endpoints } from '@octokit/types';
import {
  baseSearchIssuesOrPullRequestsSchema,
  getGithubIssueSchema,
  searchIssuesOrPullRequestsSchema,
  addGithubAssigneeSchema,
  removeGithubAssigneeSchema,
  getOrganizationUsersSchema,
  createGithubIssueSchema,
  searchRepositoryCodeSchema,
  searchRepositoriesSchema,
  createRepositorySchema,
  getFileContentsSchema,
  createPullRequestSchema,
  createBranchSchema,
  listCommitsSchema,
  updateIssueSchema,
  addIssueCommentSchema,
  searchGithubUsersSchema,
  getPullRequestSchema,
  createPullRequestReviewSchema,
  mergePullRequestSchema,
  searchCodeGlobalSchema,
  getPullRequestStatusSchema,
  getPullRequestFilesSchema,
  getPullRequestCommentsSchema,
  getPullRequestReviewsSchema,
  updatePullRequestBranchSchema,
  createOrUpdateFileSchema
} from '../schema';
import { z } from 'zod';

export interface GitHubConfig extends BaseConfig {
  token: string;
  owner?: string;
  repo?: string;
}

export interface FileContent {
  path: string;
  content: string;
}

export interface SearchCodeParams {
  q: string;
  order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export type SearchIssuesOrPullRequestsParams = z.infer<
  ReturnType<typeof searchIssuesOrPullRequestsSchema>
>;

export type GetGithubIssueParams = z.infer<ReturnType<typeof getGithubIssueSchema>>;

export type AddGithubAssigneeParams = z.infer<ReturnType<typeof addGithubAssigneeSchema>>;

export type RemoveGithubAssigneeParams = z.infer<ReturnType<typeof removeGithubAssigneeSchema>>;

export type GetOrganizationUsersParams = z.infer<ReturnType<typeof getOrganizationUsersSchema>>;

export type CreateGithubIssueParams = z.infer<ReturnType<typeof createGithubIssueSchema>>;

export type SearchRepositoryCodeParams = z.infer<ReturnType<typeof searchRepositoryCodeSchema>>;

export type CreateOrUpdateFileParams = z.infer<ReturnType<typeof createOrUpdateFileSchema>>;

export type SearchRepositoriesParams = z.infer<typeof searchRepositoriesSchema>;

export type CreateRepositoryParams = z.infer<typeof createRepositorySchema>;

export type GetFileContentsParams = z.infer<ReturnType<typeof getFileContentsSchema>>;

export type CreatePullRequestParams = z.infer<ReturnType<typeof createPullRequestSchema>>;

export type CreateBranchParams = z.infer<ReturnType<typeof createBranchSchema>>;

export type ListCommitsParams = z.infer<ReturnType<typeof listCommitsSchema>>;

export type UpdateIssueParams = z.infer<ReturnType<typeof updateIssueSchema>>;

export type AddIssueCommentParams = z.infer<ReturnType<typeof addIssueCommentSchema>>;

export type SearchUsersParams = z.infer<ReturnType<typeof searchGithubUsersSchema>>;
export type PullRequestParams = z.infer<ReturnType<typeof getPullRequestSchema>>;
export type CreatePullRequestReviewParams = z.infer<
  ReturnType<typeof createPullRequestReviewSchema>
>;

export type MergePullRequestParams = z.infer<ReturnType<typeof mergePullRequestSchema>>;
export type SearchCodeGlobalParams = z.infer<typeof searchCodeGlobalSchema>;

export type SearchIssuesGlobalParams = z.infer<typeof baseSearchIssuesOrPullRequestsSchema>;
export type GetPullRequestStatusParams = z.infer<ReturnType<typeof getPullRequestStatusSchema>>;

export type GetPullRequestFilesParams = z.infer<ReturnType<typeof getPullRequestFilesSchema>>;

export type GetPullRequestCommentsParams = z.infer<ReturnType<typeof getPullRequestCommentsSchema>>;
export type GetPullRequestReviewsParams = z.infer<ReturnType<typeof getPullRequestReviewsSchema>>;
export type UpdatePullRequestBranchParams = z.infer<
  ReturnType<typeof updatePullRequestBranchSchema>
>;

export type SearchIssuesOrPullRequestsResponse = BaseResponse<{
  issuesOrPullRequests: Endpoints['GET /search/issues']['response']['data']['items'];
  pagination: string;
}>;
export type SearchCodeResponse = Endpoints['GET /search/code']['response']['data'];
export type GetPRResponse = BaseResponse<{
  pullRequest: SearchResultItem;
}>;

type SearchResultItem =
  RestEndpointMethodTypes['search']['issuesAndPullRequests']['response']['data']['items'][number];
export type PullRequest = SearchResultItem;

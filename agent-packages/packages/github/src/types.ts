import { BaseConfig, BaseResponse } from '@clearfeed-ai/quix-common-agent';
import { RestEndpointMethodTypes } from '@octokit/rest';

export interface GitHubConfig extends BaseConfig {
  token: string;
  owner?: string;
  repo?: string;
}

type SearchResultItem = RestEndpointMethodTypes['search']['issuesAndPullRequests']['response']['data']['items'][number];
export type PullRequest = SearchResultItem;

export type SearchIssuesParams = {
  repo: string;
  owner?: string;
  keyword?: string;
  reporter?: string;
  type: 'issue' | 'pull-request';
};

export type SearchIssuesResponse = BaseResponse<{
  issues: SearchResultItem[];
}>;

export type GetPRResponse = BaseResponse<{
  pullRequest: SearchResultItem;
}>; 
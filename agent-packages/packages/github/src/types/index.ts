export interface GitHubConfig {
  token: string;
  owner: string;
}

export interface GitHubPR {
  number: number;
  title: string;
  state: string;
  user: {
    login: string;
  };
  created_at: string;
  updated_at: string;
  html_url: string;
  body?: string;
  labels: Array<{ name: string }>;
}

export interface GitHubPRResponse {
  number: number;
  title: string;
  status: string;
  reporter: string;
  createdAt: string;
  lastUpdated: string;
  url: string;
  description?: string;
  labels: string[];
}

export interface GitHubResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SearchPRsParams {
  repo: string;
  status?: string;
  keyword?: string;
  reporter?: string;
}

export interface SearchPRsResponse extends GitHubResponse<{
  prs: GitHubPRResponse[];
}> { }

export interface GetPRResponse extends GitHubResponse<{
  pr: GitHubPRResponse;
}> { }

// Issue interfaces
export interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  state: string;
  user: { login: string };
  created_at: string;
  updated_at: string;
  html_url: string;
}
export interface CreateIssueParams {
  owner?: string,
  repo?: string,
  title: string,
  description?: string,
}
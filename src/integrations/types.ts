export interface HubspotTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface HubspotHubInfo {
  hub_domain: string;
  hub_id: number;
  scopes: string[];
  token: string;
  user: string;
  user_id: number;
}

export interface GithubTokenResponse {
  access_token: string,
  token_type: string,
  scope: string
}

export interface GitHubInfo {
  id: number,
  login: string,
  avatar_url: string,
}
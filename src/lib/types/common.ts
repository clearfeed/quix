import {
  LinearConfig,
  GithubConfig,
  NotionConfig,
  SalesforceConfig,
  PostgresConfig,
  OktaConfig,
  ZendeskConfig,
  HubspotConfig,
  JiraConfig,
  McpConnection,
  JumpCloudConfig
} from '@quix/database/models';

export type Nullable<T> = T | null;

export type ToolInstallState = {
  appId: string;
  teamId: string;
  state: string;
};

export type Connections =
  | JiraConfig
  | HubspotConfig
  | PostgresConfig
  | GithubConfig
  | SalesforceConfig
  | NotionConfig
  | LinearConfig
  | McpConnection
  | OktaConfig
  | ZendeskConfig
  | JumpCloudConfig;

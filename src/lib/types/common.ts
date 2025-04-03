import { JiraConfig } from '@quix/database/models';

import { HubspotConfig } from '@quix/database/models';

import {
  LinearConfig,
  GithubConfig,
  NotionConfig,
  SalesforceConfig,
  PostgresConfig
} from '@quix/database/models';

import { McpConnection } from '@quix/database/models';

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
  | McpConnection;

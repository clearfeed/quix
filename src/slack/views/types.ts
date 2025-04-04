import {
  HubspotConfig,
  JiraConfig,
  PostgresConfig,
  SlackWorkspace,
  GithubConfig,
  SalesforceConfig,
  NotionConfig,
  LinearConfig,
  McpConnection
} from '@quix/database/models';
import { INTEGRATIONS } from '@quix/lib/constants';
import { ModalView, ViewsOpenResponse, ViewsUpdateResponse, WebClient } from '@slack/web-api';

export type HomeViewArgs = {
  slackWorkspace: SlackWorkspace;
  selectedTool?: (typeof INTEGRATIONS)[number]['value'] | string; // string for MCP server IDs
  connection?:
    | JiraConfig
    | HubspotConfig
    | PostgresConfig
    | GithubConfig
    | SalesforceConfig
    | NotionConfig
    | LinearConfig
    | McpConnection;
  userId: string;
};

export type PostgresConnectionModalArgs = {
  triggerId: string;
  teamId: string;
  callbackId?: string;
  initialValues?: {
    id?: string;
    host?: string;
    port?: string;
    database?: string;
    username?: string;
    password?: string;
    ssl?: boolean;
  };
};

export type JiraDefaultConfigModalArgs = {
  triggerId: string;
  teamId: string;
  callbackId?: string;
  projectKey: string;
};

export type GithubDefaultConfig = {
  repo: string;
  owner: string;
};

export type GithubDefaultConfigModalArgs = {
  triggerId: string;
  initialValues: GithubDefaultConfig;
};

export type NotionConnectionModalArgs = {
  triggerId: string;
  teamId: string;
  initialValues?: {
    id?: string;
    apiToken?: string;
  };
};

export type LinearConnectionModalArgs = {
  triggerId: string;
  teamId: string;
  initialValues?: {
    id?: string;
    apiToken?: string;
  };
};

export type McpConnectionModalArgs = {
  triggerId: string;
  teamId: string;
  initialValues?: {
    id?: string;
    name?: string;
    url?: string;
    apiToken?: string;
  };
};

/**
 * error modal can be opened/updated in three different ways:
 * 1. To open a modal, use @property {} triggerId.
 *    Mostly used when handling a message button interaction.
 *    If there is an error, pass the @property {} triggerId and the modal will open.
 * 2. If there's already a modal and the modal must be updated instantly. Then
 *    pass @property {} backgroundCaller as false and return the method's output as
 *    the response to the interaction request.
 * 3. Same case as #2 but the modal needs to updated after sometime. Then pass
 *    @property {} backgroundCaller as true and pass @property {} viewId and @property {} SlackClient.
 *    Mostly used when handling a interaction that takes longer time to process and cannot
 *    be responded immediately.
 */
export type DisplayErrorModalPayload = {
  error: any;
  title?: string;
  message?: string;
  errorMetadata?: Record<any, any>;
} & (
  | { triggerId: string; web: WebClient; viewId?: never }
  | (
      | { backgroundCaller?: false; viewId?: never; web?: never }
      | { backgroundCaller: true; viewId: string; web: WebClient }
    )
);

export type DisplayErrorModalResponse =
  | void
  | ViewsOpenResponse
  | ViewsUpdateResponse
  | UpdateModalResponsePayload;

export type UpdateModalResponsePayload = {
  response_action: 'update';
  view: ModalView;
};

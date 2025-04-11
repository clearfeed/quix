import { SlackWorkspace } from '@quix/database/models';
import { INTEGRATIONS } from '@quix/lib/constants';
import { Connections } from '@quix/lib/types/common';
import { ModalView, ViewsOpenResponse, ViewsUpdateResponse, WebClient } from '@slack/web-api';

export type HomeViewArgs = {
  slackWorkspace: SlackWorkspace;
  selectedTool?: (typeof INTEGRATIONS)[number]['value'] | string; // string for MCP server IDs
  connection?: Connections;
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
    defaultPrompt?: string | null;
  };
};

export type JiraDefaultConfigModalArgs = {
  triggerId: string;
  teamId: string;
  callbackId?: string;
  projectKey: string;
  defaultPrompt?: string | null;
};

export type GithubDefaultConfig = {
  repo: string;
  owner: string;
  defaultPrompt?: string | null;
};

export type GithubDefaultConfigModalArgs = {
  triggerId: string;
  initialValues: GithubDefaultConfig;
};

export type NotionConnectionModalArgs = {
  triggerId: string;
  teamId: string;
  initialValues?: {
    apiToken?: string;
    defaultPrompt?: string | null;
  };
};

export type LinearConnectionModalArgs = {
  triggerId: string;
  teamId: string;
  initialValues?: {
    apiToken?: string;
    defaultPrompt?: string | null;
  };
};

export type OktaConnectionModalArgs = {
  triggerId: string;
  teamId: string;
  initialValues?: {
    id?: string;
    orgUrl?: string;
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
    defaultPrompt?: string | null;
    toolSelectionPrompt?: string;
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

export type SalesforceConfigModalArgs = {
  triggerId: string;
  teamId: string;
  initialValues?: {
    defaultPrompt?: string | null;
  };
};

export type HubspotConfigModalArgs = {
  triggerId: string;
  teamId: string;
  initialValues?: {
    defaultPrompt?: string | null;
  };
};

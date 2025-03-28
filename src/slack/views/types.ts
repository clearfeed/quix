import { HubspotConfig, JiraConfig, PostgresConfig, SlackWorkspace, GithubConfig, SalesforceConfig } from "@quix/database/models";
import { INTEGRATIONS } from "@quix/lib/constants";

export type HomeViewArgs = {
  slackWorkspace: SlackWorkspace;
  selectedTool?: typeof INTEGRATIONS[number]['value'];
  connection?: JiraConfig | HubspotConfig | PostgresConfig | GithubConfig | SalesforceConfig;
  userId: string;
}

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
}

export type JiraDefaultConfigModalArgs = {
  triggerId: string;
  teamId: string;
  callbackId?: string;
  projectKey: string;
}
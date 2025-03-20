import { HubspotConfig, JiraConfig, PostgresConfig, SlackWorkspace, GithubConfig } from "@quix/database/models";
import { INTEGRATIONS } from "@quix/lib/constants";

export type HomeViewArgs = {
  slackWorkspace: SlackWorkspace;
  selectedTool?: typeof INTEGRATIONS[number]['value'];
  connection?: JiraConfig | HubspotConfig | PostgresConfig | GithubConfig;
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
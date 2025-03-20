import { HubspotConfig, JiraConfig, PostgresConfig, GithubConfig } from "@quix/database/models";
import { INTEGRATIONS } from "@quix/lib/constants";

export type HomeViewArgs = {
  teamId: string;
  selectedTool?: typeof INTEGRATIONS[number]['value'];
  connection?: JiraConfig | HubspotConfig | PostgresConfig | GithubConfig;
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
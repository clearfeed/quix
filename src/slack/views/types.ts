import { HubspotConfig, JiraConfig } from "@quix/database/models";
import { INTEGRATIONS } from "@quix/lib/constants";

export type HomeViewArgs = {
  teamId: string;
  selectedTool?: typeof INTEGRATIONS[number]['value'];
  connection?: JiraConfig | HubspotConfig;
}

export type PostgresConnectionModalArgs = {
  triggerId: string;
  teamId: string;
  callbackId?: string;
  initialValues?: {
    host?: string;
    port?: string;
    database?: string;
    username?: string;
    password?: string;
    ssl?: string;
  };
}
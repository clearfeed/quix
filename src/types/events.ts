import { SUPPORTED_INTEGRATIONS } from "@quix/lib/constants";

/**
 * Integration Events
 */
export type IntegrationConnectedEvent = {
  teamId: string;
  appId: string;
  type: SUPPORTED_INTEGRATIONS;
  userId?: string;
};

// Event name constants to avoid string literals
export const EVENT_NAMES: Record<string, `connected.${SUPPORTED_INTEGRATIONS}`> = {
  JIRA_CONNECTED: `connected.${SUPPORTED_INTEGRATIONS.JIRA}`,
  GITHUB_CONNECTED: `connected.${SUPPORTED_INTEGRATIONS.GITHUB}`,
  HUBSPOT_CONNECTED: `connected.${SUPPORTED_INTEGRATIONS.HUBSPOT}`,
  ZENDESK_CONNECTED: `connected.${SUPPORTED_INTEGRATIONS.ZENDESK}`,
  POSTGRES_CONNECTED: `connected.${SUPPORTED_INTEGRATIONS.POSTGRES}`,
} as const;
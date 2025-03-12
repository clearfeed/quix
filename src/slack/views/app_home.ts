import { HomeView, SectionBlock } from "@slack/web-api";
import { SLACK_ACTIONS } from "@quix/lib/utils/slack-constants";
import { HomeViewArgs } from "./types";
import { INTEGRATIONS } from "@quix/lib/constants";
import { getInstallUrl } from "@quix/lib/utils/slack";
import { JiraSite } from "@quix/database/models";

export const getHomeView = (args: HomeViewArgs): HomeView => {
  const { selectedTool, teamId, connection } = args;
  return {
    type: 'home',
    blocks: [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": ":wave: Welcome to Quix",
          "emoji": true
        }
      },
      {
        "type": "context",
        "elements": [
          {
            "type": "plain_text",
            "text": "Quix helps you talk to your business tools from Slack.",
            "emoji": true
          }
        ]
      },
      {
        type: 'divider'
      },
      {
        "type": "input",
        "element": {
          "type": "static_select",
          "action_id": SLACK_ACTIONS.CONNECT_TOOL,
          "initial_option": selectedTool ? {
            "text": {
              "type": "plain_text",
              "text": INTEGRATIONS.find(integration => integration.value === selectedTool)?.name || 'Select a tool',
              "emoji": true
            },
            "value": selectedTool
          } : undefined,
          "placeholder": {
            "type": "plain_text",
            "text": "Select a tool",
            "emoji": true
          },
          "options": INTEGRATIONS.map(integration => ({
            "text": {
              "type": "plain_text",
              "text": integration.name,
              "emoji": true
            },
            "value": integration.value
          })),
        },
        "label": {
          "type": "plain_text",
          "text": "Connect your tools to get started",
          "emoji": true
        },
        "dispatch_action": true
      },
      ...(selectedTool ? getIntegrationInfo(selectedTool, teamId, connection) : [])
    ]
  }
}

const getConnectionInfo = (connection: HomeViewArgs['connection']): string => {
  if (!connection) return '';
  switch (true) {
    case connection instanceof JiraSite:
      return `Connected to ${connection.url}`;
    default:
      return '';
  }
}

const getIntegrationInfo = (selectedTool: typeof INTEGRATIONS[number]['value'], teamId: string, connection?: HomeViewArgs['connection']): SectionBlock[] => {
  const integration = INTEGRATIONS.find(integration => integration.value === selectedTool);
  if (!integration) return [];
  return [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `${connection ? getConnectionInfo(connection) : integration.helpText}`
      },
      "accessory": {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": `${connection ? 'Reconnect' : 'Connect'} ${integration?.name}`,
          "emoji": true
        },
        "style": connection ? 'danger' : 'primary',
        "value": "connect_now",
        "url": getInstallUrl(selectedTool, teamId),
        "action_id": SLACK_ACTIONS.INSTALL_TOOL
      },
    }
  ]
}



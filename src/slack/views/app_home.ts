import { AnyBlock, HomeView, SectionBlock } from "@slack/web-api";
import { SLACK_ACTIONS } from "@quix/lib/utils/slack-constants";
import { HomeViewArgs } from "./types";

export const getHomeView = (args: HomeViewArgs = {}): HomeView => {
  const { selectedTool } = args;
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
              "text": integrations.find(integration => integration.value === selectedTool)?.name || 'Select a tool',
              "emoji": true
            },
            "value": selectedTool
          } : undefined,
          "placeholder": {
            "type": "plain_text",
            "text": "Select a tool",
            "emoji": true
          },
          "options": integrations.map(integration => ({
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
      ...(selectedTool ? getIntegrationInfo(selectedTool) : [])
    ]
  }
}

const getIntegrationInfo = (selectedTool: string): SectionBlock[] => {
  const integration = integrations.find(integration => integration.value === selectedTool);
  if (!integration) return [];
  return [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": integration.helpText
      },
      "accessory": {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": `Connect ${integration?.name}`,
          "emoji": true
        },
        "style": "primary",
        "value": "connect_now",
        "url": `${process.env.SELFSERVER_URL}/slack/install?tool=${selectedTool}`,
        "action_id": SLACK_ACTIONS.INSTALL_TOOL
      },
    }
  ]
}

const integrations = [
  {
    name: 'JIRA',
    value: 'jira',
    helpText: 'Connect JIRA to create, update, and view issues.'
  },
  {
    name: 'GitHub',
    value: 'github',
    helpText: 'Connect GitHub to interat with issues and pull requests.'
  },
  {
    name: 'Hubspot',
    value: 'hubspot',
    helpText: 'Connect Hubspot to create, update, and view contacts, deals, and companies.'
  },
  {
    name: 'Zendesk',
    value: 'zendesk',
    helpText: 'Connect Zendesk to create, update, and view tickets.'
  }
]

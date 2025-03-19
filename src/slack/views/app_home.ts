import { Block, HomeView, SectionBlock } from "@slack/web-api";
import { SLACK_ACTIONS } from "@quix/lib/utils/slack-constants";
import { HomeViewArgs, PostgresConnectionModalArgs } from "./types";
import { INTEGRATIONS } from "@quix/lib/constants";
import { getInstallUrl } from "@quix/lib/utils/slack";
import { HubspotConfig, JiraConfig, PostgresConfig } from "@quix/database/models";
import { BlockCollection, Button, Input, Modal, Section, Surfaces, Elements, Bits } from "slack-block-builder";
import { WebClient } from "@slack/web-api";
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
    case connection instanceof JiraConfig:
      return `Connected to ${connection.url}`;
    case connection instanceof HubspotConfig:
      return `Connected to ${connection.hub_domain}`;
    case connection instanceof PostgresConfig:
      return `Connected to ${connection.host}`;
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
        "value": selectedTool,
        "url": integration.oauth ? getInstallUrl(selectedTool, teamId) : undefined,
        "action_id": SLACK_ACTIONS.INSTALL_TOOL
      },
    }
  ]
}

export const getPostgresConnectionModal = (args: PostgresConnectionModalArgs): Block[] => {
  const { initialValues } = args;

  return BlockCollection([
    Section({
      text: 'Please provide your PostgreSQL connection details:'
    }),
    Input({
      label: 'Host',
      blockId: 'postgres_host',
    }).element(Elements.TextInput({
      placeholder: 'e.g., localhost or db.example.com',
      actionId: SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.HOST
    }).initialValue(initialValues?.host || '')),
    Input({
      label: 'Port',
      blockId: 'postgres_port',
    }).element(Elements.TextInput({
      placeholder: 'e.g., 5432',
      actionId: SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.PORT
    }).initialValue(initialValues?.port || '5432')),
    Input({
      label: 'Database',
      blockId: 'postgres_database',
    }).element(Elements.TextInput({
      placeholder: 'e.g., mydb',
      actionId: SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.DATABASE
    }).initialValue(initialValues?.database || '')),
    Input({
      label: 'Username',
      blockId: 'postgres_username',
    }).element(Elements.TextInput({
      placeholder: 'e.g., postgres',
      actionId: SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.USER
    }).initialValue(initialValues?.username || '')),
    Input({
      label: 'Password',
      blockId: 'postgres_password',
    }).element(Elements.TextInput({
      placeholder: 'Your database password',
      actionId: SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.PASSWORD
    }).initialValue(initialValues?.password || '')),
    Input({
      label: 'SSL',
      blockId: 'postgres_ssl',
    }).element(
      Elements.Checkboxes({
        actionId: SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.SSL
      })
        .initialOptions(
          initialValues?.ssl ? [Bits.Option({
            text: 'Use SSL connection',
            value: 'ssl'
          })] : []
        ).options([
          Bits.Option({
            text: 'Use SSL connection',
            value: 'ssl'
          })
        ])
    ).optional(true),
    Section({
      text: 'Your credentials are securely stored and only used to connect to your database.'
    })
  ]);
};

/**
 * Publishes a modal to collect PostgreSQL connection details
 */
export const publishPostgresConnectionModal = async (
  client: WebClient,
  args: PostgresConnectionModalArgs
): Promise<void> => {
  try {
    const modal = getPostgresConnectionModal(args);

    await client.views.open({
      trigger_id: args.triggerId,
      view: {
        ...Surfaces.Modal({
          title: 'PostgreSQL Connection',
          submit: 'Submit',
          close: 'Cancel',
          callbackId: SLACK_ACTIONS.SUBMIT_POSTGRES_CONNECTION
        }).buildToObject(),
        blocks: modal
      }
    });
  } catch (error) {
    console.error("Error publishing PostgreSQL connection modal:", error);
    throw error;
  }
};



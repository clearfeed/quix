import { Block, HomeView } from "@slack/web-api";
import { SLACK_ACTIONS } from "@quix/lib/utils/slack-constants";
import { HomeViewArgs, PostgresConnectionModalArgs } from "./types";
import { INTEGRATIONS } from "@quix/lib/constants";
import { getInstallUrl } from "@quix/lib/utils/slack";
import { HubspotConfig, JiraConfig, PostgresConfig, SlackWorkspace } from "@quix/database/models";
import { BlockCollection, Input, Section, Surfaces, Elements, Bits, Blocks, Md, BlockBuilder } from "slack-block-builder";
import { WebClient } from "@slack/web-api";

export const getHomeView = (args: HomeViewArgs): HomeView => {
  const { selectedTool, slackWorkspace, connection } = args;
  const blocks = [
    Blocks.Header({
      text: ':wave: Welcome to Quix'
    }),
    Blocks.Context().elements('Quix helps you talk to your business tools from Slack.'),
    Blocks.Divider()
  ];
  if (slackWorkspace.isAdmin(args.userId)) {
    blocks.push(...getOpenAIView(slackWorkspace));
    if (slackWorkspace.openai_key) {
      blocks.push(Blocks.Divider());
      blocks.push(...getToolConnectionView(selectedTool));
      if (selectedTool) blocks.push(...getIntegrationInfo(selectedTool, slackWorkspace.team_id, connection));
    }
  } else {
    blocks.push(...getNonAdminView(slackWorkspace));
  }
  return {
    type: 'home',
    blocks: BlockCollection(blocks)
  }
}

const getToolConnectionView = (selectedTool: typeof INTEGRATIONS[number]['value'] | undefined): BlockBuilder[] => {
  return [
    Blocks.Input({
      label: 'Connect your tools to get started',
    }).element(
      Elements.StaticSelect({
        placeholder: 'Select a tool',
        actionId: SLACK_ACTIONS.CONNECT_TOOL,
      }).options(
        INTEGRATIONS.map(integration => Bits.Option({
          text: integration.name,
          value: integration.value
        }))
      ).initialOption(selectedTool ? Bits.Option({
        text: INTEGRATIONS.find(integration => integration.value === selectedTool)?.name || 'Select a tool',
        value: selectedTool
      }) : undefined)
    ).dispatchAction(true)
  ]
}

const getOpenAIView = (slackWorkspace: SlackWorkspace): BlockBuilder[] => {
  if (slackWorkspace.openai_key) return [
    Blocks.Section({ text: `${Md.emoji('white_check_mark')} OpenAI API key is already set.`, }).accessory(
      Elements.OverflowMenu({ actionId: SLACK_ACTIONS.OPENAI_API_KEY_OVERFLOW_MENU }).options([
        Bits.Option({
          text: `${Md.emoji('pencil')} Edit`,
          value: 'edit',
        }),
        Bits.Option({
          text: `${Md.emoji('no_entry')} Remove`,
          value: 'remove',
        })
      ])
    )
  ];
  return [
    Blocks.Section({ text: 'To get started, please enter your OpenAI API key:' }).accessory(
      Elements.Button({
        text: 'Add OpenAI Key',
        actionId: SLACK_ACTIONS.ADD_OPENAI_KEY,
      }).primary()
    )
  ]
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

const getIntegrationInfo = (
  selectedTool: typeof INTEGRATIONS[number]['value'],
  teamId: string, connection?: HomeViewArgs['connection']
): BlockBuilder[] => {
  const integration = INTEGRATIONS.find(integration => integration.value === selectedTool);
  if (!integration) return [];
  const overflowMenuOptions = [
    Bits.Option({
      text: `${Md.emoji('no_entry')} Disconnect`,
      value: 'disconnect',
    })
  ];
  if (connection instanceof PostgresConfig) {
    overflowMenuOptions.unshift(
      Bits.Option({
        text: `${Md.emoji('pencil')} Edit`,
        value: 'edit',
      })
    )
  }
  const accessory = connection ?
    Elements.OverflowMenu({ actionId: SLACK_ACTIONS.CONNECTION_OVERFLOW_MENU }).options(overflowMenuOptions)
    : Elements.Button({
      text: 'Connect',
      actionId: SLACK_ACTIONS.INSTALL_TOOL,
      value: selectedTool,
      url: integration.oauth ? getInstallUrl(selectedTool, teamId) : undefined,
    }).primary();
  return [Blocks.Section({
    blockId: JSON.stringify({
      type: integration.value,
    })
  })
    .text(connection ? getConnectionInfo(connection) : integration.helpText)
    .accessory(
      accessory
    )
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
        blocks: modal,
        private_metadata: JSON.stringify({
          id: args.initialValues?.id
        })
      }
    });
  } catch (error) {
    console.error("Error publishing PostgreSQL connection modal:", error);
    throw error;
  }
};

export const publishOpenaiKeyModal = async (
  client: WebClient,
  args: {
    triggerId: string,
    teamId: string
  }
): Promise<void> => {
  await client.views.open({
    trigger_id: args.triggerId,
    view: {
      ...Surfaces.Modal({
        title: 'OpenAI Key',
        submit: 'Submit',
        close: 'Cancel',
        callbackId: SLACK_ACTIONS.OPENAI_API_KEY_MODAL.SUBMIT
      }).buildToObject(),
      blocks: BlockCollection([
        Section({
          text: 'Please enter your OpenAI API key:'
        }),
        Input({
          label: 'OpenAI API Key',
          blockId: 'openai_api_key',
        }).element(Elements.TextInput({
          placeholder: 'sk-...',
          actionId: SLACK_ACTIONS.OPENAI_API_KEY_MODAL.OPENAI_API_KEY_INPUT
        }))
      ])
    }
  });
};

const getNonAdminView = (slackWorkspace: SlackWorkspace): BlockBuilder[] => {
  let warningText = '';
  if (slackWorkspace.admin_user_ids.length) {
    warningText += `Please contact one of the admins (${slackWorkspace.admin_user_ids.map(admin => `<@${admin}>`).join(', ')}) to get access.`
  } else {
    warningText += 'Please contact support@quixagent.app to get access.'
  }
  return [
    Blocks.Section({ text: `${Md.emoji('warning')} You are not authorized to configure Quix. ${warningText}` })
  ]
}


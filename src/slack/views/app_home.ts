import { HomeView } from "@slack/web-api";
import { SLACK_ACTIONS } from "@quix/lib/utils/slack-constants";
import { HomeViewArgs } from "./types";
import { INTEGRATIONS } from "@quix/lib/constants";
import { getInstallUrl } from "@quix/lib/utils/slack";
import { HubspotConfig, JiraConfig, PostgresConfig, SlackWorkspace, GithubConfig, SalesforceConfig } from "@quix/database/models";
import { BlockCollection, Elements, Bits, Blocks, Md, BlockBuilder } from "slack-block-builder";

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
    blocks.push(...getPreferencesView());
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
    case connection instanceof GithubConfig:
      return `Connected to ${connection.username}`
    case connection instanceof SalesforceConfig:
      return `Connected to ${connection.instance_url}`
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

const getPreferencesView = (): BlockBuilder[] => {
  return [
    Blocks.Section({
      text: 'Allow team members to configure tools that Quix uses.',
    }).accessory(
      Elements.Button({
        text: 'Manage Admins',
        actionId: SLACK_ACTIONS.MANAGE_ADMINS
      })
    ),
    Blocks.Divider()
  ]
}
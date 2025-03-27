import { HomeView } from "@slack/web-api";
import { SLACK_ACTIONS } from "@quix/lib/utils/slack-constants";
import { HomeViewArgs } from "./types";
import { INTEGRATIONS, SUPPORTED_INTEGRATIONS } from "@quix/lib/constants";
import { getInstallUrl } from "@quix/lib/utils/slack";
import { HubspotConfig, JiraConfig, PostgresConfig, SlackWorkspace, GithubConfig, SalesforceConfig } from "@quix/database/models";
import { BlockCollection, Elements, Bits, Blocks, Md, BlockBuilder } from "slack-block-builder";
import { createHubspotToolsExport } from "@clearfeed-ai/quix-hubspot-agent";
import { createJiraToolsExport } from "@clearfeed-ai/quix-jira-agent";
import { createGitHubToolsExport } from '@clearfeed-ai/quix-github-agent';
import { createPostgresToolsExport } from '@clearfeed-ai/quix-postgres-agent';
import { createSalesforceToolsExport } from '@clearfeed-ai/quix-salesforce-agent';
import { getToolConfigData } from "@quix/lib/utils/slack-home";
import { Tool } from "@clearfeed-ai/quix-common-agent";

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
    blocks.push(...getAccessControlView())
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

  blocks.push(Blocks.Divider());

  if (selectedTool) {

    const toolData = getToolData({
      slackWorkspace,
      connection,
      selectedTool,
      userId: args.userId,
    });

    if (toolData.tool && toolData.configData) {
      blocks.push(
        Blocks.Section({
          text: `🔗 *${toolData.tool.name} Connection Details:*`
        }),
        Blocks.Context().elements(toolData.configData),
        Blocks.Section({ text: '\n\n\n' })
      );
    }

    if (toolData.availableFns) {
      blocks.push(
        Blocks.Section({
          text: `💡 *Available Functions:*\n\n${toolData.availableFns?.join('\n\n')}`
        }),
        Blocks.Section({ text: '\n\n\n' })
      );
    }

    if (toolData.tool) {
      blocks.push(
        Blocks.Section({
          text: `🚀 *What you can ask Quix:*\n\n${toolData.tool.capabilities?.map(item => `• ${item}`).join('\n\n')}`
        })
      );
    }
  } else {
    blocks.push(
      Blocks.Section({
        text: '*Welcome to Quix Integrations!*'
      }),
      Blocks.Context().elements(
        'Quix allows you to talk to your tools in plain English right from Slack. Connect any of your business tools to get started.'
      ),
      Blocks.Section({
        text: [
          '*🔗 Supported Integrations:*',
          `• *PostgreSQL:* Query and interact with your postgres database.`,
          `• *GitHub:* Search code, Create issues, fetch PRs, assign teammates.`,
          `• *Jira:* Search, view, and manage jira issues easily.`,
          `• *HubSpot:* Retrieve create hubspot deals, contacts effortlessly.`,
          '',
          '',
          '*💡 Coming Soon:* Zendesk, Salesforce and more.',
          '',
          '',
          '*🚀 Capabilities:*',
          `• Ask questions like:`,
          "• “Give first 10 rows of `accounts` table.”",
          "• “Create a GitHub issue titled Bug in Login flow in `xyz/pqr` repository.”",
          "• “Create a deal named Website Upgrade worth $10,000 in stage negotiations.”",
          "• “Assign jira issue `PROJ-123` to `xyz`.”",
          "• “Attach a note titled 'Call Summary' to opportunity `0065g00000XyZt2`: 'Call went well, decision expected by next week.”",
        ].join('\n')
      }),
      Blocks.Context().elements('Connect a tool from the dropdown above to get started.')
    );
  }

  return {
    type: 'home',
    blocks: BlockCollection(blocks)
  }
}

const getToolData = (args: HomeViewArgs) => {
  const { selectedTool, connection } = args;
  let tool, configData, availableFns;
  if (selectedTool) {
    tool = INTEGRATIONS.find(integration => integration.value === selectedTool);
  }
  if (connection) {
    configData = getToolConfigData(connection);
  }
  if (selectedTool) {
    availableFns = getAvailableFns(selectedTool);
  }

  return {
    tool,
    configData,
    availableFns,
  }
}

const getAvailableFns = (
  selectedTool: typeof INTEGRATIONS[number]["value"],
) => {

  if (selectedTool === SUPPORTED_INTEGRATIONS.JIRA) {
    const tools = createJiraToolsExport({
      host: 'test-url',
      auth: { bearerToken: 'test-token' },
    }).tools;

    return tools.map((tool) => (
      '• `' + tool.lc_kwargs.name + '`: ' + tool.lc_kwargs.description
    ));
  }

  if (selectedTool === SUPPORTED_INTEGRATIONS.GITHUB) {
    const tools = createGitHubToolsExport({
      token: 'test-access-token',
      owner: 'test-github-owner',
      repo: 'test-github-repo',
    }).tools;

    return tools.map((tool) => (
      '• `' + tool.lc_kwargs.name + '`: ' + tool.lc_kwargs.description
    ));
  }

  if (selectedTool === SUPPORTED_INTEGRATIONS.HUBSPOT) {
    const tools = createHubspotToolsExport({
      accessToken: 'test-access-token',
    }).tools;

    return tools.map((tool) => (
      '• `' + tool.lc_kwargs.name + '`: ' + tool.lc_kwargs.description
    ));
  }

  if (selectedTool === SUPPORTED_INTEGRATIONS.POSTGRES) {
    const tools = createPostgresToolsExport({
      host: 'test-host',
      port: 8080,
      user: 'test-user',
      password: 'test-password',
      database: 'test-db',
      ssl: false,
    }).tools;

    return tools.map((tool) => (
      '• `' + tool.lc_kwargs.name + '`: ' + tool.lc_kwargs.description
    ));
  }

  if (selectedTool === SUPPORTED_INTEGRATIONS.SALESFORCE) {
    const tools = createSalesforceToolsExport({
      instanceUrl: 'test-instance-url',
      accessToken: 'test-access-token'
    }).tools;

    return tools.map((tool: Tool) => (
      '• `' + tool.lc_kwargs.name + '`: ' + tool.lc_kwargs.description
    ));
  }

  return ['No Available functions.'];
};

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
  if (connection instanceof GithubConfig) {
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

const getAccessControlView = (): BlockBuilder[] => {
  return [
    Blocks.Section({
      text: 'Allow team members to access Quix across channels and DMs.',
    }).accessory(
      Elements.Button({
        text: 'Manage Access Controls',
        actionId: SLACK_ACTIONS.MANAGE_ACCESS_CONTROLS
      })
    ),
    Blocks.Divider()
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
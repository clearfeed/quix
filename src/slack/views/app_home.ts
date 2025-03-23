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

  blocks.push(Blocks.Divider());

  if (selectedTool) {
    const tool = INTEGRATIONS.find(integration => integration.value === selectedTool);
    if (tool) {
      const connectionInfo = getConnectionInfo(connection);
      const capabilitiesMap: Record<string, { metadata: string[], examples: string[] }> = {
        github: {
          metadata: [
            `👤 *Username:* ${(connection as GithubConfig).username}`,
            `🔧 *Scopes:* ${(connection as GithubConfig).scopes?.join(', ') || 'N/A'}`
          ],
          examples: [
            'Create an issue in repo `my-repo`',
            'List all open PRs assigned to me',
            'Get details of issue `#123`'
          ]
        },
        jira: {
          metadata: [
            `🌐 *Jira URL:* ${(connection as JiraConfig).url}`,
            `📁 *Project Key:* ${(connection as JiraConfig).default_config?.projectKey || 'Not set'}`
          ],
          examples: [
            'Search for all open issues assigned to me',
            'Get details for issue `JIRA-101`',
            'List issues in project `ABC`'
          ]
        },
        hubspot: {
          metadata: [
            `🌐 *Hub Domain:* ${(connection as HubspotConfig).hub_domain}`,
            `🔐 *Scopes:* ${(connection as HubspotConfig).scopes?.join(', ') || 'N/A'}`
          ],
          examples: [
            'Find contact with email `john@doe.com`',
            'Get details of deal with ID `12345`',
            'List all recently modified companies'
          ]
        },
        postgres: {
          metadata: [
            `🛠️ *Host:* ${(connection as PostgresConfig).host}`,
            `🗄️ *Database:* ${(connection as PostgresConfig).database}`,
            `🔐 *User:* ${(connection as PostgresConfig).user}`,
            `🔒 *SSL Enabled:* ${(connection as PostgresConfig).ssl ? 'Yes' : 'No'}`
          ],
          examples: [
            'Get the top 5 customers by revenue',
            'Show orders placed in the last 7 days',
            'List employees in the Sales department'
          ]
        }
      };

      const toolData = capabilitiesMap[selectedTool];
      if (toolData) {
        blocks.push(
          Blocks.Section({ text: `*You're connected to ${tool.name}!*` }),
          Blocks.Context().elements(toolData.metadata),
          Blocks.Section({
            text: `*Here are some things you can ask Quix:*`
          }),
          Blocks.Section({
            text: toolData.examples.map(e => `• *${e}*`).join('\n')
          })
        );
      }
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
          '*💡 Coming Soon:* Zendesk and more.',
          '',
          '',
          '*🚀 Capabilities:*',
          `• Ask questions like:`,
          `• “Give first 10 rows of accounts table.”`,
          `• “Create a GitHub issue titled Bug in Login flow in xyz/pqr repository.”`,
          `• “Create a deal named Website Upgrade worth $10,000 in stage negotiations.”`,
          `• “Assign jira issue PROJ-123 to xyz.”`
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
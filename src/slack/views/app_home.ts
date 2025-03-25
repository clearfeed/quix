import { HomeView } from "@slack/web-api";
import { SLACK_ACTIONS } from "@quix/lib/utils/slack-constants";
import { HomeViewArgs } from "./types";
import { INTEGRATIONS, SUPPORTED_INTEGRATIONS } from "@quix/lib/constants";
import { getInstallUrl } from "@quix/lib/utils/slack";
import { HubspotConfig, JiraConfig, PostgresConfig, SlackWorkspace, GithubConfig, SalesforceConfig } from "@quix/database/models";
import { BlockCollection, Elements, Bits, Blocks, Md, BlockBuilder } from "slack-block-builder";
import { createHubspotToolsExport } from "agent-packages/packages/hubspot/dist";
import { createJiraToolsExport } from "@clearfeed-ai/quix-jira-agent";
import { createGitHubToolsExport } from '@clearfeed-ai/quix-github-agent';
import { createPostgresToolsExport } from '@clearfeed-ai/quix-postgres-agent';

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

    if (toolData.capabilities) {
      blocks.push(
        Blocks.Section({
          text: `🚀 *What you can ask Quix:*\n\n${toolData.capabilities?.map(item => `• ${item}`).join('\n\n')}`
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

const getToolData = (args: HomeViewArgs) => {
  const { selectedTool, slackWorkspace, connection } = args;
  let tool, configData, availableFns, capabilities;
  if (selectedTool) {
    tool = INTEGRATIONS.find(integration => integration.value === selectedTool);
  }
  if (connection) {
    configData = getToolConfigData(connection);
  }
  if (selectedTool && slackWorkspace) {
    availableFns = getAvailableFns(selectedTool, slackWorkspace);
  }
  if (selectedTool) {
    capabilities = getCapabilities(selectedTool);
  }

  return {
    tool,
    configData,
    availableFns,
    capabilities
  }
}

const getToolConfigData = (connection: GithubConfig | JiraConfig | HubspotConfig | PostgresConfig | SalesforceConfig) => {
  switch (true) {
  case connection instanceof JiraConfig:
    return [
      `👤 *Username:* ${connection.url}`
    ];
  case connection instanceof HubspotConfig:
    return [
      `🌐 *Hub Domain:* ${connection.hub_domain}`,
    ]
  case connection instanceof PostgresConfig:
    return [
      `🛠️ *Host:* ${connection.host}`,
      `🗄️ *Database:* ${connection.database}`,
      `🔐 *User:* ${connection.user}`,
      `🔒 *SSL Enabled:* ${connection.ssl ? 'Yes' : 'No'}`
    ]
  case connection instanceof GithubConfig:
    return [
      `👤 *Username:* ${connection.username}`
    ];
  default:
    return [
      'No config data.'
    ];
  }
}

const getAvailableFns = (
  selectedTool: typeof INTEGRATIONS[number]["value"],
  slackWorkspace: SlackWorkspace
) => {

  const jiraConfig = slackWorkspace.jiraConfig;
  const githubConfig = slackWorkspace.githubConfig;
  const hubspotConfig = slackWorkspace.hubspotConfig;
  const postgresConfig = slackWorkspace.postgresConfig;

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

  if (selectedTool === SUPPORTED_INTEGRATIONS.HUBSPOT && hubspotConfig) {
    const tools = createHubspotToolsExport({
      accessToken: 'test-access-token',
    }).tools;

    return tools.map((tool) => (
      '• `' + tool.lc_kwargs.name + '`: ' + tool.lc_kwargs.description
    ));
  }

  if (selectedTool === SUPPORTED_INTEGRATIONS.POSTGRES && postgresConfig) {
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

  return ['No Available functions.'];
};

const getCapabilities = (selectedTool: typeof INTEGRATIONS[number]["value"]) => {
  switch (selectedTool) {
  case SUPPORTED_INTEGRATIONS.JIRA:
    return [
      "Find all Jira issues mentioning payment failure",
      "What’s the status of `PROJ-256`?",
      "Create a bug in the `ABC` project titled 'Login button not responsive', assign it to `john.doe`, with high priority.",
      "Assign issue `PROJ-142` to `alice.smith`",
      "Add a comment to `PROJ-123`: 'Waiting for design team’s input.",
      "Show me all comments on `PROJ-987`",
      "Update `PROJ-321`: change the summary to 'Onboarding flow issues', assign it to user ID `abc123`, and set priority to Medium.",
      "Search for users named `Rahul`"
    ];
  case SUPPORTED_INTEGRATIONS.HUBSPOT:
    return [
      "Find deals related to 'Website Redesign'",
      "Search HubSpot deals that mention 'Q2 renewal'",
      "Add a note to deal `934756`: 'Client approved the new pricing structure.'",
      "Attach a note saying 'Follow up next Tuesday' to deal ID `872390`",
      "Create a deal named 'Enterprise Website Project' worth $15,000 in negotiation stage",
      "Create a contact for `John Doe`, `john.doe@example.com`, phone: `+1234567890`"
    ]
  case SUPPORTED_INTEGRATIONS.POSTGRES:
    return [
      "What tables do we have in our database?",
      "What’s the schema of the `users` table?",
      "Show columns and data types of the `orders` table",
      "Give me the top 5 customers by `revenue`",
      "Show all `employees` from the `Sales department`",
      "Get `orders` placed in the last 7 days"
    ]
  case SUPPORTED_INTEGRATIONS.GITHUB:
    return [
      "Find all issues in the `backend` repo related to authentication bugs created by `johnsmith`",
      "Show me the details of issue number 72 in the `frontend/org-xyz` repo",
      "Assign issue #101 in website repo to user `alicehub`",
      "Unassign bobdev from issue #204 in `api-server` repo of `org-xyz`",
      "List all users in our GitHub org `openai-labs`",
      "Create an issue in the `react/facebook` repo titled 'Crash on launch' with description 'The app crashes immediately after opening on iOS 17.'",
      "Search for the keyword `useEffect` in the `dashboard-ui/imkhateeb` repository"
    ];
  default:
    return [
      "Ask questions like:",
      "Give first 10 rows of `accounts` table.",
      "Create a GitHub issue titled Bug in Login flow in `xyz/pqr` repository.",
      "Create a deal named Website Upgrade worth $10,000 in stage negotiations.",
      "Assign jira issue PROJ-123 to xyz."
    ];
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
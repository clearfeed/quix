import { SLACK_ACTIONS, TRIAL_DAYS } from '@quix/lib/utils/slack-constants';
import { HomeViewArgs } from './types';
import { INTEGRATIONS, SUPPORTED_INTEGRATIONS } from '@quix/lib/constants';
import { getInstallUrl } from '@quix/lib/utils/slack';
import {
  HubspotConfig,
  JiraConfig,
  PostgresConfig,
  SlackWorkspace,
  GithubConfig,
  SalesforceConfig,
  NotionConfig,
  LinearConfig,
  McpConnection,
  OktaConfig
} from '@quix/database/models';
import {
  Elements,
  Bits,
  Blocks,
  Md,
  BlockBuilder,
  OptionBuilder,
  OptionGroupBuilder
} from 'slack-block-builder';
import { createHubspotToolsExport } from '@clearfeed-ai/quix-hubspot-agent';
import { createJiraToolsExport } from '@clearfeed-ai/quix-jira-agent';
import { createGitHubToolsExport } from '@clearfeed-ai/quix-github-agent';
import { createPostgresToolsExport } from '@clearfeed-ai/quix-postgres-agent';
import { createSalesforceToolsExport } from '@clearfeed-ai/quix-salesforce-agent';
import { Tool } from '@clearfeed-ai/quix-common-agent';
import { partition, isEmpty } from 'lodash';

export const getToolData = async (
  selectedTool: (typeof INTEGRATIONS)[number]['value'] | string | undefined
) => {
  let tool, availableFns;

  // Only process standard integrations
  if (
    selectedTool &&
    typeof selectedTool === 'string' &&
    !selectedTool.startsWith('mcp:') &&
    selectedTool !== 'add_mcp_server'
  ) {
    const integrationValue = selectedTool as SUPPORTED_INTEGRATIONS;
    tool = INTEGRATIONS.find((integration) => integration.value === integrationValue);
    availableFns = await getAvailableFns(integrationValue);
  }

  return {
    availableFns
  };
};

const getAvailableFns = async (selectedTool: SUPPORTED_INTEGRATIONS) => {
  if (selectedTool === SUPPORTED_INTEGRATIONS.JIRA) {
    const tools = createJiraToolsExport({
      host: 'test-url',
      auth: { bearerToken: 'test-token' }
    }).tools;

    return tools.map((tool) => '• `' + tool.lc_kwargs.name + '`: ' + tool.lc_kwargs.description);
  }

  if (selectedTool === SUPPORTED_INTEGRATIONS.GITHUB) {
    const tools = (
      await createGitHubToolsExport({
        token: 'test-access-token',
        owner: 'test-github-owner',
        repo: 'test-github-repo'
      })
    ).tools;

    return tools.map((tool) => '• `' + tool.lc_kwargs.name + '`: ' + tool.lc_kwargs.description);
  }

  if (selectedTool === SUPPORTED_INTEGRATIONS.HUBSPOT) {
    const tools = createHubspotToolsExport({
      accessToken: 'test-access-token'
    }).tools;

    return tools.map((tool) => '• `' + tool.lc_kwargs.name + '`: ' + tool.lc_kwargs.description);
  }

  if (selectedTool === SUPPORTED_INTEGRATIONS.POSTGRES) {
    const tools = createPostgresToolsExport({
      host: 'test-host',
      port: 8080,
      user: 'test-user',
      password: 'test-password',
      database: 'test-db',
      ssl: false
    }).tools;

    return tools.map((tool) => '• `' + tool.lc_kwargs.name + '`: ' + tool.lc_kwargs.description);
  }

  if (selectedTool === SUPPORTED_INTEGRATIONS.SALESFORCE) {
    const tools = createSalesforceToolsExport({
      instanceUrl: 'test-instance-url',
      accessToken: 'test-access-token'
    }).tools;

    return tools.map(
      (tool: Tool) => '• `' + tool.lc_kwargs.name + '`: ' + tool.lc_kwargs.description
    );
  }

  return [];
};

export const getMCPConnectionDropDownValue = (mcpConnection: McpConnection): string => {
  return `mcp:${mcpConnection.id}`;
};

export const getToolConnectionView = (
  selectedTool: (typeof INTEGRATIONS)[number]['value'] | string | undefined,
  mcpConnections: McpConnection[] = [],
  slackWorkspace: SlackWorkspace
): BlockBuilder[] => {
  const select = Elements.StaticSelect({
    placeholder: 'Select a tool',
    actionId: SLACK_ACTIONS.CONNECT_TOOL
  });

  const [connectedIntegrations, nonConnectedIntegrations] = partition(
    INTEGRATIONS,
    (integration) => {
      const relationKey = integration.relation as keyof SlackWorkspace;
      return !isEmpty(slackWorkspace[relationKey]);
    }
  );

  let connectedOptions: OptionBuilder[] = [];
  connectedIntegrations.forEach((integration) => {
    connectedOptions.push(
      Bits.Option({
        text: integration.name,
        value: integration.value
      })
    );
  });

  mcpConnections.forEach((conn) =>
    connectedOptions.push(
      Bits.Option({
        text: conn.name,
        value: `mcp:${conn.id}`
      })
    )
  );

  const integrationOptions = nonConnectedIntegrations.map((integration) =>
    Bits.Option({
      text: integration.name,
      value: integration.value
    })
  );

  const addYourOwnOption = Bits.Option({
    text: 'Add your MCP Server',
    value: 'add_mcp_server'
  });

  // Build sections in correct order
  const optionGroups: OptionGroupBuilder[] = [];

  if (connectedOptions.length) {
    optionGroups.push(
      Bits.OptionGroup()
        .label('Connected Tools')
        .options(...connectedOptions)
    );
  }

  if (integrationOptions.length) {
    optionGroups.push(
      Bits.OptionGroup()
        .label('Integrations')
        .options(...integrationOptions)
    );
  }

  optionGroups.push(Bits.OptionGroup().label('Add Your Own').options(addYourOwnOption));

  select.optionGroups(...optionGroups);

  // Set selected option properly
  if (selectedTool) {
    if (selectedTool.startsWith('mcp:')) {
      const mcpId = selectedTool.split(':')[1];
      const conn = mcpConnections.find((c) => c.id === mcpId);
      if (conn) {
        select.initialOption(
          Bits.Option({
            text: conn.name,
            value: selectedTool
          })
        );
      }
    } else if (selectedTool === 'add_mcp_server') {
      select.initialOption(addYourOwnOption);
    } else {
      const integration = INTEGRATIONS.find((i) => i.value === selectedTool);
      if (integration) {
        select.initialOption(
          Bits.Option({
            text: integration.name,
            value: selectedTool
          })
        );
      }
    }
  }

  return [
    Blocks.Input({
      label: 'Connect your tools to get started'
    })
      .element(select)
      .dispatchAction(true)
  ];
};

export const getOpenAIView = (slackWorkspace: SlackWorkspace): BlockBuilder[] => {
  if (slackWorkspace.isOpenAIKeySet)
    return [
      Blocks.Section({
        text: `${Md.emoji('white_check_mark')} OpenAI API key is already set.`
      }).accessory(
        Elements.OverflowMenu({ actionId: SLACK_ACTIONS.OPENAI_API_KEY_OVERFLOW_MENU }).options([
          Bits.Option({
            text: `${Md.emoji('pencil')} Edit`,
            value: 'edit'
          }),
          Bits.Option({
            text: `${Md.emoji('no_entry')} Remove`,
            value: 'remove'
          })
        ])
      )
    ];

  const createdAt = new Date(slackWorkspace.created_at);
  const trialEndDate = new Date(createdAt.getTime() + TRIAL_DAYS * 1000 * 60 * 60 * 24);
  const currentDate = new Date();
  const daysRemaining = Math.floor(
    (trialEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  let message = '';
  if (daysRemaining >= 0) {
    message = `${Md.emoji('rocket')} *Trial Mode Active*\n`;
    if (daysRemaining === 0) {
      message += 'Your trial will expire today';
    } else {
      message += `Your trial will expire in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`;
    }
    message += `\nTo continue using Quix after the trial, please enter your OpenAI API key.`;
  } else {
    message = `Your trial has expired. Please enter your OpenAI API key to continue using Quix.`;
  }
  return [
    Blocks.Section({
      text: message
    }).accessory(
      Elements.Button({
        text: 'Add OpenAI Key',
        actionId: SLACK_ACTIONS.ADD_OPENAI_KEY
      }).primary()
    )
  ];
};

export const getConnectionInfo = (connection: HomeViewArgs['connection']): string => {
  if (!connection) return '';
  switch (true) {
    case connection instanceof JiraConfig:
      return `Connected to ${connection.url}`;
    case connection instanceof HubspotConfig:
      return `Connected to ${connection.hub_domain}`;
    case connection instanceof PostgresConfig:
      return `Connected to ${connection.host}`;
    case connection instanceof GithubConfig:
      return `Connected to ${connection.username}`;
    case connection instanceof SalesforceConfig:
      return `Connected to ${connection.instance_url}`;
    case connection instanceof NotionConfig:
      return `Connected to ${connection.workspace_name}`;
    case connection instanceof LinearConfig:
      return `Connected to ${connection.workspace_name}`;
    case connection instanceof OktaConfig:
      return `Connected to ${connection.org_url}`;
    default:
      return '';
  }
};

export const getIntegrationInfo = (
  selectedTool: (typeof INTEGRATIONS)[number]['value'] | string,
  teamId: string,
  connection?: HomeViewArgs['connection'],
  mcpConnections?: McpConnection[]
): BlockBuilder[] => {
  // Handle MCP server or Add MCP server option
  if (selectedTool === 'add_mcp_server') {
    return [
      Blocks.Section({
        text: 'Connect to your MCP server to access its tools.'
      }).accessory(
        Elements.Button({
          text: 'Connect',
          actionId: SLACK_ACTIONS.INSTALL_MCP_SERVER
        }).primary()
      )
    ];
  }

  if (typeof selectedTool === 'string' && selectedTool.startsWith('mcp:')) {
    const mcpConnection = mcpConnections?.find((c) => c.id === selectedTool.split(':')[1]);
    if (!mcpConnection) return [];

    return [
      Blocks.Section({
        text: `Connected to ${mcpConnection.name} (${mcpConnection.url})`,
        blockId: JSON.stringify({
          type: 'mcp',
          id: mcpConnection.id
        })
      }).accessory(
        Elements.OverflowMenu({
          actionId: SLACK_ACTIONS.CONNECTION_OVERFLOW_MENU
        }).options([
          Bits.Option({
            text: `${Md.emoji('pencil')} Edit`,
            value: 'edit'
          }),
          Bits.Option({
            text: `${Md.emoji('no_entry')} Disconnect`,
            value: 'disconnect'
          })
        ])
      )
    ];
  }

  // Handle standard integrations
  const integrationValue = selectedTool as SUPPORTED_INTEGRATIONS;
  const integration = INTEGRATIONS.find((integration) => integration.value === integrationValue);
  if (!integration) return [];

  const overflowMenuOptions = [
    Bits.Option({
      text: `${Md.emoji('no_entry')} Disconnect`,
      value: 'disconnect'
    })
  ];

  if (
    connection instanceof PostgresConfig ||
    connection instanceof NotionConfig ||
    connection instanceof JiraConfig ||
    connection instanceof GithubConfig ||
    connection instanceof SalesforceConfig ||
    connection instanceof HubspotConfig ||
    connection instanceof LinearConfig
  ) {
    overflowMenuOptions.unshift(
      Bits.Option({
        text: `${Md.emoji('pencil')} Edit`,
        value: 'edit'
      })
    );
  }

  const accessory = connection
    ? Elements.OverflowMenu({ actionId: SLACK_ACTIONS.CONNECTION_OVERFLOW_MENU }).options(
        overflowMenuOptions
      )
    : Elements.Button({
        text: 'Connect',
        actionId: SLACK_ACTIONS.INSTALL_TOOL,
        value: integrationValue,
        url: integration.oauth ? getInstallUrl(integrationValue, teamId) : undefined
      }).primary();

  return [
    Blocks.Section({
      blockId: JSON.stringify({
        type: integration.value
      })
    })
      .text(connection ? getConnectionInfo(connection) : integration.helpText)
      .accessory(accessory)
  ];
};

export const getNonAdminView = (slackWorkspace: SlackWorkspace): BlockBuilder[] => {
  let warningText = '';
  if (slackWorkspace.admin_user_ids.length) {
    warningText += `Please contact one of the admins (${slackWorkspace.admin_user_ids.map((admin) => `<@${admin}>`).join(', ')}) to get access.`;
  } else {
    warningText += 'Please contact support@quixagent.app to get access.';
  }
  return [
    Blocks.Section({
      text: `${Md.emoji('warning')} You are not authorized to configure Quix. ${warningText}`
    })
  ];
};

export const getAccessControlView = (): BlockBuilder[] => {
  return [
    Blocks.Section({
      text: 'Allow team members to access Quix across channels and DMs.'
    }).accessory(
      Elements.Button({
        text: 'Manage Access Controls',
        actionId: SLACK_ACTIONS.MANAGE_ACCESS_CONTROLS
      })
    ),
    Blocks.Divider()
  ];
};

export const getPreferencesView = (): BlockBuilder[] => {
  return [
    Blocks.Section({
      text: 'Allow team members to configure tools that Quix uses.'
    }).accessory(
      Elements.Button({
        text: 'Manage Admins',
        actionId: SLACK_ACTIONS.MANAGE_ADMINS
      })
    ),
    Blocks.Divider()
  ];
};

// New function to provide onboarding guidance when no connections are set up
export const getOnboardingView = (): BlockBuilder[] => {
  return [
    Blocks.Section({
      text: `${Md.emoji('pushpin')} *Get Started with Quix*`
    }),
    Blocks.Section({
      text: 'For quick access to Quix, we recommend pinning this app to your Slack workspace:'
    }),
    Blocks.Section({
      text: `${Md.emoji('one')} Click on your workspace name in the top left\n${Md.emoji('two')} Select "Preferences > Navigation > App agents & assistants"\n${Md.emoji('three')} Find and select Quix to pin it to your sidebar`
    }),
    Blocks.Divider(),
    Blocks.Section({
      text: `${Md.emoji('speech_balloon')} *How to Use Quix*`
    }),
    Blocks.Section({
      text: 'You can use Quix by:'
    }),
    Blocks.Section({
      text: `• *Mention @Quix* in any channel where the app is added\n• *Direct message* Quix for private conversations`
    }),
    Blocks.Divider()
  ];
};

export const getCommunityLinkView = (): BlockBuilder[] => {
  return [
    Blocks.Section({
      text: `${Md.emoji('handshake')} *Need help or want to connect with others?* Join our Slack community!`
    }).accessory(
      Elements.Button({
        text: 'Join',
        url: 'https://join.slack.com/t/quixagent/shared_invite/zt-33kbxkm6t-5nuOeJB2e20~_2Ru8Xmw~Q',
        actionId: 'join_slack_community'
      })
    ),
    Blocks.Divider()
  ];
};

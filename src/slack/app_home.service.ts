import { Injectable, Logger } from '@nestjs/common';
import { SLACK_ACTIONS } from '@quix/lib/utils/slack-constants';
import { BlockElementAction, ButtonAction, StaticSelectAction, OverflowAction } from '@slack/bolt';
import { AppHomeOpenedEvent, HomeView } from '@slack/web-api';
import { WebClient } from '@slack/web-api';
import {
  getAccessControlView,
  getPreferencesView,
  getOnboardingView,
  getOpenAIView,
  getToolConnectionView,
  getIntegrationInfo,
  getNonAdminView,
  getToolData,
  getCommunityLinkView
} from './views/app_home';
import {
  publishPostgresConnectionModal,
  publishManageAdminsModal,
  publishAccessControlModal,
  publishJiraConfigModal,
  publishNotionConnectionModal,
  publishLinearConnectionModal,
  publishMcpConnectionModal,
  publishGithubConfigModal,
  publishSalesforceConfigModal,
  publishOpenaiKeyModal,
  publishOktaConnectionModal,
  publishHubspotConfigModal
} from './views/modals';
import { INTEGRATIONS, QuixUserAccessLevel, SUPPORTED_INTEGRATIONS } from '@quix/lib/constants';
import { SlackService } from './slack.service';
import { SlackWorkspace, PostgresConfig } from '@quix/database/models';
import { IntegrationsService } from 'src/integrations/integrations.service';
import { HomeViewArgs, GithubDefaultConfig } from './views/types';
import { Md } from 'slack-block-builder';
import { Blocks } from 'slack-block-builder';
import { BlockCollection } from 'slack-block-builder';
import { McpService } from '../integrations/mcp.service';
import { TOOL_CONNECTION_MODELS } from './constants';

@Injectable()
export class AppHomeService {
  private readonly logger = new Logger(AppHomeService.name);
  constructor(
    private readonly slackService: SlackService,
    private readonly integrationsService: IntegrationsService,
    private readonly mcpService: McpService
  ) {}

  async handleAppHomeOpened(event: AppHomeOpenedEvent, teamId: string) {
    if (event.tab !== 'home') return;

    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId);
    if (!slackWorkspace) return;

    const webClient = new WebClient(slackWorkspace.bot_access_token);
    await webClient.views.publish({
      user_id: event.user,
      view: await this.getHomeView({ slackWorkspace, userId: event.user })
    });
  }

  async handleAppHomeInteractions(
    action: BlockElementAction,
    teamId: string,
    userId: string,
    triggerId: string
  ) {
    switch (action.action_id) {
      case SLACK_ACTIONS.INSTALL_TOOL:
        if (action.type !== 'button') return;
        this.handleInstallTool(action, teamId, userId, triggerId);
        break;
      case SLACK_ACTIONS.INSTALL_MCP_SERVER:
        if (action.type !== 'button') return;
        this.handleInstallMcpServer(action, teamId, userId, triggerId);
        break;
      case SLACK_ACTIONS.ADD_OPENAI_KEY:
        if (action.type !== 'button') return;
        this.handleAddOpenaiKey(action, teamId, userId, triggerId);
        break;
      case SLACK_ACTIONS.MANAGE_ADMINS:
        if (action.type !== 'button') return;
        this.handleManageAdmins(action, teamId, userId, triggerId);
        break;
      case SLACK_ACTIONS.CONNECTION_OVERFLOW_MENU:
        if (action.type !== 'overflow') return;
        this.handleConnectionOverflowMenu(action, teamId, userId, triggerId);
        break;
      case SLACK_ACTIONS.OPENAI_API_KEY_OVERFLOW_MENU:
        if (action.type !== 'overflow') return;
        this.handleOpenaiApiKeyOverflowMenu(action, teamId, userId, triggerId);
        break;
      case SLACK_ACTIONS.CONNECT_TOOL:
        if (action.type !== 'static_select') return;
        this.handleConnectTool(action, teamId, userId);
        break;
      case SLACK_ACTIONS.MANAGE_ACCESS_CONTROLS:
        if (action.type !== 'button') return;
        this.handleManageAccessControls(action, teamId, userId, triggerId);
        break;
    }
  }

  async handleManageAccessControls(
    action: ButtonAction,
    teamId: string,
    userId: string,
    triggerId: string
  ) {
    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId);
    if (!slackWorkspace) return;
    const webClient = new WebClient(slackWorkspace.bot_access_token);
    await publishAccessControlModal(webClient, {
      triggerId,
      teamId,
      initialChannels: slackWorkspace.access_settings.allowedChannelIds,
      initialAccessLevel: slackWorkspace.access_settings.allowedUsersForDmInteraction
    });
  }

  async handleManageAccessControlsSubmitted(
    userId: string,
    teamId: string,
    allowedChannels: string[],
    accessLevel: QuixUserAccessLevel
  ) {
    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId);
    if (!slackWorkspace) return;
    slackWorkspace.addChannels(allowedChannels);
    slackWorkspace.setAccessLevel(accessLevel || 'everyone');
    await slackWorkspace.save();
    const webClient = new WebClient(slackWorkspace.bot_access_token);
    await webClient.views.publish({
      user_id: userId,
      view: await this.getHomeView({
        slackWorkspace,
        userId
      })
    });
  }

  async handleConnectTool(action: StaticSelectAction, teamId: string, userId: string) {
    const selectedTool = action.selected_option?.value;
    const integration = INTEGRATIONS.find((integration) => integration.value === selectedTool);
    const relations = ['mcpConnections'];
    if (integration) relations.push(integration.relation);
    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId);
    if (!slackWorkspace) return;
    const webClient = new WebClient(slackWorkspace.bot_access_token);
    this.logger.log('Publishing home view', { selectedTool });

    await webClient.views.publish({
      user_id: userId,
      view: await this.getHomeView({
        selectedTool,
        slackWorkspace,
        connection: integration
          ? slackWorkspace[integration.relation as keyof SlackWorkspace]
          : undefined,
        userId
      })
    });
  }

  async handleInstallTool(action: ButtonAction, teamId: string, userId: string, triggerId: string) {
    const selectedTool = action.value as SUPPORTED_INTEGRATIONS | undefined;
    const integration = INTEGRATIONS.find((integration) => integration.value === selectedTool);
    if (!selectedTool || !integration) return;
    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId, [
      integration.relation
    ]);
    if (!slackWorkspace) return;
    const webClient = new WebClient(slackWorkspace.bot_access_token);
    if (selectedTool === SUPPORTED_INTEGRATIONS.POSTGRES) {
      const initialValues = slackWorkspace.postgresConfig
        ? {
            id: slackWorkspace.postgresConfig.id,
            host: slackWorkspace.postgresConfig.host,
            port: slackWorkspace.postgresConfig.port?.toString(),
            username: slackWorkspace.postgresConfig.user,
            password: slackWorkspace.postgresConfig.password,
            database: slackWorkspace.postgresConfig.database,
            ssl: slackWorkspace.postgresConfig.ssl ? true : false
          }
        : undefined;
      await publishPostgresConnectionModal(webClient, {
        triggerId,
        teamId,
        initialValues
      });
    } else if (selectedTool === SUPPORTED_INTEGRATIONS.NOTION) {
      const initialValues = slackWorkspace.notionConfig
        ? {
            id: slackWorkspace.notionConfig.id,
            apiToken: slackWorkspace.notionConfig.access_token
          }
        : undefined;
      await publishNotionConnectionModal(webClient, {
        triggerId,
        teamId,
        initialValues
      });
    } else if (selectedTool === SUPPORTED_INTEGRATIONS.LINEAR) {
      const initialValues = slackWorkspace.linearConfig
        ? {
            id: slackWorkspace.linearConfig.id,
            apiToken: slackWorkspace.linearConfig.access_token
          }
        : undefined;
      await publishLinearConnectionModal(webClient, {
        triggerId,
        teamId,
        initialValues
      });
    } else if (selectedTool === SUPPORTED_INTEGRATIONS.OKTA) {
      const initialValues = slackWorkspace.oktaConfig
        ? {
            id: slackWorkspace.oktaConfig.org_id,
            orgUrl: slackWorkspace.oktaConfig.org_url,
            apiToken: slackWorkspace.oktaConfig.api_token
          }
        : undefined;
      await publishOktaConnectionModal(webClient, {
        triggerId,
        teamId,
        initialValues
      });
    }
  }

  private async handleConnectionOverflowMenu(
    action: OverflowAction,
    teamId: string,
    userId: string,
    triggerId: string
  ) {
    const selectedOption = action.selected_option?.value as 'edit' | 'disconnect' | undefined;
    try {
      const connectionInfo:
        | {
            type: SUPPORTED_INTEGRATIONS;
          }
        | {
            type: 'mcp';
            id: string;
          } = JSON.parse(action.block_id);
      const integration = INTEGRATIONS.find(
        (integration) => integration.value === connectionInfo.type
      );
      const relations = ['mcpConnections'];
      if (integration) relations.push(integration.relation);
      const slackWorkspace = await this.slackService.getSlackWorkspace(teamId);
      if (!slackWorkspace) return;
      const webClient = new WebClient(slackWorkspace.bot_access_token);
      switch (selectedOption) {
        case 'edit':
          switch (connectionInfo.type) {
            case SUPPORTED_INTEGRATIONS.POSTGRES:
              const { postgresConfig } = slackWorkspace;
              if (!postgresConfig) return;
              await publishPostgresConnectionModal(webClient, {
                triggerId,
                teamId,
                initialValues: {
                  id: postgresConfig.id,
                  host: postgresConfig.host,
                  port: postgresConfig.port.toString(),
                  username: postgresConfig.user,
                  password: postgresConfig.password,
                  database: postgresConfig.database,
                  ssl: postgresConfig.ssl,
                  defaultPrompt: postgresConfig.default_prompt
                }
              });
              break;
            case SUPPORTED_INTEGRATIONS.JIRA:
              const { jiraConfig } = slackWorkspace;
              if (!jiraConfig) return;
              await publishJiraConfigModal(webClient, {
                triggerId,
                teamId,
                projectKey: jiraConfig.default_config?.projectKey || '',
                defaultPrompt: jiraConfig.default_prompt
              });
              break;
            case SUPPORTED_INTEGRATIONS.GITHUB:
              const { githubConfig } = slackWorkspace;
              if (!githubConfig) return;
              await publishGithubConfigModal(webClient, {
                triggerId,
                initialValues: {
                  repo: githubConfig.default_config?.repo || '',
                  owner: githubConfig.default_config?.owner || '',
                  defaultPrompt: githubConfig.default_prompt
                }
              });
              break;
            case SUPPORTED_INTEGRATIONS.NOTION:
              const { notionConfig } = slackWorkspace;
              if (!notionConfig) return;
              await publishNotionConnectionModal(webClient, {
                triggerId,
                teamId,
                initialValues: {
                  apiToken: notionConfig.access_token,
                  defaultPrompt: notionConfig.default_prompt
                }
              });
              break;
            case SUPPORTED_INTEGRATIONS.LINEAR:
              const { linearConfig } = slackWorkspace;
              if (!linearConfig) return;
              await publishLinearConnectionModal(webClient, {
                triggerId,
                teamId,
                initialValues: {
                  apiToken: linearConfig.access_token,
                  defaultPrompt: linearConfig.default_prompt
                }
              });
              break;
            case 'mcp':
              const { mcpConnections } = slackWorkspace;
              const mcpConnection = mcpConnections.find((c) => c.id === connectionInfo.id);
              if (!mcpConnection) return;
              await publishMcpConnectionModal(webClient, {
                triggerId,
                teamId,
                initialValues: {
                  id: mcpConnection.id,
                  url: mcpConnection.url,
                  name: mcpConnection.name,
                  apiToken: mcpConnection.auth_token || undefined,
                  defaultPrompt: mcpConnection.default_prompt,
                  toolSelectionPrompt: mcpConnection.request_config.tool_selection_prompt
                }
              });
              break;
            case SUPPORTED_INTEGRATIONS.SALESFORCE:
              const { salesforceConfig } = slackWorkspace;
              if (!salesforceConfig) return;
              await publishSalesforceConfigModal(webClient, {
                triggerId,
                teamId,
                initialValues: {
                  defaultPrompt: salesforceConfig.default_prompt
                }
              });
              break;
            case SUPPORTED_INTEGRATIONS.OKTA:
              const { oktaConfig } = slackWorkspace;
              if (!oktaConfig) return;
              await publishOktaConnectionModal(webClient, {
                triggerId,
                teamId,
                initialValues: {
                  id: oktaConfig.org_id,
                  orgUrl: oktaConfig.org_url,
                  apiToken: oktaConfig.api_token
                }
              });
              break;
            case SUPPORTED_INTEGRATIONS.HUBSPOT:
              const { hubspotConfig } = slackWorkspace;
              if (!hubspotConfig) return;
              await publishHubspotConfigModal(webClient, {
                triggerId,
                teamId,
                initialValues: {
                  defaultPrompt: hubspotConfig.default_prompt
                }
              });
              break;
            default:
              break;
          }
          break;
        case 'disconnect':
          switch (connectionInfo.type) {
            case SUPPORTED_INTEGRATIONS.POSTGRES:
              await this.integrationsService.removePostgresConfig(teamId);
              break;
            case SUPPORTED_INTEGRATIONS.HUBSPOT:
              await this.integrationsService.removeHubspotConfig(teamId);
              break;
            case SUPPORTED_INTEGRATIONS.JIRA:
              await this.integrationsService.removeJiraConfig(teamId);
              break;
            case SUPPORTED_INTEGRATIONS.SALESFORCE:
              await this.integrationsService.removeSalesforceConfig(teamId);
              break;
            case SUPPORTED_INTEGRATIONS.GITHUB:
              await this.integrationsService.removeGithubConfig(teamId);
              break;
            case SUPPORTED_INTEGRATIONS.NOTION:
              await this.integrationsService.removeNotionConfig(teamId);
              break;
            case SUPPORTED_INTEGRATIONS.LINEAR:
              await this.integrationsService.removeLinearConfig(teamId);
              break;
            case 'mcp':
              await this.integrationsService.removeMcpConnection(teamId, connectionInfo.id);
              break;
            case SUPPORTED_INTEGRATIONS.OKTA:
              await this.integrationsService.removeOktaConfig(teamId);
              break;
            default:
              break;
          }
          await slackWorkspace.reload({
            include: TOOL_CONNECTION_MODELS
          });
          await webClient.views.publish({
            user_id: userId,
            view: await this.getHomeView({
              slackWorkspace,
              connection: undefined,
              userId
            })
          });
          break;
      }
    } catch (error) {
      this.logger.error('Error parsing connection info', { error, blockId: action.block_id });
      return;
    }
  }

  async handlePostgresConnected(userId: string, teamId: string, postgresConfig: PostgresConfig) {
    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId);
    if (!slackWorkspace) return;
    const webClient = new WebClient(slackWorkspace.bot_access_token);
    await webClient.views.publish({
      user_id: userId!,
      view: await this.getHomeView({
        slackWorkspace,
        selectedTool: SUPPORTED_INTEGRATIONS.POSTGRES,
        connection: postgresConfig,
        userId
      })
    });
  }

  async handleAddOpenaiKey(
    action: ButtonAction,
    teamId: string,
    userId: string,
    triggerId: string
  ) {
    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId);
    if (!slackWorkspace) return;
    const webClient = new WebClient(slackWorkspace.bot_access_token);
    await publishOpenaiKeyModal(webClient, {
      triggerId,
      teamId
    });
  }

  async handleOpenaiApiKeySubmitted(userId: string, teamId: string, openaiApiKey: string) {
    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId);
    if (!slackWorkspace) return;
    slackWorkspace.openai_key = openaiApiKey;
    await slackWorkspace.save();
    const webClient = new WebClient(slackWorkspace.bot_access_token);
    await webClient.views.publish({
      user_id: userId,
      view: await this.getHomeView({
        slackWorkspace,
        connection: undefined,
        userId
      })
    });
  }

  async handleOpenaiApiKeyOverflowMenu(
    action: OverflowAction,
    teamId: string,
    userId: string,
    triggerId: string
  ) {
    const selectedOption = action.selected_option?.value as 'edit' | 'remove' | undefined;
    if (!selectedOption) return;
    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId);
    if (!slackWorkspace) return;
    const webClient = new WebClient(slackWorkspace.bot_access_token);
    switch (selectedOption) {
      case 'edit':
        await publishOpenaiKeyModal(webClient, {
          triggerId,
          teamId
        });
        break;
      case 'remove':
        slackWorkspace.openai_key = null;
        await slackWorkspace.save();
        await webClient.views.publish({
          user_id: userId,
          view: await this.getHomeView({
            slackWorkspace,
            connection: undefined,
            userId
          })
        });
        break;
    }
  }

  private async handleManageAdmins(
    action: ButtonAction,
    teamId: string,
    userId: string,
    triggerId: string
  ) {
    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId);
    if (!slackWorkspace) return;
    const webClient = new WebClient(slackWorkspace.bot_access_token);
    await publishManageAdminsModal(webClient, {
      triggerId,
      teamId,
      initialUsers: slackWorkspace.admin_user_ids
    });
  }

  async handleManageAdminsSubmitted(userId: string, teamId: string, adminUserIds: string[]) {
    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId);
    if (!slackWorkspace) return;
    slackWorkspace.admin_user_ids = adminUserIds;
    await slackWorkspace.save();
    const webClient = new WebClient(slackWorkspace.bot_access_token);
    await webClient.views.publish({
      user_id: userId,
      view: await this.getHomeView({
        slackWorkspace,
        userId
      })
    });
  }

  async handleJiraConfigurationSubmitted(
    userId: string,
    teamId: string,
    defaultProjectKey: string,
    defaultJiraPrompt: string
  ) {
    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId);
    if (!slackWorkspace?.jiraConfig) return;
    const jiraConfig = slackWorkspace.jiraConfig;
    jiraConfig.default_config = {
      projectKey: defaultProjectKey
    };
    jiraConfig.default_prompt = defaultJiraPrompt;
    await jiraConfig.save();
    const webClient = new WebClient(slackWorkspace.bot_access_token);
    await webClient.views.publish({
      user_id: userId,
      view: await this.getHomeView({
        slackWorkspace,
        userId,
        selectedTool: SUPPORTED_INTEGRATIONS.JIRA,
        connection: jiraConfig
      })
    });
  }

  async handleGithubConfigurationSubmitted(
    userId: string,
    teamId: string,
    defaultConfig: GithubDefaultConfig,
    defaultGithubPrompt: string
  ) {
    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId);
    if (!slackWorkspace?.githubConfig) return;
    const githubConfig = slackWorkspace.githubConfig;
    githubConfig.default_config = defaultConfig;
    githubConfig.default_prompt = defaultGithubPrompt;
    await githubConfig.save();
    const webClient = new WebClient(slackWorkspace.bot_access_token);
    await webClient.views.publish({
      user_id: userId,
      view: await this.getHomeView({
        slackWorkspace,
        userId,
        selectedTool: SUPPORTED_INTEGRATIONS.GITHUB,
        connection: githubConfig
      })
    });
  }

  async handleIntegrationConnected(
    userId: string,
    teamId: string,
    selectedTool: HomeViewArgs['selectedTool'],
    connection: HomeViewArgs['connection']
  ) {
    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId);
    if (!slackWorkspace) return;
    const webClient = new WebClient(slackWorkspace.bot_access_token);
    await webClient.views.publish({
      user_id: userId,
      view: await this.getHomeView({
        slackWorkspace,
        userId,
        selectedTool,
        connection
      })
    });
  }

  async handleInstallMcpServer(
    action: ButtonAction,
    teamId: string,
    userId: string,
    triggerId: string
  ) {
    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId);
    if (!slackWorkspace) return;
    const webClient = new WebClient(slackWorkspace.bot_access_token);
    await publishMcpConnectionModal(webClient, {
      triggerId,
      teamId
    });
  }

  private async getHomeView(args: HomeViewArgs): Promise<HomeView> {
    const { selectedTool, slackWorkspace, connection } = args;
    const mcpConnections = slackWorkspace.mcpConnections;
    const blocks = [
      Blocks.Header({
        text: ':wave: Welcome to Quix'
      }),
      Blocks.Context().elements('Quix helps you talk to your business tools from Slack.'),
      Blocks.Divider()
    ];

    // Add onboarding information for users without any connections
    const hasAnyConnections = Boolean(connection || (mcpConnections && mcpConnections.length > 0));

    if (!connection) {
      blocks.push(...getOnboardingView());
    }

    if (slackWorkspace.isAdmin(args.userId)) {
      blocks.push(...getAccessControlView());
      blocks.push(...getPreferencesView());
      blocks.push(...getOpenAIView(slackWorkspace));
      if (slackWorkspace.openai_key) {
        blocks.push(Blocks.Divider());
        blocks.push(...getToolConnectionView(selectedTool, mcpConnections, slackWorkspace));
        if (selectedTool)
          blocks.push(
            ...getIntegrationInfo(selectedTool, slackWorkspace.team_id, connection, mcpConnections)
          );
      }
    } else {
      blocks.push(...getNonAdminView(slackWorkspace));
    }

    blocks.push(Blocks.Divider());
    let availableFunctionsWithDescriptions: string[] = [];

    if (selectedTool?.startsWith('mcp:')) {
      let mcpToolConfig:
        | Awaited<ReturnType<typeof this.mcpService.getToolsFromMCPConnections>>[number]
        | undefined;
      try {
        [mcpToolConfig] = await this.mcpService.getToolsFromMCPConnections(mcpConnections);
        availableFunctionsWithDescriptions = mcpToolConfig.tools.map((tool) => {
          return `• ${Md.codeInline(tool.name)}: ${tool.description}`;
        });
      } catch (error) {
        this.logger.error('Error getting tools from MCP connections', { error });
        blocks.push(
          Blocks.Section({
            text: `${Md.emoji('warning')} Error fetching tools from this MCP server.`
          })
        );
      } finally {
        mcpToolConfig?.cleanup();
      }
    } else {
      const toolData = await getToolData(selectedTool);
      availableFunctionsWithDescriptions = toolData.availableFns || [];
    }
    if (availableFunctionsWithDescriptions.length) {
      blocks.push(
        Blocks.Section({
          text: `${Md.emoji('bulb')} *Available Functions:*\n\n${availableFunctionsWithDescriptions.join('\n\n')}`
        }),
        Blocks.Section({ text: '\n\n\n' })
      );
    }

    blocks.push(...getCommunityLinkView());

    return {
      type: 'home',
      blocks: BlockCollection(blocks)
    };
  }
}

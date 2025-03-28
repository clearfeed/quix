import { Injectable, Logger } from '@nestjs/common';
import { SLACK_ACTIONS } from '@quix/lib/utils/slack-constants';
import { BlockElementAction, ButtonAction, StaticSelectAction, OverflowAction } from '@slack/bolt';
import { AppHomeOpenedEvent } from '@slack/web-api';
import { WebClient } from '@slack/web-api';
import { getHomeView } from './views/app_home';
import { publishPostgresConnectionModal, publishOpenaiKeyModal, publishManageAdminsModal, publishAccessControlModal, publishJiraConfigModal } from './views/modals';
import { INTEGRATIONS, QuixUserAccessLevel, SUPPORTED_INTEGRATIONS } from '@quix/lib/constants';
import { SlackService } from './slack.service';
import { SlackWorkspace, PostgresConfig, JiraConfig } from '@quix/database/models';
import { IntegrationsService } from 'src/integrations/integrations.service';
import { JiraDefaultConfigModalArgs } from './views/types';
@Injectable()
export class AppHomeService {
  private readonly logger = new Logger(AppHomeService.name);
  constructor(
    private readonly slackService: SlackService,
    private readonly integrationsService: IntegrationsService
  ) { }

  async handleAppHomeOpened(event: AppHomeOpenedEvent, teamId: string) {
    if (event.tab !== 'home') return;

    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId);
    if (!slackWorkspace) return;

    const webClient = new WebClient(slackWorkspace.bot_access_token);
    await webClient.views.publish({
      user_id: event.user,
      view: getHomeView({ slackWorkspace, userId: event.user })
    });
  }

  async handleAppHomeInteractions(action: BlockElementAction, teamId: string, userId: string, triggerId: string) {
    switch (action.action_id) {
    case SLACK_ACTIONS.INSTALL_TOOL:
      if (action.type !== 'button') return;
      this.handleInstallTool(action, teamId, userId, triggerId);
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

  async handleManageAccessControls(action: ButtonAction, teamId: string, userId: string, triggerId: string) {
    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId);
    if (!slackWorkspace) return;
    const webClient = new WebClient(slackWorkspace.bot_access_token);
    await publishAccessControlModal(webClient, { triggerId, teamId, initialChannels: slackWorkspace.access_settings.allowedChannelIds });
  }

  async handleManageAccessControlsSubmitted(userId: string, teamId: string, allowedChannels: string[], accessLevel: QuixUserAccessLevel) {
    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId);
    if (!slackWorkspace) return;
    slackWorkspace.addChannels(allowedChannels);
    slackWorkspace.setAccessLevel(accessLevel || 'everyone')
    await slackWorkspace.save();
    const webClient = new WebClient(slackWorkspace.bot_access_token);
    await webClient.views.publish({
      user_id: userId,
      view: getHomeView({
        slackWorkspace,
        userId
      })
    });
  }

  async handleConnectTool(action: StaticSelectAction, teamId: string, userId: string) {
    const selectedTool = action.selected_option?.value as SUPPORTED_INTEGRATIONS | undefined;
    const integration = INTEGRATIONS.find(integration => integration.value === selectedTool);
    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId, integration ? [integration.relation] : undefined);
    if (!slackWorkspace) return;
    const webClient = new WebClient(slackWorkspace.bot_access_token);
    this.logger.log('Publishing home view', { selectedTool });
    await webClient.views.publish({
      user_id: userId,
      view: getHomeView({
        selectedTool,
        slackWorkspace,
        connection: integration ? slackWorkspace[integration.relation as keyof SlackWorkspace] : undefined,
        userId
      })
    });

  }

  async handleInstallTool(action: ButtonAction, teamId: string, userId: string, triggerId: string) {
    const selectedTool = action.value as SUPPORTED_INTEGRATIONS | undefined;
    const integration = INTEGRATIONS.find(integration => integration.value === selectedTool);
    if (!selectedTool || !integration) return;
    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId, [integration.relation]);
    if (!slackWorkspace) return;
    const webClient = new WebClient(slackWorkspace.bot_access_token);
    if (selectedTool === SUPPORTED_INTEGRATIONS.POSTGRES) {
      const initialValues = slackWorkspace.postgresConfig ? {
        id: slackWorkspace.postgresConfig.id,
        host: slackWorkspace.postgresConfig.host,
        port: slackWorkspace.postgresConfig.port?.toString(),
        username: slackWorkspace.postgresConfig.user,
        password: slackWorkspace.postgresConfig.password,
        database: slackWorkspace.postgresConfig.database,
        ssl: slackWorkspace.postgresConfig.ssl ? true : false
      } : undefined;
      await publishPostgresConnectionModal(webClient, {
        triggerId,
        teamId,
        initialValues
      });
    }
  }

  private async handleConnectionOverflowMenu(action: OverflowAction, teamId: string, userId: string, triggerId: string) {
    const selectedOption = action.selected_option?.value as 'edit' | 'disconnect' | undefined;
    const connectionInfo: {
      type: SUPPORTED_INTEGRATIONS
    } = JSON.parse(action.block_id);
    const integration = INTEGRATIONS.find(integration => integration.value === connectionInfo.type);
    if (!integration) return;
    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId, [integration.relation]);
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
            ssl: postgresConfig.ssl
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
        })
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
      default:
        break;
      }
      await webClient.views.publish({
        user_id: userId,
        view: getHomeView({
          slackWorkspace,
          connection: undefined,
          userId
        })
      });
      break;
    }
  }

  async handlePostgresConnected(userId: string, teamId: string, postgresConfig: PostgresConfig) {
    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId);
    if (!slackWorkspace) return;
    const webClient = new WebClient(slackWorkspace.bot_access_token);
    await webClient.views.publish({
      user_id: userId!,
      view: getHomeView({
        slackWorkspace,
        selectedTool: SUPPORTED_INTEGRATIONS.POSTGRES,
        connection: postgresConfig,
        userId
      })
    });
  }

  async handleAddOpenaiKey(action: ButtonAction, teamId: string, userId: string, triggerId: string) {
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
      view: getHomeView({
        slackWorkspace,
        connection: undefined,
        userId
      })
    });
  }

  async handleOpenaiApiKeyOverflowMenu(action: OverflowAction, teamId: string, userId: string, triggerId: string) {
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
        view: getHomeView({
          slackWorkspace,
          connection: undefined,
          userId
        })
      });
      break;
    }
  }

  private async handleManageAdmins(action: ButtonAction, teamId: string, userId: string, triggerId: string) {
    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId);
    if (!slackWorkspace) return;
    const webClient = new WebClient(slackWorkspace.bot_access_token);
    await publishManageAdminsModal(webClient, { triggerId, teamId, initialUsers: slackWorkspace.admin_user_ids });
  }

  async handleManageAdminsSubmitted(userId: string, teamId: string, adminUserIds: string[]) {
    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId);
    if (!slackWorkspace) return;
    slackWorkspace.admin_user_ids = adminUserIds;
    await slackWorkspace.save();
    const webClient = new WebClient(slackWorkspace.bot_access_token);
    await webClient.views.publish({
      user_id: userId,
      view: getHomeView({
        slackWorkspace,
        userId
      })
    });
  }

  async handleJiraConfigurationSubmitted(userId: string, teamId: string, defaultProjectKey: string) {
    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId, ['jiraConfig']);
    if (!slackWorkspace?.jiraConfig) return;
    const jiraConfig = slackWorkspace.jiraConfig;
    jiraConfig.default_config = {
      projectKey: defaultProjectKey
    };
    await jiraConfig.save();
    const webClient = new WebClient(slackWorkspace.bot_access_token);
    await webClient.views.publish({
      user_id: userId,
      view: getHomeView({
        slackWorkspace,
        userId
      })
    });
  }
}

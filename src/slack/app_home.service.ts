import { Inject, Injectable, Logger } from '@nestjs/common';
import { SLACK_ACTIONS } from '@quix/lib/utils/slack-constants';
import { BlockElementAction, ButtonAction, StaticSelectAction, OverflowAction } from '@slack/bolt';
import { AppHomeOpenedEvent } from '@slack/web-api';
import { WebClient } from '@slack/web-api';
import { getHomeView, publishPostgresConnectionModal } from './views/app_home';
import { INTEGRATIONS, SUPPORTED_INTEGRATIONS } from '@quix/lib/constants';
import { SlackService } from './slack.service';
import { SlackWorkspace, PostgresConfig } from '@quix/database/models';
import { IntegrationsService } from 'src/integrations/integrations.service';
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
      view: getHomeView({ teamId })
    });
  }

  async handleAppHomeInteractions(action: BlockElementAction, teamId: string, userId: string, triggerId: string) {
    switch (action.action_id) {
      case SLACK_ACTIONS.INSTALL_TOOL:
        if (action.type !== 'button') return;
        this.handleInstallTool(action, teamId, userId, triggerId);
        break;
      case SLACK_ACTIONS.CONNECTION_OVERFLOW_MENU:
        if (action.type !== 'overflow') return;
        this.handleConnectionOverflowMenu(action, teamId, userId, triggerId);
        break;
      case SLACK_ACTIONS.CONNECT_TOOL:
        if (action.type !== 'static_select') return;
        this.handleConnectTool(action, teamId, userId);
        break;
    }
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
        teamId,
        connection: integration ? slackWorkspace[integration.relation as keyof SlackWorkspace] : undefined
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
      type: SUPPORTED_INTEGRATIONS,
      id: string
    } = JSON.parse(action.block_id);
    const integration = INTEGRATIONS.find(integration => integration.value === connectionInfo.type);
    if (!integration) return;
    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId, [integration.relation]);
    if (!slackWorkspace) return;
    const webClient = new WebClient(slackWorkspace.bot_access_token);
    switch (selectedOption) {
      case 'edit':
        if (connectionInfo.type === SUPPORTED_INTEGRATIONS.POSTGRES) {
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
        }
        break;
      case 'disconnect':
        await this.integrationsService.removePostgresConfig(connectionInfo.id);
        await webClient.views.publish({
          user_id: userId,
          view: getHomeView({
            teamId,
            connection: undefined
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
        teamId,
        selectedTool: SUPPORTED_INTEGRATIONS.POSTGRES,
        connection: postgresConfig
      })
    });
  }
}
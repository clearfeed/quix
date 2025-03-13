import { Inject, Injectable, Logger } from '@nestjs/common';
import { SLACK_ACTIONS } from '@quix/lib/utils/slack-constants';
import { BlockElementAction, ButtonAction, StaticSelectAction } from '@slack/bolt';
import { AppHomeOpenedEvent } from '@slack/web-api';
import { WebClient } from '@slack/web-api';
import { getHomeView, getPostgresConnectionModal, publishPostgresConnectionModal } from './views/app_home';
import { INTEGRATIONS, SUPPORTED_INTEGRATIONS } from '@quix/lib/constants';
import { SlackService } from './slack.service';
import { SlackWorkspace } from '@quix/database/models';
@Injectable()
export class AppHomeService {
  private readonly logger = new Logger(AppHomeService.name);
  constructor(
    private readonly slackService: SlackService
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
      case SLACK_ACTIONS.SUBMIT_POSTGRES_CONNECTION:
        console.log('handleSubmitPostgresConnection', action);
        // this.handleSubmitPostgresConnection(action, teamId, userId);
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
    if (!selectedTool || !integration) return;
    const slackWorkspace = await this.slackService.getSlackWorkspace(teamId, [integration.relation]);
    if (!slackWorkspace) return;
    const webClient = new WebClient(slackWorkspace.bot_access_token);
    this.logger.log('Publishing home view', { selectedTool });
    await webClient.views.publish({
      user_id: userId,
      view: getHomeView({
        selectedTool,
        teamId,
        connection: slackWorkspace[integration.relation as keyof SlackWorkspace]
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
      await publishPostgresConnectionModal(webClient, {
        triggerId,
        teamId
      });
    }
  }
}

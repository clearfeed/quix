import { Inject, Injectable, Logger } from '@nestjs/common';
import { SLACK_ACTIONS } from '@quix/lib/utils/slack-constants';
import { BlockElementAction, ButtonAction, StaticSelectAction } from '@slack/bolt';
import { AppHomeOpenedEvent } from '@slack/web-api';
import { WebClient } from '@slack/web-api';
import { getHomeView } from './views/app_home';
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

  async handleAppHomeInteractions(action: BlockElementAction, teamId: string, userId: string) {
    if (action.action_id === SLACK_ACTIONS.CONNECT_TOOL && action.type === 'static_select') {
      this.handleConnectTool(action, teamId, userId);
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
}

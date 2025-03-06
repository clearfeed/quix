import { Injectable, Logger } from '@nestjs/common';
import { SLACK_ACTIONS } from '@quix/lib/utils/slack-constants';
import { PrismaService } from '@quix/prisma.service';
import { BlockElementAction, ButtonAction, StaticSelectAction } from '@slack/bolt';
import { AppHomeOpenedEvent } from '@slack/web-api';
import { WebClient } from '@slack/web-api';
import { getHomeView } from './views/app_home';

@Injectable()
export class AppHomeService {
  private readonly logger = new Logger(AppHomeService.name);
  constructor(
    private readonly prisma: PrismaService
  ) { }

  private async getSlackWorkspace(teamId: string) {
    const slackWorkspace = await this.prisma.slackWorkspace.findUnique({
      where: {
        team_id: teamId
      }
    });
    if (!slackWorkspace) {
      throw new Error('Slack workspace not found');
    }
    return slackWorkspace;
  }

  async handleAppHomeOpened(event: AppHomeOpenedEvent, teamId: string) {
    if (event.tab !== 'home') return;

    const slackWorkspace = await this.getSlackWorkspace(teamId);

    if (!slackWorkspace) {
      this.logger.error('Slack workspace not found', { teamId });
      return;
    }

    const webClient = new WebClient(slackWorkspace.bot_access_token);
    const result = await webClient.views.publish({
      user_id: event.user,
      view: getHomeView()
    });
  }

  async handleAppHomeInteractions(action: BlockElementAction, teamId: string, userId: string) {
    if (action.action_id === SLACK_ACTIONS.CONNECT_TOOL && action.type === 'static_select') {
      this.handleConnectTool(action, teamId, userId);
    }
  }

  async handleConnectTool(action: StaticSelectAction, teamId: string, userId: string) {
    const slackWorkspace = await this.getSlackWorkspace(teamId);
    const selectedTool = action.selected_option?.value;
    const webClient = new WebClient(slackWorkspace.bot_access_token);
    this.logger.log('Publishing home view', { selectedTool });
    await webClient.views.publish({
      user_id: userId,
      view: getHomeView({ selectedTool })
    });

  }

  async handleInstallTool(action: ButtonAction, teamId: string, userId: string) {
    const slackWorkspace = await this.getSlackWorkspace(teamId);
    this.logger.log('Installing tool', { action, teamId, userId });
  }
}

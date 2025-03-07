import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@quix/prisma/prisma.service';
import { BlockAction, BlockElementAction, BlockOverflowAction, MessageShortcut, SlackShortcut, ViewSubmitAction } from '@slack/bolt';
import { AppHomeService } from './app_home.service';
@Injectable()
export class InteractionsService {
  private readonly logger = new Logger(InteractionsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly appHomeService: AppHomeService
  ) { }

  async handleInteraction(
    payload: BlockAction | ViewSubmitAction | MessageShortcut | SlackShortcut
  ): Promise<unknown> {
    if (payload.type === 'block_actions') {
      return this.handleBlockAction(payload);
    } else if (payload.type === 'view_submission') {
      // return this.handleViewSubmission(payload);
    } else if (payload.type === 'message_action') {
      // return this.handleMessageAction(payload);
    } else if (payload.type === 'shortcut') {
      // return this.handleShortcut(payload);
    }
  }

  async handleBlockAction(eventAction: BlockAction | BlockOverflowAction) {
    const action: BlockElementAction = eventAction.actions[0];
    const teamId = eventAction.view?.app_installed_team_id ?? eventAction.team?.id;
    if (!teamId) {
      this.logger.error('Team ID not found', { event: eventAction });
      return;
    }
    if (eventAction.view?.type === 'home') {
      this.appHomeService.handleAppHomeInteractions(action, teamId, eventAction.user.id);
    }
  }
}

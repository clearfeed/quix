import { Injectable, Logger } from '@nestjs/common';
import { BlockAction, BlockElementAction, BlockOverflowAction, MessageShortcut, SlackShortcut, ViewSubmitAction } from '@slack/bolt';
import { AppHomeService } from './app_home.service';
import { SLACK_ACTIONS } from '@quix/lib/utils/slack-constants';
import { IntegrationsInstallService } from '../integrations/integrations-install.service';
import { parseInputBlocksSubmission } from '@quix/lib/utils/slack';
import { KnownBlock } from '@slack/web-api';
@Injectable()
export class InteractionsService {
  private readonly logger = new Logger(InteractionsService.name);
  constructor(
    private readonly appHomeService: AppHomeService,
    private readonly integrationsInstallService: IntegrationsInstallService
  ) { }

  async handleInteraction(
    payload: BlockAction | ViewSubmitAction | MessageShortcut | SlackShortcut
  ): Promise<unknown> {
    if (payload.type === 'block_actions') {
      return this.handleBlockAction(payload);
    } else if (payload.type === 'view_submission') {
      return this.handleViewSubmission(payload);
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
      this.appHomeService.handleAppHomeInteractions(action, teamId, eventAction.user.id, eventAction.trigger_id);
    }
  }

  async handleViewSubmission(payload: ViewSubmitAction) {
    switch (payload.view.callback_id) {
    case SLACK_ACTIONS.SUBMIT_POSTGRES_CONNECTION:
      const postgresConfig = await this.integrationsInstallService.postgres(payload);
      this.appHomeService.handlePostgresConnected(payload.user.id, payload.view.team_id, postgresConfig);
      break;
    case SLACK_ACTIONS.OPENAI_API_KEY_MODAL.SUBMIT:
      const openaiApiKey = payload.view.state.values.openai_api_key.openai_api_key_input.value;
      if (!openaiApiKey) {
        this.logger.error('OpenAI API key not found', { payload });
        return;
      }
      this.appHomeService.handleOpenaiApiKeySubmitted(payload.user.id, payload.view.team_id, openaiApiKey);
      break;
    case SLACK_ACTIONS.MANAGE_ADMINS:
      const adminUserIds = payload.view.state.values.admin_user_ids[SLACK_ACTIONS.MANAGE_ADMINS_INPUT].selected_conversations as string[];
      this.appHomeService.handleManageAdminsSubmitted(payload.user.id, payload.view.team_id, adminUserIds);
      break;
    case SLACK_ACTIONS.GITHUB_CONFIG_MODAL.SUBMIT:
      const defaultRepo = payload.view.state.values.repo[SLACK_ACTIONS.GITHUB_CONFIG_MODAL.REPO_INPUT].value as string;
      const defaultOwner = payload.view.state.values.owner[SLACK_ACTIONS.GITHUB_CONFIG_MODAL.OWNER_INPUT].value as string;
      const default_config = {
        repo: defaultRepo,
        owner: defaultOwner
      }
      this.appHomeService.handleGithubConfigurationSubmitted(payload.user.id, payload.view.team_id, default_config);
      break;
    default:
      return;
    }
  }
}

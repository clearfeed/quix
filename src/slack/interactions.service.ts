import { Injectable, Logger } from '@nestjs/common';
import { BlockAction, BlockElementAction, BlockOverflowAction, MessageShortcut, SlackShortcut, ViewSubmitAction } from '@slack/bolt';
import { AppHomeService } from './app_home.service';
import { SLACK_ACTIONS } from '@quix/lib/utils/slack-constants';
import { IntegrationsInstallService } from '../integrations/integrations-install.service';
import { QuixUserAccessLevel } from '@quix/lib/constants';
import { displayErrorModal, displayLoadingModal, displaySuccessModal, publishNotionConnectionModal } from './views/modals';
import { WebClient } from '@slack/web-api';
import { SlackService } from './slack.service';
@Injectable()
export class InteractionsService {
  private readonly logger = new Logger(InteractionsService.name);
  constructor(
    private readonly appHomeService: AppHomeService,
    private readonly integrationsInstallService: IntegrationsInstallService,
    private readonly slackService: SlackService
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
    const slackWorkspace = await this.slackService.getSlackWorkspace(payload.view.team_id);
    if (!slackWorkspace) {
      this.logger.error('Slack workspace not found', { payload });
      return;
    }
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
      case SLACK_ACTIONS.JIRA_CONFIG_MODAL.SUBMIT:
        const defaultProjectKey = payload.view.state.values.project_key[SLACK_ACTIONS.JIRA_CONFIG_MODAL.PROJECT_KEY_INPUT].value as string;
        this.appHomeService.handleJiraConfigurationSubmitted(payload.user.id, payload.view.team_id, defaultProjectKey);
        break;
      case SLACK_ACTIONS.MANAGE_ACCESS_CONTROLS:
        const allowedChannels = payload.view.state.values.allowed_channel_ids[SLACK_ACTIONS.ALLOWED_CHANNELS_SELECT].selected_conversations as string[];
        const accessLevel = payload.view.state.values.access_level[SLACK_ACTIONS.ACCESS_LEVEL_SELECT].selected_option?.value as QuixUserAccessLevel;
        this.appHomeService.handleManageAccessControlsSubmitted(payload.user.id, payload.view.team_id, allowedChannels, accessLevel);
        break;
      case SLACK_ACTIONS.SUBMIT_NOTION_CONNECTION:
        try {
          this.integrationsInstallService.notion(payload).then(async () => {
            await displaySuccessModal(new WebClient(slackWorkspace.bot_access_token), {
              text: 'Notion connected successfully',
              viewId: payload.view.id,
            });
            this.appHomeService.handleNotionConnected(payload.user.id, payload.view.team_id);
          }).catch(error => {
            return displayErrorModal({
              error,
              backgroundCaller: true,
              viewId: payload.view.id,
              web: new WebClient(slackWorkspace.bot_access_token)
            });
          });
          return displayLoadingModal('Please Wait');
        } catch (error) {
          console.error(error);
          return displayErrorModal({
            error,
            backgroundCaller: true,
            viewId: payload.view.id,
            web: new WebClient(slackWorkspace.bot_access_token)
          });
        }
      default:
        return;
    }
  }
}

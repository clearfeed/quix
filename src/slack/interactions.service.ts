import { Injectable, Logger } from '@nestjs/common';
import {
  BlockAction,
  BlockElementAction,
  BlockOverflowAction,
  MessageShortcut,
  SlackShortcut,
  ViewSubmitAction
} from '@slack/bolt';
import { AppHomeService } from './app_home.service';
import { SLACK_ACTIONS } from '@quix/lib/utils/slack-constants';
import { IntegrationsInstallService } from '../integrations/integrations-install.service';
import { QuixUserAccessLevel } from '@quix/lib/constants';
import {
  displayErrorModal,
  displayLoadingModal,
  displaySuccessModal,
  publishNotionConnectionModal
} from './views/modals';
import { WebClient } from '@slack/web-api';
import { SlackService } from './slack.service';
@Injectable()
export class InteractionsService {
  private readonly logger = new Logger(InteractionsService.name);
  constructor(
    private readonly appHomeService: AppHomeService,
    private readonly integrationsInstallService: IntegrationsInstallService,
    private readonly slackService: SlackService
  ) {}

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
      this.appHomeService.handleAppHomeInteractions(
        action,
        teamId,
        eventAction.user.id,
        eventAction.trigger_id
      );
    }
  }

  async handleViewSubmission(payload: ViewSubmitAction) {
    const slackWorkspace = await this.slackService.getSlackWorkspace(payload.view.team_id);
    if (!slackWorkspace) return;

    switch (payload.view.callback_id) {
      case SLACK_ACTIONS.SUBMIT_POSTGRES_CONNECTION:
        const postgresConfig = await this.integrationsInstallService.postgres(payload);
        this.appHomeService.handlePostgresConnected(
          payload.user.id,
          payload.view.team_id,
          postgresConfig
        );
        break;
      case SLACK_ACTIONS.OPENAI_API_KEY_MODAL.SUBMIT:
        const openaiApiKey = payload.view.state.values.openai_api_key.openai_api_key_input.value;
        if (!openaiApiKey) {
          this.logger.error('OpenAI API key not found', { payload });
          return;
        }
        this.appHomeService.handleOpenaiApiKeySubmitted(
          payload.user.id,
          payload.view.team_id,
          openaiApiKey
        );
        break;
      case SLACK_ACTIONS.MANAGE_ADMINS:
        const adminUserIds = payload.view.state.values.admin_user_ids[
          SLACK_ACTIONS.MANAGE_ADMINS_INPUT
        ].selected_conversations as string[];
        this.appHomeService.handleManageAdminsSubmitted(
          payload.user.id,
          payload.view.team_id,
          adminUserIds
        );
        break;
      case SLACK_ACTIONS.JIRA_CONFIG_MODAL.SUBMIT:
        const defaultProjectKey = payload.view.state.values.project_key[
          SLACK_ACTIONS.JIRA_CONFIG_MODAL.PROJECT_KEY_INPUT
        ].value as string;
        this.appHomeService.handleJiraConfigurationSubmitted(
          payload.user.id,
          payload.view.team_id,
          defaultProjectKey
        );
        break;
      case SLACK_ACTIONS.GITHUB_CONFIG_MODAL.SUBMIT:
        const defaultRepo = payload.view.state.values.repo[
          SLACK_ACTIONS.GITHUB_CONFIG_MODAL.REPO_INPUT
        ].value as string;
        const defaultOwner = payload.view.state.values.owner[
          SLACK_ACTIONS.GITHUB_CONFIG_MODAL.OWNER_INPUT
        ].value as string;
        const default_config = {
          repo: defaultRepo,
          owner: defaultOwner
        };
        this.appHomeService.handleGithubConfigurationSubmitted(
          payload.user.id,
          payload.view.team_id,
          default_config
        );
        break;
      case SLACK_ACTIONS.MANAGE_ACCESS_CONTROLS:
        const allowedChannels = payload.view.state.values.allowed_channel_ids[
          SLACK_ACTIONS.ALLOWED_CHANNELS_SELECT
        ].selected_conversations as string[];
        const accessLevel = payload.view.state.values.access_level[
          SLACK_ACTIONS.ACCESS_LEVEL_SELECT
        ].selected_option?.value as QuixUserAccessLevel;
        this.appHomeService.handleManageAccessControlsSubmitted(
          payload.user.id,
          payload.view.team_id,
          allowedChannels,
          accessLevel
        );
        break;
      case SLACK_ACTIONS.SUBMIT_NOTION_CONNECTION:
        try {
          this.integrationsInstallService
            .notion(payload)
            .then(async () => {
              await displaySuccessModal(new WebClient(slackWorkspace.bot_access_token), {
                text: 'Notion connected successfully',
                viewId: payload.view.id
              });
              this.appHomeService.handleIntegrationConnected(
                payload.user.id,
                payload.view.team_id,
                'notionConfig'
              );
            })
            .catch((error) => {
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
      case SLACK_ACTIONS.SUBMIT_LINEAR_CONNECTION:
        try {
          this.integrationsInstallService
            .linear(payload)
            .then(async () => {
              await displaySuccessModal(new WebClient(slackWorkspace.bot_access_token), {
                text: 'Linear connected successfully',
                viewId: payload.view.id
              });
              this.appHomeService.handleIntegrationConnected(
                payload.user.id,
                payload.view.team_id,
                'linearConfig'
              );
            })
            .catch((error) => {
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
      case SLACK_ACTIONS.SALESFORCE_CONFIG_MODAL.SUBMIT:
        try {
          const defaultPrompt = payload.view.state.values.salesforce_default_prompt[
            SLACK_ACTIONS.SALESFORCE_CONFIG_MODAL.DEFAULT_PROMPT
          ].value as string;
          const salesforceConfig = await slackWorkspace.$get('salesforceConfig');
          if (!salesforceConfig) return;
          await salesforceConfig.update({
            default_prompt: defaultPrompt
          });
          this.appHomeService.handleIntegrationConnected(
            payload.user.id,
            payload.view.team_id,
            'salesforceConfig'
          );
        } catch (error) {
          console.error(error);
          return displayErrorModal({
            error,
            backgroundCaller: false
          });
        }
        break;
      case SLACK_ACTIONS.SUBMIT_MCP_CONNECTION:
        try {
          this.integrationsInstallService
            .mcp(payload)
            .then(async () => {
              await displaySuccessModal(new WebClient(slackWorkspace.bot_access_token), {
                text: 'MCP server connected successfully',
                viewId: payload.view.id
              });
              this.appHomeService.handleIntegrationConnected(
                payload.user.id,
                payload.view.team_id,
                'mcpConnections'
              );
            })
            .catch((error) => {
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
      case SLACK_ACTIONS.SUBMIT_OKTA_CONNECTION:
        try {
          this.integrationsInstallService
            .okta(payload)
            .then(async () => {
              await displaySuccessModal(new WebClient(slackWorkspace.bot_access_token), {
                text: 'Okta connected successfully',
                viewId: payload.view.id
              });
              this.appHomeService.handleIntegrationConnected(
                payload.user.id,
                payload.view.team_id,
                'oktaConfig'
              );
            })
            .catch((error) => {
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

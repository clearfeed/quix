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
import { QuixUserAccessLevel, SUPPORTED_INTEGRATIONS } from '@quix/lib/constants';
import { displayErrorModal, displayLoadingModal, displaySuccessModal } from './views/modals';
import { WebClient } from '@slack/web-api';
import { SlackService } from './slack.service';
import { getMCPConnectionDropDownValue } from './views/app_home';
import { OktaConfig } from '@quix/database/models';
import { IntegrationsService } from '@quix/integrations/integrations.service';
import { ConnectionInfo } from './views/types';
@Injectable()
export class InteractionsService {
  private readonly logger = new Logger(InteractionsService.name);
  constructor(
    private readonly appHomeService: AppHomeService,
    private readonly integrationsInstallService: IntegrationsInstallService,
    private readonly integrationsService: IntegrationsService,
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
      case SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.SUBMIT:
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
          this.logger.warn('OpenAI API key not found', { payload });
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
        const defaultJiraPrompt = payload.view.state.values.jira_default_prompt[
          SLACK_ACTIONS.JIRA_CONFIG_MODAL.DEFAULT_PROMPT
        ].value as string;
        this.appHomeService.handleJiraConfigurationSubmitted(
          payload.user.id,
          payload.view.team_id,
          defaultProjectKey,
          defaultJiraPrompt
        );
        break;
      case SLACK_ACTIONS.GITHUB_CONFIG_MODAL.SUBMIT:
        const defaultRepo = payload.view.state.values.repo[
          SLACK_ACTIONS.GITHUB_CONFIG_MODAL.REPO_INPUT
        ].value as string;
        const defaultOwner = payload.view.state.values.owner[
          SLACK_ACTIONS.GITHUB_CONFIG_MODAL.OWNER_INPUT
        ].value as string;
        const defaultGithubPrompt = payload.view.state.values.github_default_prompt[
          SLACK_ACTIONS.GITHUB_CONFIG_MODAL.DEFAULT_PROMPT
        ].value as string;
        const default_config = {
          repo: defaultRepo,
          owner: defaultOwner
        };
        this.appHomeService.handleGithubConfigurationSubmitted(
          payload.user.id,
          payload.view.team_id,
          default_config,
          defaultGithubPrompt
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
      case SLACK_ACTIONS.NOTION_CONNECTION_ACTIONS.SUBMIT:
        try {
          this.integrationsInstallService
            .notion(payload)
            .then(async (notionConfig) => {
              await displaySuccessModal(new WebClient(slackWorkspace.bot_access_token), {
                text: 'Notion connected successfully',
                viewId: payload.view.id
              });
              this.appHomeService.handleIntegrationConnected(
                payload.user.id,
                payload.view.team_id,
                SUPPORTED_INTEGRATIONS.NOTION,
                notionConfig
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
      case SLACK_ACTIONS.ZENDESK_CONNECTION_ACTIONS.SUBMIT:
        try {
          this.integrationsInstallService
            .zendesk(payload)
            .then(async (zendeskConfig) => {
              await displaySuccessModal(new WebClient(slackWorkspace.bot_access_token), {
                text: 'Zendesk connected successfully',
                viewId: payload.view.id
              });
              this.appHomeService.handleIntegrationConnected(
                payload.user.id,
                payload.view.team_id,
                SUPPORTED_INTEGRATIONS.ZENDESK,
                zendeskConfig
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
      case SLACK_ACTIONS.LINEAR_CONNECTION_ACTIONS.SUBMIT:
        try {
          this.integrationsInstallService
            .linear(payload)
            .then(async (linearConfig) => {
              await displaySuccessModal(new WebClient(slackWorkspace.bot_access_token), {
                text: 'Linear connected successfully',
                viewId: payload.view.id
              });
              this.appHomeService.handleIntegrationConnected(
                payload.user.id,
                payload.view.team_id,
                SUPPORTED_INTEGRATIONS.LINEAR,
                linearConfig
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
            SUPPORTED_INTEGRATIONS.SALESFORCE,
            salesforceConfig
          );
        } catch (error) {
          console.error(error);
          return displayErrorModal({
            error,
            backgroundCaller: false
          });
        }
        break;
      case SLACK_ACTIONS.MCP_CONNECTION_ACTIONS.SUBMIT:
        try {
          this.integrationsInstallService
            .mcp(payload)
            .then(async (mcpConnection) => {
              await displaySuccessModal(new WebClient(slackWorkspace.bot_access_token), {
                text: 'MCP server connected successfully',
                viewId: payload.view.id
              });
              this.appHomeService.handleIntegrationConnected(
                payload.user.id,
                payload.view.team_id,
                getMCPConnectionDropDownValue(mcpConnection),
                mcpConnection
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
      case SLACK_ACTIONS.HUBSPOT_CONFIG_MODAL.SUBMIT:
        try {
          const defaultPrompt = payload.view.state.values.hubspot_default_prompt[
            SLACK_ACTIONS.HUBSPOT_CONFIG_MODAL.DEFAULT_PROMPT
          ].value as string;
          const hubspotConfig = await slackWorkspace.$get('hubspotConfig');
          if (!hubspotConfig) return;
          await hubspotConfig.update({
            default_prompt: defaultPrompt
          });
          this.appHomeService.handleIntegrationConnected(
            payload.user.id,
            payload.view.team_id,
            SUPPORTED_INTEGRATIONS.HUBSPOT,
            hubspotConfig
          );
        } catch (error) {
          console.error(error);
          return displayErrorModal({
            error,
            backgroundCaller: false
          });
        }
        break;
      case SLACK_ACTIONS.SUBMIT_OKTA_CONNECTION:
        try {
          this.integrationsInstallService
            .okta(payload)
            .then(async (oktaConfig: OktaConfig) => {
              await displaySuccessModal(new WebClient(slackWorkspace.bot_access_token), {
                text: 'Okta connected successfully',
                viewId: payload.view.id
              });
              this.appHomeService.handleIntegrationConnected(
                payload.user.id,
                payload.view.team_id,
                SUPPORTED_INTEGRATIONS.OKTA,
                oktaConfig
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
      case SLACK_ACTIONS.DISCONNECT_CONFIRM_MODAL.SUBMIT: {
        const connectionInfo: ConnectionInfo = JSON.parse(payload.view.private_metadata);

        switch (connectionInfo.type) {
          case SUPPORTED_INTEGRATIONS.POSTGRES:
            await this.integrationsService.removePostgresConfig(payload.view.team_id);
            break;
          case SUPPORTED_INTEGRATIONS.HUBSPOT:
            await this.integrationsService.removeHubspotConfig(payload.view.team_id);
            break;
          case SUPPORTED_INTEGRATIONS.JIRA:
            await this.integrationsService.removeJiraConfig(payload.view.team_id);
            break;
          case SUPPORTED_INTEGRATIONS.SALESFORCE:
            await this.integrationsService.removeSalesforceConfig(payload.view.team_id);
            break;
          case SUPPORTED_INTEGRATIONS.GITHUB:
            await this.integrationsService.removeGithubConfig(payload.view.team_id);
            break;
          case SUPPORTED_INTEGRATIONS.NOTION:
            await this.integrationsService.removeNotionConfig(payload.view.team_id);
            break;
          case SUPPORTED_INTEGRATIONS.LINEAR:
            await this.integrationsService.removeLinearConfig(payload.view.team_id);
            break;
          case SUPPORTED_INTEGRATIONS.OKTA:
            await this.integrationsService.removeOktaConfig(payload.view.team_id);
            break;
          case SUPPORTED_INTEGRATIONS.ZENDESK:
            await this.integrationsService.removeZendeskConfig(payload.view.team_id);
            break;
          case 'mcp':
            await this.integrationsService.removeMcpConnection(
              payload.view.team_id,
              connectionInfo.id
            );
            break;
        }

        await this.appHomeService.handleIntegrationConnected(
          payload.user.id,
          payload.view.team_id,
          undefined,
          undefined
        );

        return;
      }
      default:
        return;
    }
  }
}

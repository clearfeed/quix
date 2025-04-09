import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebClient } from '@slack/web-api';
import { InjectModel } from '@nestjs/sequelize';
import { SlackWorkspace, SlackUserProfile } from '../database/models';
import { INTEGRATIONS } from '@quix/lib/constants';
import { OnEvent } from '@nestjs/event-emitter';
import { IntegrationConnectedEvent } from '@quix/types/events';
import { sendMessage } from '@quix/lib/utils/slack';
import { ParseSlackMentionsUserMap } from '@quix/lib/types/slack';
import { Cron, CronExpression } from '@nestjs/schedule';
import { shuffle } from 'lodash';
import { SLACK_WORKSPACE_ALL_RELATIONS } from './views/types';
import { Includeable } from 'sequelize';

@Injectable()
export class SlackService {
  private readonly webClient: WebClient;
  private readonly logger = new Logger(SlackService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(SlackWorkspace)
    private readonly slackWorkspaceModel: typeof SlackWorkspace,
    @InjectModel(SlackUserProfile)
    private readonly slackUserProfileModel: typeof SlackUserProfile
  ) {
    this.webClient = new WebClient(this.configService.get('SLACK_BOT_TOKEN'));
  }

  async getSlackWorkspace(teamId: string, include?: Includeable[]) {
    const relationsToInclude: Includeable[] = include?.length
      ? include
      : SLACK_WORKSPACE_ALL_RELATIONS;
    const slackWorkspace = await this.slackWorkspaceModel.findByPk(teamId, {
      include: relationsToInclude
    });
    if (!slackWorkspace) {
      this.logger.error('Slack workspace not found', { teamId });
      return;
    }
    return slackWorkspace;
  }

  @OnEvent('connected.*')
  async handleIntegrationConnected(event: IntegrationConnectedEvent) {
    try {
      const slackWorkspace = await this.getSlackWorkspace(event.teamId);
      if (!slackWorkspace) {
        this.logger.warn('Slack workspace not found', { teamId: event.teamId });
        return;
      }
      this.logger.log(
        `Sending integration connection notification to ${slackWorkspace.authed_user_id}`,
        { event }
      );
      const text = INTEGRATIONS.find(
        (integration) => integration.value === event.type
      )?.connectedText;
      if (!text) {
        this.logger.warn('No connected text found for integration', { event });
        return;
      }
      await sendMessage(slackWorkspace, slackWorkspace.authed_user_id, text);
    } catch (error) {
      this.logger.error('Failed to send integration connection notification', error);
    }
  }

  async install(
    code: string,
    tool?: (typeof INTEGRATIONS)[number]['value']
  ): Promise<{
    team_id: string;
    app_id: string;
  } | void> {
    const response = await this.webClient.oauth.v2.access({
      client_id: this.configService.get<string>('SLACK_CLIENT_ID') || '',
      client_secret: this.configService.get<string>('SLACK_CLIENT_SECRET') || '',
      redirect_uri: tool
        ? `${this.configService.get<string>('SELFSERVER_URL')}/slack/install/${tool}`
        : this.configService.get<string>('SELFSERVER_URL') + '/slack/install',
      code
    });
    if (response.ok && response.team?.id) {
      const [slackWorkspace] = await this.slackWorkspaceModel.upsert({
        team_id: response.team?.id,
        name: response.team?.name || '',
        bot_access_token: response.access_token || '',
        authed_user_id: response.authed_user?.id || '',
        bot_user_id: response.bot_user_id || '',
        is_enterprise_install: response.is_enterprise_install || false,
        scopes: response.response_metadata?.scopes || [],
        app_id: response.app_id || '',
        admin_user_ids: response.authed_user?.id ? [response.authed_user?.id] : []
      });

      // Store all Slack users after workspace is connected
      this.storeSlackUsers(slackWorkspace);
    }
    this.logger.log(`Connected to Slack workspace`, {
      team_id: response.team?.id,
      app_id: response.app_id
    });
    return {
      team_id: response.team?.id || '',
      app_id: response.app_id || ''
    };
  }

  /**
   * Fetches and stores all users from a Slack workspace
   * @param teamId The Slack workspace team ID
   * @param accessToken The bot access token for the workspace
   */
  private async storeSlackUsers(slackWorkspace: SlackWorkspace): Promise<void> {
    try {
      if (!slackWorkspace.bot_access_token) {
        this.logger.error('No access token provided for storing Slack users', {
          teamId: slackWorkspace.team_id
        });
        return;
      }

      const client = new WebClient(slackWorkspace.bot_access_token);
      let cursor: string | undefined;

      do {
        // Fetch users with pagination
        const usersResponse = await client.users.list({
          cursor,
          limit: 100 // Process in batches of 100
        });

        if (!usersResponse.ok || !usersResponse.members) {
          this.logger.error('Failed to fetch Slack users', { teamId: slackWorkspace.team_id });
          break;
        }

        // Process each user
        for (const member of usersResponse.members) {
          // Skip bots, deleted users, and users without profiles
          if (member.deleted || !member.profile) {
            continue;
          }

          const displayName = member.profile.display_name || member.real_name || member.name || '';
          const avatarUrl = member.profile.image_192 || member.profile.image_72 || '';

          await this.slackUserProfileModel.upsert(
            {
              team_id: slackWorkspace.team_id,
              user_id: member.id as string,
              display_name: displayName,
              email: member.profile.email || null,
              avatar_url: avatarUrl
            },
            {
              conflictFields: ['team_id', 'user_id']
            }
          );
        }

        // Update cursor for next page
        cursor = usersResponse.response_metadata?.next_cursor;
      } while (cursor && cursor.length > 0);

      this.logger.log('Successfully stored Slack users', { teamId: slackWorkspace.team_id });
    } catch (error) {
      this.logger.error('Error storing Slack users', { error, teamId: slackWorkspace.team_id });
    }
  }

  async getUserInfoMap(slackWorkspace: SlackWorkspace): Promise<ParseSlackMentionsUserMap> {
    const slackUserProfiles = await this.slackUserProfileModel.findAll({
      where: {
        team_id: slackWorkspace.team_id
      }
    });
    return slackUserProfiles.reduce((acc: ParseSlackMentionsUserMap, profile: SlackUserProfile) => {
      acc[profile.user_id] = {
        name: profile.display_name,
        email: profile.email || null,
        avatar: profile.avatar_url || null
      };
      return acc;
    }, {});
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async refreshAllWorkspaceUsers() {
    try {
      this.logger.log('Starting daily refresh of all Slack workspace users');

      // Get all workspaces and shuffle them using lodash
      const workspaces = shuffle(await this.slackWorkspaceModel.findAll());

      // Loop through each workspace
      for (const workspace of workspaces) {
        try {
          // Store all users of a particular workspace
          await this.storeSlackUsers(workspace);
          this.logger.log(`Successfully refreshed users for workspace ${workspace.team_id}`);

          // 500ms delay before the next API call
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          this.logger.error(`Failed to refresh users for workspace ${workspace.team_id}`, error);
          // Continue with the next workspace even if one fails
          continue;
        }
      }

      this.logger.log('Completed daily refresh of all Slack workspace users');
    } catch (error) {
      this.logger.error('Failed to refresh workspace users', error);
    }
  }
}

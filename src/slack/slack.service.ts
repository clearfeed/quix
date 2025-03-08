import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebClient } from '@slack/web-api';
import { PrismaService } from '../prisma/prisma.service';
import { INTEGRATIONS } from '@quix/lib/constants';
import { OnEvent } from '@nestjs/event-emitter';
import { IntegrationConnectedEvent } from '@quix/types/events';

@Injectable()
export class SlackService {
  private readonly webClient: WebClient;
  private readonly logger = new Logger(SlackService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.webClient = new WebClient(this.configService.get('SLACK_BOT_TOKEN'));
  }

  async getSlackWorkspace(teamId: string) {
    const slackWorkspace = await this.prisma.slackWorkspace.findUnique({
      where: {
        team_id: teamId
      }
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
      this.logger.log('Sending integration connection notification', { event });
      const slackWorkspace = await this.getSlackWorkspace(event.teamId);
      if (!slackWorkspace) {
        this.logger.warn('Slack workspace not found', { teamId: event.teamId });
        return;
      }
      const text = INTEGRATIONS.find(integration => integration.value === event.type)?.connectedText;
      if (!text) {
        this.logger.warn('No connected text found for integration', { event });
        return;
      }
      await this.webClient.chat.postMessage({
        channel: slackWorkspace.authed_user_id,
        text
      });
    } catch (error) {
      this.logger.error('Failed to send integration connection notification', error);
    }
  }

  async install(code: string, tool?: typeof INTEGRATIONS[number]['value']): Promise<{
    team_id: string;
    app_id: string;
  } | void> {
    const response = await this.webClient.oauth.v2.access({
      client_id: this.configService.get<string>('SLACK_CLIENT_ID') || '',
      client_secret: this.configService.get<string>('SLACK_CLIENT_SECRET') || '',
      redirect_uri: tool ? `${this.configService.get<string>('SELFSERVER_URL')}/slack/install/${tool}` : this.configService.get<string>('SELFSERVER_URL') + '/slack/install',
      code
    });
    if (response.ok && response.team?.id) {
      await this.prisma.slackWorkspace.upsert({
        where: {
          team_id: response.team?.id
        },
        update: {
          name: response.team?.name || '',
          bot_access_token: response.access_token,
          authed_user_id: response.authed_user?.id,
          bot_user_id: response.bot_user_id,
          is_enterprise_install: response.is_enterprise_install,
          scopes: response.response_metadata?.scopes,
          app_id: response.app_id || ''
        },
        create: {
          name: response.team?.name || '',
          team_id: response.team?.id,
          bot_access_token: response.access_token || '',
          authed_user_id: response.authed_user?.id || '',
          bot_user_id: response.bot_user_id || '',
          is_enterprise_install: response.is_enterprise_install || false,
          scopes: response.response_metadata?.scopes,
          app_id: response.app_id || ''
        }
      });
    }
    this.logger.log(`Connected to Slack workspace`, { team_id: response.team?.id, app_id: response.app_id });
    return {
      team_id: response.team?.id || '',
      app_id: response.app_id || ''
    };
  }
}

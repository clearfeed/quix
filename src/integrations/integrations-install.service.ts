import { INTEGRATIONS, SUPPORTED_INTEGRATIONS, HUBSPOT_SCOPES } from '@quix/lib/constants';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JiraConfig, HubspotConfig, PostgresConfig } from '../database/models';
import { ToolInstallState } from '@quix/lib/types/common';
import { EVENT_NAMES, IntegrationConnectedEvent } from '@quix/types/events';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HubspotTokenResponse, HubspotHubInfo } from './types';
import { ViewSubmitAction } from '@slack/bolt';
import { parseInputBlocksSubmission } from '@quix/lib/utils/slack';
import { KnownBlock } from '@slack/web-api';
import { SLACK_ACTIONS } from '@quix/lib/utils/slack-constants';

@Injectable()
export class IntegrationsInstallService {
  private readonly logger = new Logger(IntegrationsInstallService.name);

  constructor(
    private readonly configService: ConfigService,
    private httpService: HttpService,
    @Inject(CACHE_MANAGER) private cache: Cache,
    @InjectModel(JiraConfig)
    private readonly jiraConfigModel: typeof JiraConfig,
    @InjectModel(HubspotConfig)
    private readonly hubspotConfigModel: typeof HubspotConfig,
    private readonly eventEmitter: EventEmitter2,
    @InjectModel(PostgresConfig)
    private readonly postgresConfigModel: typeof PostgresConfig
  ) {
    this.httpService.axiosRef.defaults.headers.common['Content-Type'] = 'application/json';
  }

  getInstallUrl(tool: typeof INTEGRATIONS[number]['value'], state: string): string {
    switch (tool) {
      case 'jira':
        return `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${this.configService.get<string>('JIRA_CLIENT_ID')}&scope=${encodeURIComponent('read:jira-work read:jira-user write:jira-work offline_access')}&redirect_uri=${this.configService.get<string>('SELFSERVER_URL')}/integrations/connect/jira&response_type=code&prompt=consent&state=${state}`;
      case 'hubspot':
        return `https://app.hubspot.com/oauth/authorize?client_id=${this.configService.get<string>('HUBSPOT_CLIENT_ID')}&redirect_uri=${encodeURIComponent(this.configService.get<string>('SELFSERVER_URL') + '/integrations/connect/hubspot')}&scope=${encodeURIComponent(HUBSPOT_SCOPES.join(' '))}&state=${state}`;
      default:
        throw new BadRequestException('Integration not found');
    }
  }

  async jira(code: string, state: string): Promise<Partial<ToolInstallState>> {
    try {
      const stateData = await this.cache.get<ToolInstallState>(`install_jira`);
      if (!stateData) {
        throw new BadRequestException('State not found');
      }
      if (stateData.state !== state) {
        throw new BadRequestException('Invalid state');
      }
      await this.cache.del(`install_jira`);
      const response = await this.httpService.axiosRef.post(`https://auth.atlassian.com/oauth/token`, {
        grant_type: 'authorization_code',
        code,
        client_id: this.configService.get<string>('JIRA_CLIENT_ID'),
        client_secret: this.configService.get<string>('JIRA_CLIENT_SECRET'),
        redirect_uri: `${this.configService.get<string>('SELFSERVER_URL')}/integrations/connect/jira`,
      });
      const accessibleResources = await this.httpService.axiosRef.get(`https://api.atlassian.com/oauth/token/accessible-resources`, {
        headers: {
          Authorization: `Bearer ${response.data.access_token}`
        }
      });
      const jiraSite = accessibleResources.data[0];

      await this.jiraConfigModel.upsert({
        id: jiraSite.id,
        name: jiraSite.name,
        url: jiraSite.url,
        scopes: jiraSite.scopes,
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_at: new Date(Date.now() + (response.data.expires_in * 1000)),
        team_id: stateData.teamId,
      });

      this.eventEmitter.emit(EVENT_NAMES.JIRA_CONNECTED, {
        teamId: stateData.teamId,
        appId: stateData.appId,
        type: SUPPORTED_INTEGRATIONS.JIRA,
      } satisfies IntegrationConnectedEvent);

      return {
        appId: stateData.appId,
        teamId: stateData.teamId,
      }
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Failed to connect to Jira');
    }
  }

  async hubspot(code: string, state: string): Promise<Partial<ToolInstallState>> {
    try {
      const stateData = await this.cache.get<ToolInstallState>('install_hubspot');
      if (!stateData) {
        throw new BadRequestException('State not found');
      }
      if (stateData.state !== state) {
        throw new BadRequestException('Invalid state');
      }
      await this.cache.del('install_hubspot');

      const clientId = this.configService.get<string>('HUBSPOT_CLIENT_ID');
      const clientSecret = this.configService.get<string>('HUBSPOT_CLIENT_SECRET');
      const redirectUri = `${this.configService.get<string>('SELFSERVER_URL')}/integrations/connect/hubspot`;

      if (!clientId || !clientSecret) {
        throw new BadRequestException('Missing HubSpot client configuration');
      }

      const params = new URLSearchParams();
      params.append('grant_type', 'authorization_code');
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);
      params.append('redirect_uri', redirectUri);
      params.append('code', code);

      const response = await this.httpService.axiosRef.post<HubspotTokenResponse>(
        'https://api.hubapi.com/oauth/v1/token',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      // Fetch hub information using the access token
      const hubInfoResponse = await this.httpService.axiosRef.get<HubspotHubInfo>(
        'https://api.hubapi.com/oauth/v1/access-tokens/' + response.data.access_token
      );
      const hubInfo = hubInfoResponse.data;

      await this.hubspotConfigModel.upsert({
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_at: new Date(Date.now() + (response.data.expires_in * 1000)),
        hub_domain: hubInfo.hub_domain,
        hub_id: hubInfo.hub_id,
        scopes: hubInfo.scopes,
        team_id: stateData.teamId
      });

      this.eventEmitter.emit(EVENT_NAMES.HUBSPOT_CONNECTED, {
        teamId: stateData.teamId,
        appId: stateData.appId,
        type: SUPPORTED_INTEGRATIONS.HUBSPOT,
      } satisfies IntegrationConnectedEvent);

      return {
        appId: stateData.appId,
        teamId: stateData.teamId
      };
    } catch (error) {
      this.logger.error('Failed to connect to HubSpot:', error);
      throw new BadRequestException('Failed to connect to HubSpot');
    }
  }

  async postgres(payload: ViewSubmitAction): Promise<PostgresConfig> {
    const parsedResponse = parseInputBlocksSubmission(
      payload.view.blocks as KnownBlock[],
      payload.view.state.values
    );
    const id = JSON.parse(payload.view.private_metadata).id;
    if (![
      SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.HOST,
      SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.PORT,
      SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.USER,
      SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.PASSWORD,
      SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.DATABASE].every(field => parsedResponse[field].selectedValue)) {
      throw new BadRequestException('Invalid response');
    }
    const sslResponse = parsedResponse[SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.SSL].selectedValue;
    const [postgresConfig] = await this.postgresConfigModel.upsert({
      id,
      host: parsedResponse[SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.HOST].selectedValue as string,
      port: parseInt(parsedResponse[SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.PORT].selectedValue as string),
      user: parsedResponse[SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.USER].selectedValue as string,
      password: parsedResponse[SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.PASSWORD].selectedValue as string,
      database: parsedResponse[SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.DATABASE].selectedValue as string,
      team_id: payload.view.team_id,
      ssl: sslResponse ? Boolean(sslResponse.length > 0) : false,
    });
    this.eventEmitter.emit(EVENT_NAMES.POSTGRES_CONNECTED, {
      teamId: payload.view.team_id,
      appId: payload.view.app_id!,
      type: SUPPORTED_INTEGRATIONS.POSTGRES,
      userId: payload.user.id,
    } satisfies IntegrationConnectedEvent);
    return postgresConfig;
  }
}

import { INTEGRATIONS, SUPPORTED_INTEGRATIONS, HUBSPOT_SCOPES, GITHUB_SCOPES } from '@quix/lib/constants';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JiraConfig, HubspotConfig, GithubConfig } from '../database/models';
import { ToolInstallState } from '@quix/lib/types/common';
import { EVENT_NAMES, IntegrationConnectedEvent } from '@quix/types/events';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HubspotTokenResponse, HubspotHubInfo, GithubTokenResponse, GitHubInfo } from './types';

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
    @InjectModel(GithubConfig)
    private readonly githubConfigModel: typeof GithubConfig,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.httpService.axiosRef.defaults.headers.common['Content-Type'] = 'application/json';
  }

  getInstallUrl(tool: typeof INTEGRATIONS[number]['value'], state: string): string {
    switch (tool) {
    case 'jira':
      return `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${this.configService.get<string>('JIRA_CLIENT_ID')}&scope=${encodeURIComponent('read:jira-work read:jira-user write:jira-work offline_access')}&redirect_uri=${this.configService.get<string>('SELFSERVER_URL')}/integrations/connect/jira&response_type=code&prompt=consent&state=${state}`;
    case 'hubspot':
      return `https://app.hubspot.com/oauth/authorize?client_id=${this.configService.get<string>('HUBSPOT_CLIENT_ID')}&redirect_uri=${encodeURIComponent(this.configService.get<string>('SELFSERVER_URL') + '/integrations/connect/hubspot')}&scope=${encodeURIComponent(HUBSPOT_SCOPES.join(' '))}&state=${state}`;
    case 'github':
      return `https://github.com/login/oauth/authorize?client_id=${this.configService.get<string>('GITHUB_CLIENT_ID')}&scope=${encodeURIComponent(GITHUB_SCOPES.join(','))}&redirect_uri=${encodeURIComponent(this.configService.get<string>('SELFSERVER_URL') + '/integrations/connect/github')}&state=${state}`;
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

  async github(code: string, state: string): Promise<Partial<ToolInstallState>> {
    try {
      // Step 0: Retrieve state from cache
      const stateData = await this.cache.get<ToolInstallState>('install_github');
      if (!stateData) {
        throw new BadRequestException('State not found');
      }
      if (stateData.state !== state) {
        throw new BadRequestException('Invalid state');
      }
      await this.cache.del('install_github');

      // Step 1: Get GitHub credentials from config
      const clientId = this.configService.get<string>('GITHUB_CLIENT_ID');
      const clientSecret = this.configService.get<string>('GITHUB_CLIENT_SECRET');
      if (!clientId || !clientSecret) {
        throw new BadRequestException('Missing GitHub client configuration');
      }

      // Step 2: Exchange code for an access token
      const response = await this.httpService.axiosRef.post<GithubTokenResponse>(
        "https://github.com/login/oauth/access_token",
        { client_id: clientId, client_secret: clientSecret, code },
        { headers: { Accept: "application/json" } }
      );
      const access_token = response.data.access_token as string;
      if (!response.data.scope) {
        throw new BadRequestException('No scopes provided. Please ensure the app has necessary permissions.');
      }
      const scopes = response.data.scope.split(",");

      // Step 3: Fetch user details from GitHub
      const userResponse = await this.httpService.axiosRef.get<GitHubInfo>('https://api.github.com/user', {
        headers: { Authorization: `token ${access_token}` },
      });
      const { id, login, avatar_url, name } = userResponse.data;

      // Store GitHub authentication details
      await this.githubConfigModel.upsert({
        github_id: id,
        access_token,
        full_name: name,
        avatar: avatar_url,
        username: login,
        team_id: stateData.teamId,
        scopes
      });

      this.eventEmitter.emit(EVENT_NAMES.GITHUB_CONNECTED, {
        teamId: stateData.teamId,
        appId: stateData.appId,
        type: SUPPORTED_INTEGRATIONS.GITHUB,
      } satisfies IntegrationConnectedEvent);

      return {
        appId: stateData.appId,
        teamId: stateData.teamId
      };
    } catch (error) {
      this.logger.error('Failed to connect to GitHub:', error);
      throw new BadRequestException('Failed to connect to GitHub');
    }
  }

}

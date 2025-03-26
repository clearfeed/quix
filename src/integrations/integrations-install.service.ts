import { INTEGRATIONS, SUPPORTED_INTEGRATIONS, HUBSPOT_SCOPES, GITHUB_SCOPES } from '@quix/lib/constants';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HubspotTokenResponse, HubspotHubInfo, GithubTokenResponse, GitHubInfo, SalesforceTokenResponse, SalesforceTokenIntrospectionResponse } from './types';
import { JiraConfig, HubspotConfig, PostgresConfig, GithubConfig, SalesforceConfig } from '../database/models';
import { ToolInstallState } from '@quix/lib/types/common';
import { EVENT_NAMES, IntegrationConnectedEvent } from '@quix/types/events';
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
    @InjectModel(GithubConfig)
    private readonly githubConfigModel: typeof GithubConfig,
    @InjectModel(SalesforceConfig)
    private readonly salesforceConfigModel: typeof SalesforceConfig,
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
      case 'github':
        return `https://github.com/login/oauth/authorize?client_id=${this.configService.get<string>('GITHUB_CLIENT_ID')}&scope=${encodeURIComponent(GITHUB_SCOPES.join(','))}&redirect_uri=${encodeURIComponent(this.configService.get<string>('SELFSERVER_URL') + '/integrations/connect/github')}&state=${state}`;
      case 'salesforce':
        return `https://login.salesforce.com/services/oauth2/authorize?client_id=${this.configService.get<string>('SALESFORCE_CONSUMER_KEY')}&redirect_uri=${encodeURIComponent(this.configService.get<string>('SELFSERVER_URL') + '/integrations/connect/salesforce')}&response_type=code&state=${state}`;
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
      const { id, login, avatar_url } = userResponse.data;

      // Store GitHub authentication details
      await this.githubConfigModel.upsert({
        github_id: id,
        access_token,
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

  async salesforce(code: string, state: string): Promise<Partial<ToolInstallState>> {
    try {
      const stateData = await this.cache.get<ToolInstallState>('install_salesforce');
      if (!stateData) {
        throw new BadRequestException('State not found');
      }
      if (stateData.state !== state) {
        throw new BadRequestException('Invalid state');
      }
      await this.cache.del('install_salesforce');

      const clientId = this.configService.get<string>('SALESFORCE_CONSUMER_KEY');
      const clientSecret = this.configService.get<string>('SALESFORCE_CONSUMER_SECRET');
      const redirectUri = `${this.configService.get<string>('SELFSERVER_URL')}/integrations/connect/salesforce`;

      if (!clientId || !clientSecret) {
        throw new BadRequestException('Missing Salesforce client configuration');
      }

      const params = new URLSearchParams();
      params.append('grant_type', 'authorization_code');
      params.append('code', code);
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);
      params.append('redirect_uri', redirectUri);

      const response = await this.httpService.axiosRef.post<SalesforceTokenResponse>(
        'https://login.salesforce.com/services/oauth2/token',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const { access_token, refresh_token, instance_url, token_type, scope } = response.data;
      const scopes = scope ? scope.split(' ') : [];

      const tokenIntrospectionResponse = await this.httpService.axiosRef.post<SalesforceTokenIntrospectionResponse>(
        `${instance_url}/services/oauth2/introspect`,
        new URLSearchParams({
          token: access_token,
          token_type_hint: 'access_token',
          client_id: clientId,
          client_secret: clientSecret
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        }
      );

      const userInfoResponse = await this.httpService.axiosRef.get<{
        organization_id: string;
        is_app_installed: boolean;
        email: string;
        active: boolean;
      }>(
        `https://login.salesforce.com/services/oauth2/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`
          }
        }
      );

      if (!userInfoResponse.data.active) {
        throw new BadRequestException('Salesforce user is not active');
      }

      await this.salesforceConfigModel.upsert({
        organization_id: userInfoResponse.data.organization_id,
        team_id: stateData.teamId,
        access_token,
        refresh_token,
        instance_url,
        token_type,
        scopes,
        authed_user_email: userInfoResponse.data.email,
        expires_at: new Date(tokenIntrospectionResponse.data.exp * 1000)
      });

      this.eventEmitter.emit(EVENT_NAMES.SALESFORCE_CONNECTED, {
        teamId: stateData.teamId,
        appId: stateData.appId,
        type: SUPPORTED_INTEGRATIONS.SALESFORCE,
      } satisfies IntegrationConnectedEvent);

      return {
        appId: stateData.appId,
        teamId: stateData.teamId
      };
    } catch (error) {
      this.logger.error('Failed to connect to Salesforce:', error);
      throw new BadRequestException('Failed to connect to Salesforce');
    }
  }
}

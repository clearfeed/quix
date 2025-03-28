import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { JiraConfig, HubspotConfig, PostgresConfig, SalesforceConfig, GithubConfig } from '../database/models';
import { TimeInMilliSeconds } from '@quix/lib/constants';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { SalesforceTokenIntrospectionResponse } from './types';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectModel(PostgresConfig)
    private readonly postgresConfigModel: typeof PostgresConfig,
    @InjectModel(JiraConfig)
    private readonly jiraConfigModel: typeof JiraConfig,
    @InjectModel(HubspotConfig)
    private readonly hubspotConfigModel: typeof HubspotConfig,
    @InjectModel(SalesforceConfig)
    private readonly salesforceConfigModel: typeof SalesforceConfig,
    @InjectModel(GithubConfig)
    private readonly githubConfigModel: typeof GithubConfig
  ) {
    this.httpService.axiosRef.defaults.headers.common['Content-Type'] = 'application/json';
  }

  async updateJiraConfig(jiraConfig: JiraConfig): Promise<JiraConfig> {
    const expiresAt = new Date(jiraConfig.expires_at);
    if (expiresAt < new Date(Date.now() + (TimeInMilliSeconds.ONE_MINUTE * 10))) {
      const response = await this.httpService.axiosRef.post('https://auth.atlassian.com/oauth/token', {
        grant_type: 'refresh_token',
        client_id: this.configService.get('JIRA_CLIENT_ID'),
        client_secret: this.configService.get('JIRA_CLIENT_SECRET'),
        refresh_token: jiraConfig.refresh_token
      });
      const data = response.data;

      await jiraConfig.update({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: new Date(Date.now() + (data.expires_in * 1000))
      });

      return jiraConfig;
    }
    return jiraConfig;
  }

  async updateHubspotConfig(hubspotConfig: HubspotConfig): Promise<HubspotConfig> {
    const expiresAt = new Date(hubspotConfig.expires_at);
    if (expiresAt < new Date(Date.now() + (TimeInMilliSeconds.ONE_MINUTE * 10))) {
      const params = new URLSearchParams();
      params.set('grant_type', 'refresh_token');
      params.set('refresh_token', hubspotConfig.refresh_token);
      params.set('client_id', this.configService.get<string>('HUBSPOT_CLIENT_ID')!);
      params.set('client_secret', this.configService.get<string>('HUBSPOT_CLIENT_SECRET')!);
      const response = await this.httpService.axiosRef.post('https://api.hubapi.com/oauth/v1/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      const data = response.data;

      await hubspotConfig.update({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: new Date(Date.now() + (data.expires_in * 1000))
      });

      return hubspotConfig;
    }
    return hubspotConfig;
  }

  async updateSalesforceConfig(salesforceConfig: SalesforceConfig): Promise<SalesforceConfig> {
    const expiresAt = new Date(salesforceConfig.expires_at);
    const clientId = this.configService.get<string>('SALESFORCE_CONSUMER_KEY')!;
    const clientSecret = this.configService.get<string>('SALESFORCE_CONSUMER_SECRET')!;
    if (expiresAt < new Date(Date.now() + (TimeInMilliSeconds.ONE_MINUTE * 10))) {
      const params = new URLSearchParams();
      params.set('grant_type', 'refresh_token');
      params.set('refresh_token', salesforceConfig.refresh_token);
      params.set('client_id', clientId);
      params.set('client_secret', clientSecret);
      const response = await this.httpService.axiosRef.post('https://login.salesforce.com/services/oauth2/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      const oauthData = response.data;

      const tokenIntrospectionResponse = await this.httpService.axiosRef.post<SalesforceTokenIntrospectionResponse>(
        `${salesforceConfig.instance_url}/services/oauth2/introspect`,
        new URLSearchParams({
          token: oauthData.access_token,
          token_type_hint: 'access_token',
          client_id: clientId,
          client_secret: clientSecret
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      await salesforceConfig.update({
        access_token: oauthData.access_token,
        expires_at: new Date(tokenIntrospectionResponse.data.exp * 1000),
      });

      return salesforceConfig;
    }
    return salesforceConfig;
  }

  async removePostgresConfig(teamId: string) {
    await this.postgresConfigModel.destroy({ where: { team_id: teamId }, force: true });
  }

  async removeJiraConfig(teamId: string) {
    await this.jiraConfigModel.destroy({ where: { team_id: teamId }, force: true });
  }

  async removeHubspotConfig(teamId: string) {
    await this.hubspotConfigModel.destroy({ where: { team_id: teamId }, force: true });
  }

  async removeSalesforceConfig(teamId: string) {
    await this.salesforceConfigModel.destroy({ where: { team_id: teamId }, force: true });
  }

  async removeGithubConfig(teamId: string) {
    await this.githubConfigModel.destroy({ where: { team_id: teamId }, force: true });
  }

}
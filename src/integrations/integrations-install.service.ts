import {
  INTEGRATIONS,
  SUPPORTED_INTEGRATIONS,
  HUBSPOT_SCOPES,
  GITHUB_SCOPES
} from '@quix/lib/constants';
import { BadRequestException, HttpException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  HubspotTokenResponse,
  HubspotHubInfo,
  GithubTokenResponse,
  GitHubInfo,
  SalesforceTokenResponse,
  SalesforceTokenIntrospectionResponse
} from './types';
import {
  JiraConfig,
  HubspotConfig,
  PostgresConfig,
  GithubConfig,
  SalesforceConfig,
  NotionConfig,
  LinearConfig,
  McpConnection,
  OktaConfig,
  ZendeskConfig
} from '../database/models';
import { ToolInstallState } from '@quix/lib/types/common';
import { EVENT_NAMES, IntegrationConnectedEvent } from '@quix/types/events';
import { ViewSubmitAction } from '@slack/bolt';
import { parseInputBlocksSubmission } from '@quix/lib/utils/slack';
import { KnownBlock } from '@slack/web-api';
import { SLACK_ACTIONS } from '@quix/lib/utils/slack-constants';
import { Sequelize } from 'sequelize-typescript';
import { McpService } from './mcp.service';
import { decrypt, encryptForLogs } from '@quix/lib/utils/encryption';
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
    @InjectModel(NotionConfig)
    private readonly notionConfigModel: typeof NotionConfig,
    @InjectModel(LinearConfig)
    private readonly linearConfigModel: typeof LinearConfig,
    @InjectModel(McpConnection)
    private readonly mcpConnectionModel: typeof McpConnection,
    @InjectModel(PostgresConfig)
    private readonly postgresConfigModel: typeof PostgresConfig,
    @InjectModel(OktaConfig)
    private readonly oktaConfigModel: typeof OktaConfig,
    @InjectModel(ZendeskConfig)
    private readonly zendeskConfigModel: typeof ZendeskConfig,
    private readonly eventEmitter: EventEmitter2,
    private readonly sequelize: Sequelize,
    private readonly mcpService: McpService
  ) {
    this.httpService.axiosRef.defaults.headers.common['Content-Type'] = 'application/json';
  }

  getInstallUrl(tool: (typeof INTEGRATIONS)[number]['value'], state: string): string {
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
      const response = await this.httpService.axiosRef.post(
        `https://auth.atlassian.com/oauth/token`,
        {
          grant_type: 'authorization_code',
          code,
          client_id: this.configService.get<string>('JIRA_CLIENT_ID'),
          client_secret: this.configService.get<string>('JIRA_CLIENT_SECRET'),
          redirect_uri: `${this.configService.get<string>('SELFSERVER_URL')}/integrations/connect/jira`
        }
      );
      const accessibleResources = await this.httpService.axiosRef.get(
        `https://api.atlassian.com/oauth/token/accessible-resources`,
        {
          headers: {
            Authorization: `Bearer ${response.data.access_token}`
          }
        }
      );
      const jiraSite = accessibleResources.data[0];

      await this.jiraConfigModel.upsert({
        id: jiraSite.id,
        name: jiraSite.name,
        url: jiraSite.url,
        scopes: jiraSite.scopes,
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_at: new Date(Date.now() + response.data.expires_in * 1000),
        team_id: stateData.teamId
      });

      this.eventEmitter.emit(EVENT_NAMES.JIRA_CONNECTED, {
        teamId: stateData.teamId,
        appId: stateData.appId,
        type: SUPPORTED_INTEGRATIONS.JIRA
      } satisfies IntegrationConnectedEvent);

      return {
        appId: stateData.appId,
        teamId: stateData.teamId
      };
    } catch (error) {
      this.logger.error('Failed to connect to Jira:', error);
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
        expires_at: new Date(Date.now() + response.data.expires_in * 1000),
        hub_domain: hubInfo.hub_domain,
        hub_id: hubInfo.hub_id,
        scopes: hubInfo.scopes,
        team_id: stateData.teamId
      });

      this.eventEmitter.emit(EVENT_NAMES.HUBSPOT_CONNECTED, {
        teamId: stateData.teamId,
        appId: stateData.appId,
        type: SUPPORTED_INTEGRATIONS.HUBSPOT
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
        'https://github.com/login/oauth/access_token',
        { client_id: clientId, client_secret: clientSecret, code },
        { headers: { Accept: 'application/json' } }
      );
      const access_token = response.data.access_token as string;
      if (!response.data.scope) {
        throw new BadRequestException(
          'No scopes provided. Please ensure the app has necessary permissions.'
        );
      }
      const scopes = response.data.scope.split(',');

      // Step 3: Fetch user details from GitHub
      const userResponse = await this.httpService.axiosRef.get<GitHubInfo>(
        'https://api.github.com/user',
        {
          headers: { Authorization: `token ${access_token}` }
        }
      );
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
        type: SUPPORTED_INTEGRATIONS.GITHUB
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
    if (
      ![
        SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.HOST,
        SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.PORT,
        SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.USER,
        SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.PASSWORD,
        SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.DATABASE
      ].every((field) => parsedResponse[field].selectedValue)
    ) {
      throw new BadRequestException('Invalid response');
    }
    const sslResponse = parsedResponse[SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.SSL].selectedValue;
    const [postgresConfig] = await this.postgresConfigModel.upsert({
      id,
      host: parsedResponse[SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.HOST].selectedValue as string,
      port: parseInt(
        parsedResponse[SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.PORT].selectedValue as string
      ),
      user: parsedResponse[SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.USER].selectedValue as string,
      password: parsedResponse[SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.PASSWORD]
        .selectedValue as string,
      database: parsedResponse[SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.DATABASE]
        .selectedValue as string,
      team_id: payload.view.team_id,
      ssl: sslResponse ? Boolean(sslResponse.length > 0) : false,
      default_prompt: parsedResponse[SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.DEFAULT_PROMPT]
        .selectedValue as string
    });
    this.eventEmitter.emit(EVENT_NAMES.POSTGRES_CONNECTED, {
      teamId: payload.view.team_id,
      appId: payload.view.app_id!,
      type: SUPPORTED_INTEGRATIONS.POSTGRES,
      userId: payload.user.id
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

      const tokenIntrospectionResponse =
        await this.httpService.axiosRef.post<SalesforceTokenIntrospectionResponse>(
          `${instance_url}/services/oauth2/introspect`,
          new URLSearchParams({
            token: access_token,
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

      const userInfoResponse = await this.httpService.axiosRef.get<{
        organization_id: string;
        is_app_installed: boolean;
        email: string;
        active: boolean;
      }>(`https://login.salesforce.com/services/oauth2/userinfo`, {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      });

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
        type: SUPPORTED_INTEGRATIONS.SALESFORCE
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

  async notion(payload: ViewSubmitAction): Promise<NotionConfig> {
    try {
      const parsedResponse = parseInputBlocksSubmission(
        payload.view.blocks as KnownBlock[],
        payload.view.state.values
      );

      if (!parsedResponse[SLACK_ACTIONS.NOTION_CONNECTION_ACTIONS.API_TOKEN].selectedValue) {
        throw new BadRequestException('Invalid response');
      }

      const apiToken = parsedResponse[SLACK_ACTIONS.NOTION_CONNECTION_ACTIONS.API_TOKEN]
        .selectedValue as string;
      const defaultPrompt = parsedResponse[SLACK_ACTIONS.NOTION_CONNECTION_ACTIONS.DEFAULT_PROMPT]
        .selectedValue as string;

      // Validate the token and get workspace details
      const userResponse = await this.httpService.axiosRef.get<{
        object: string;
        id: string;
        name: string;
        avatar_url: string;
        type: string;
        bot: {
          owner: {
            type: string;
            workspace: boolean;
          };
          workspace_name: string;
        };
        request_id: string;
      }>('https://api.notion.com/v1/users/me', {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Notion-Version': '2022-06-28'
        }
      });

      // If the API calls succeed, save the token and workspace details
      const [notionConfig] = await this.notionConfigModel.upsert({
        workspace_name: userResponse.data.bot.workspace_name,
        access_token: apiToken,
        team_id: payload.view.team_id,
        default_prompt: defaultPrompt
      });

      this.eventEmitter.emit(EVENT_NAMES.NOTION_CONNECTED, {
        teamId: payload.view.team_id,
        appId: payload.view.app_id!,
        type: SUPPORTED_INTEGRATIONS.NOTION,
        userId: payload.user.id
      } satisfies IntegrationConnectedEvent);

      return notionConfig;
    } catch (error) {
      this.logger.error('Failed to connect to Notion:', error);
      throw new BadRequestException(
        'Invalid Notion API token or unable to fetch workspace details'
      );
    }
  }

  async linear(payload: ViewSubmitAction): Promise<LinearConfig> {
    try {
      const parsedResponse = parseInputBlocksSubmission(
        payload.view.blocks as KnownBlock[],
        payload.view.state.values
      );

      if (!parsedResponse[SLACK_ACTIONS.LINEAR_CONNECTION_ACTIONS.API_TOKEN].selectedValue) {
        throw new BadRequestException('Invalid response');
      }

      const apiToken = parsedResponse[SLACK_ACTIONS.LINEAR_CONNECTION_ACTIONS.API_TOKEN]
        .selectedValue as string;
      const defaultPrompt = parsedResponse[SLACK_ACTIONS.LINEAR_CONNECTION_ACTIONS.DEFAULT_PROMPT]
        .selectedValue as string;

      // Validate the token and get workspace details
      const response = await this.httpService.axiosRef.post(
        'https://api.linear.app/graphql',
        {
          query: `
          query {
            organization {
              id
              name
            }
          }
        `
        },
        {
          headers: {
            Authorization: apiToken,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data?.data?.organization) {
        throw new BadRequestException('Invalid Linear API token');
      }

      // If the API call succeeds, save the token and workspace details
      const [linearConfig] = await this.linearConfigModel.upsert({
        workspace_name: response.data.data.organization.name,
        linear_org_id: response.data.data.organization.id,
        access_token: apiToken,
        team_id: payload.view.team_id,
        default_prompt: defaultPrompt
      });

      this.eventEmitter.emit(EVENT_NAMES.LINEAR_CONNECTED, {
        teamId: payload.view.team_id,
        appId: payload.view.app_id!,
        type: SUPPORTED_INTEGRATIONS.LINEAR,
        userId: payload.user.id
      } satisfies IntegrationConnectedEvent);

      return linearConfig;
    } catch (error) {
      this.logger.error('Failed to connect to Linear:', error);
      throw new BadRequestException(
        'Invalid Linear API token or unable to fetch workspace details'
      );
    }
  }

  async mcp(payload: ViewSubmitAction): Promise<McpConnection> {
    // Create or update MCP connection
    let mcpToolConfig:
      | Awaited<ReturnType<typeof this.mcpService.getToolsFromMCPConnections>>[number]
      | undefined;
    try {
      const parsedResponse = parseInputBlocksSubmission(
        payload.view.blocks as KnownBlock[],
        payload.view.state.values
      );
      const privateMetadata = JSON.parse(payload.view.private_metadata || '{}');

      // Validate required fields
      if (
        ![
          SLACK_ACTIONS.MCP_CONNECTION_ACTIONS.NAME,
          SLACK_ACTIONS.MCP_CONNECTION_ACTIONS.URL,
          SLACK_ACTIONS.MCP_CONNECTION_ACTIONS.API_TOKEN,
          SLACK_ACTIONS.MCP_CONNECTION_ACTIONS.TOOL_SELECTION_PROMPT
        ].every((field) => parsedResponse[field]?.selectedValue)
      ) {
        throw new BadRequestException('Missing required fields');
      }

      // Validate URL format
      const urlString = parsedResponse[SLACK_ACTIONS.MCP_CONNECTION_ACTIONS.URL]
        .selectedValue as string;
      const defaultPrompt = parsedResponse[SLACK_ACTIONS.MCP_CONNECTION_ACTIONS.DEFAULT_PROMPT]
        .selectedValue as string;
      try {
        const url = new URL(urlString);
        if (!['https:', 'http:'].includes(url.protocol)) {
          throw new BadRequestException('URL must use https protocol');
        }
      } catch (error) {
        throw new BadRequestException('Invalid URL format');
      }

      const mcpConnection = await this.sequelize.transaction(async (transaction) => {
        const [mcpConnection] = await this.mcpConnectionModel.upsert(
          {
            id: privateMetadata.id,
            name: parsedResponse[SLACK_ACTIONS.MCP_CONNECTION_ACTIONS.NAME].selectedValue as string,
            url: parsedResponse[SLACK_ACTIONS.MCP_CONNECTION_ACTIONS.URL].selectedValue as string,
            auth_token: parsedResponse[SLACK_ACTIONS.MCP_CONNECTION_ACTIONS.API_TOKEN]
              .selectedValue as string,
            request_config: {
              tool_selection_prompt: parsedResponse[
                SLACK_ACTIONS.MCP_CONNECTION_ACTIONS.TOOL_SELECTION_PROMPT
              ].selectedValue as string
            },
            team_id: payload.view.team_id,
            default_prompt: defaultPrompt
          },
          { transaction }
        );
        try {
          [mcpToolConfig] = await this.mcpService.getToolsFromMCPConnections([mcpConnection]);
          if (mcpToolConfig?.tools.length === 0) {
            throw new BadRequestException('Failed to retrieve tools from the MCP server.');
          }
        } catch (error) {
          this.logger.error('Failed to get tools from MCP connection:', error);
          throw new BadRequestException(
            'Failed to retrieve tools from the MCP server. Please ensure the MCP server is running and properly configured.'
          );
        }
        return mcpConnection;
      });
      return mcpConnection;
    } catch (error) {
      this.logger.error('Failed to setup MCP connection:', error);
      if (error instanceof HttpException) throw error;
      throw new BadRequestException('Failed to setup MCP connection');
    } finally {
      mcpToolConfig?.cleanup();
    }
  }

  async okta(payload: ViewSubmitAction): Promise<OktaConfig> {
    try {
      const parsedResponse = parseInputBlocksSubmission(
        payload.view.blocks as KnownBlock[],
        payload.view.state.values
      );

      if (
        !parsedResponse[SLACK_ACTIONS.OKTA_CONNECTION_ACTIONS.ORG_URL].selectedValue ||
        !parsedResponse[SLACK_ACTIONS.OKTA_CONNECTION_ACTIONS.API_TOKEN].selectedValue
      ) {
        throw new BadRequestException('Missing required fields');
      }

      const orgUrl = parsedResponse[SLACK_ACTIONS.OKTA_CONNECTION_ACTIONS.ORG_URL]
        .selectedValue as string;
      const apiToken = parsedResponse[SLACK_ACTIONS.OKTA_CONNECTION_ACTIONS.API_TOKEN]
        .selectedValue as string;

      // Clean and validate the org URL
      const cleanedOrgUrl = orgUrl.trim().replace(/\/$/, '');

      try {
        const url = new URL(cleanedOrgUrl);
        const allowedDomains = ['okta.com', 'oktapreview.com'];
        if (!allowedDomains.some((domain) => url.hostname.endsWith(domain))) {
          throw new BadRequestException(
            'Invalid Okta domain. Must be an okta.com or oktapreview.com domain.'
          );
        }
      } catch (error) {
        throw new BadRequestException('Invalid URL format for Okta organization URL');
      }

      // Validate the token by making a test API call to get the organization
      try {
        const response = await this.httpService.axiosRef.get(`${cleanedOrgUrl}/api/v1/org`, {
          headers: {
            Authorization: `SSWS ${apiToken}`,
            Accept: 'application/json'
          }
        });

        if (!response.data || !response.data.id) {
          throw new BadRequestException('Failed to authenticate with Okta');
        }

        // If the API call succeeds, save the configuration
        const [oktaConfig] = await this.oktaConfigModel.upsert({
          org_id: response.data.id,
          org_url: cleanedOrgUrl,
          api_token: apiToken,
          team_id: payload.view.team_id
        });

        return oktaConfig;
      } catch (error) {
        this.logger.error('Failed to authenticate with Okta API:', error);
        throw new BadRequestException('Invalid Okta API token or unable to connect to Okta');
      }
    } catch (error) {
      this.logger.error('Failed to connect to Okta:', error);
      throw new BadRequestException('Failed to connect to Okta');
    }
  }

  async zendesk(payload: ViewSubmitAction): Promise<ZendeskConfig> {
    try {
      const parsed = parseInputBlocksSubmission(
        payload.view.blocks as KnownBlock[],
        payload.view.state.values
      );

      let apiToken = parsed[SLACK_ACTIONS.ZENDESK_CONNECTION_ACTIONS.API_TOKEN]
        ?.selectedValue as string;
      const subdomain = parsed[SLACK_ACTIONS.ZENDESK_CONNECTION_ACTIONS.SUBDOMAIN]
        ?.selectedValue as string;
      const defaultPrompt = parsed[SLACK_ACTIONS.ZENDESK_CONNECTION_ACTIONS.DEFAULT_PROMPT]
        ?.selectedValue as string;
      const email = parsed[SLACK_ACTIONS.ZENDESK_CONNECTION_ACTIONS.EMAIL]?.selectedValue as string;

      if (!apiToken) {
        const existingZendeskConfig = await this.zendeskConfigModel.findOne({
          where: { team_id: payload.view.team_id }
        });
        apiToken = decrypt(existingZendeskConfig!.access_token);
      }

      const authHeader = Buffer.from(`${email}/token:${apiToken}`).toString('base64');
      const response = await this.httpService.axiosRef.get(
        `https://${subdomain}.zendesk.com/api/v2/users/me.json`,
        {
          headers: {
            Authorization: `Basic ${authHeader}`
          }
        }
      );
      if (!response.data.user?.id) {
        throw new BadRequestException('Invalid Zendesk API token or email');
      }

      const [zendeskConfig] = await this.zendeskConfigModel.upsert({
        access_token: apiToken,
        team_id: payload.view.team_id,
        subdomain,
        default_prompt: defaultPrompt,
        email
      });

      this.eventEmitter.emit(EVENT_NAMES.ZENDESK_CONNECTED, {
        teamId: payload.view.team_id,
        appId: payload.view.app_id!,
        type: SUPPORTED_INTEGRATIONS.ZENDESK,
        userId: payload.user.id
      });

      return zendeskConfig;
    } catch (error) {
      this.logger.error('Zendesk connection failed:', encryptForLogs(JSON.stringify(error)));
      throw new BadRequestException('Invalid Zendesk API token or subdomain or email');
    }
  }
}

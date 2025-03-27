import { createHubspotToolsExport } from '@clearfeed-ai/quix-hubspot-agent';
import { createJiraToolsExport } from '@clearfeed-ai/quix-jira-agent';
import { createGitHubToolsExport } from '@clearfeed-ai/quix-github-agent';
import { createZendeskToolsExport } from '@clearfeed-ai/quix-zendesk-agent';
import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SlackWorkspace } from '../database/models';
import { IntegrationsService } from '../integrations/integrations.service';
import { createPostgresToolsExport } from '@clearfeed-ai/quix-postgres-agent';
import { createSalesforceToolsExport } from '@clearfeed-ai/quix-salesforce-agent';
@Injectable()
export class ToolService {
  constructor(
    private readonly config: ConfigService,
    @InjectModel(SlackWorkspace)
    private readonly slackWorkspaceModel: typeof SlackWorkspace,
    private readonly integrationsService: IntegrationsService
  ) { }

  get hubspotTools(): ToolConfig | undefined {
    const hubspotToken = this.config.get('HUBSPOT_ACCESS_TOKEN');
    if (hubspotToken) {
      return createHubspotToolsExport({ accessToken: hubspotToken });
    }
  }

  get zendeskTools(): ToolConfig | undefined {
    const zendeskSubdomain = this.config.get('ZENDESK_SUBDOMAIN');
    const zendeskEmail = this.config.get('ZENDESK_EMAIL');
    const zendeskToken = this.config.get('ZENDESK_API_TOKEN');
    if (zendeskSubdomain && zendeskEmail && zendeskToken) {
      return createZendeskToolsExport({
        subdomain: zendeskSubdomain,
        auth: {
          useOAuth: false,
          email: zendeskEmail,
          token: zendeskToken
        }
      });
    }
  }

  async getAvailableTools(teamId: string): Promise<Record<string, ToolConfig> | undefined> {
    const slackWorkspace = await this.slackWorkspaceModel.findByPk(teamId, {
      include: ['jiraConfig', 'hubspotConfig', 'postgresConfig', 'githubConfig', 'salesforceConfig']
    });
    if (!slackWorkspace) return;
    const tools: Record<string, ToolConfig> = {};
    const jiraConfig = slackWorkspace.jiraConfig;
    if (jiraConfig) {
      const updatedJiraConfig = await this.integrationsService.updateJiraConfig(jiraConfig);
      tools.jira = createJiraToolsExport({
        host: updatedJiraConfig.url,
        apiHost: `https://api.atlassian.com/ex/jira/${updatedJiraConfig.id}`,
        auth: { bearerToken: updatedJiraConfig.access_token },
        ...(updatedJiraConfig.default_config ? {
          defaultConfig: updatedJiraConfig.default_config
        } : {})
      });
    }
    const hubspotConfig = slackWorkspace.hubspotConfig;
    if (hubspotConfig) {
      const updatedHubspotConfig = await this.integrationsService.updateHubspotConfig(hubspotConfig);
      tools.hubspot = createHubspotToolsExport({ accessToken: updatedHubspotConfig.access_token });
    }
    const githubConfig = slackWorkspace.githubConfig;
    if (githubConfig) {
      tools.github = createGitHubToolsExport({
        token: githubConfig.access_token,
        owner: githubConfig.default_config?.owner,
        repo: githubConfig.default_config?.repo
      })
    }
    const postgresConfig = slackWorkspace.postgresConfig;
    if (postgresConfig) {
      tools.postgres = createPostgresToolsExport({
        host: postgresConfig.host,
        port: postgresConfig.port,
        user: postgresConfig.user,
        password: postgresConfig.password,
        database: postgresConfig.database,
        ssl: postgresConfig.ssl
      });
    }
    const salesforceConfig = slackWorkspace.salesforceConfig;
    if (salesforceConfig) {
      const updatedSalesforceConfig = await this.integrationsService.updateSalesforceConfig(salesforceConfig);
      tools.salesforce = createSalesforceToolsExport({
        instanceUrl: updatedSalesforceConfig.instance_url,
        accessToken: updatedSalesforceConfig.access_token
      });
    }
    return tools;
  }
}
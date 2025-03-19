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

  get githubTools(): ToolConfig | undefined {
    const githubToken = this.config.get('GITHUB_TOKEN');
    const githubOwner = this.config.get('GITHUB_OWNER');
    if (githubToken && githubOwner) {
      return createGitHubToolsExport({ token: githubToken, owner: githubOwner });
    }
  }

  get zendeskTools(): ToolConfig | undefined {
    const zendeskSubdomain = this.config.get('ZENDESK_SUBDOMAIN');
    const zendeskEmail = this.config.get('ZENDESK_EMAIL');
    const zendeskToken = this.config.get('ZENDESK_API_TOKEN');
    if (zendeskSubdomain && zendeskEmail && zendeskToken) {
      return createZendeskToolsExport({ subdomain: zendeskSubdomain, email: zendeskEmail, token: zendeskToken });
    }
  }

  async getAvailableTools(teamId: string): Promise<Record<string, ToolConfig> | undefined> {
    const slackWorkspace = await this.slackWorkspaceModel.findByPk(teamId, {
      include: ['jiraConfig', 'hubspotConfig', 'postgresConfig']
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
    return tools;
  }
}
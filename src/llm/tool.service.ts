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
import { McpServerCleanupFn, McpService } from './mcp.service';
import { SUPPORTED_INTEGRATIONS } from '@quix/lib/constants';

@Injectable()
export class ToolService {
  constructor(
    private readonly config: ConfigService,
    @InjectModel(SlackWorkspace)
    private readonly slackWorkspaceModel: typeof SlackWorkspace,
    private readonly integrationsService: IntegrationsService,
    private readonly mcpService: McpService
  ) { }

  private runningTools: McpServerCleanupFn[] = [];

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

    // Handle MCP-based integrations
    try {
      // Call MCP service to get tools for all integrations
      const mcpTools = await this.mcpService.getMcpServerTools(SUPPORTED_INTEGRATIONS.SLACK, {
        SLACK_BOT_TOKEN: slackWorkspace.bot_access_token,
        SLACK_TEAM_ID: slackWorkspace.team_id
      });
      if (mcpTools && mcpTools.tools.length > 0) {
        this.runningTools.push(mcpTools.cleanup);
        tools.slack = mcpTools;
      }
    } catch (error) {
      // Log error but continue with other tools
      console.error("Failed to load MCP tools:", error);
    }

    return tools;
  }

  async shutDownMcpServers() {
    await Promise.all(this.runningTools.map(cleanup => cleanup()));
    this.runningTools = [];
  }
}
import { createHubspotToolsExport } from '@clearfeed-ai/quix-hubspot-agent';
import { createJiraToolsExport } from '@clearfeed-ai/quix-jira-agent';
import { createGitHubToolsExport } from '@clearfeed-ai/quix-github-agent';
import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SlackWorkspace } from '../database/models';
import { IntegrationsService } from '../integrations/integrations.service';
import { createPostgresToolsExport } from '@clearfeed-ai/quix-postgres-agent';
import { createSalesforceToolsExport } from '@clearfeed-ai/quix-salesforce-agent';
import { McpServerCleanupFn, McpService } from './mcp.service';
import { QuixPrompts, SUPPORTED_INTEGRATIONS } from '../lib/constants';
import { createCommonToolsExport } from '@clearfeed-ai/quix-common-agent';
import { InferAttributes, InferCreationAttributes, Model, NonAttribute } from 'sequelize';
import { AvailableToolsWithConfig } from './types';

@Injectable()
export class ToolService {
  constructor(
    private readonly config: ConfigService,
    @InjectModel(SlackWorkspace)
    private readonly slackWorkspaceModel: typeof SlackWorkspace,
    private readonly integrationsService: IntegrationsService,
    private readonly mcpService: McpService
  ) {}

  private runningTools: McpServerCleanupFn[] = [];

  async getAvailableTools(teamId: string): Promise<AvailableToolsWithConfig | undefined> {
    const slackWorkspace = await this.slackWorkspaceModel.findByPk(teamId, {
      include: [
        'jiraConfig',
        'hubspotConfig',
        'postgresConfig',
        'githubConfig',
        'salesforceConfig',
        'notionConfig',
        'linearConfig'
      ]
    });
    if (!slackWorkspace) return;
    const tools: AvailableToolsWithConfig = {
      common: {
        toolConfig: createCommonToolsExport(),
        config: slackWorkspace
      }
    };
    const jiraConfig = slackWorkspace.jiraConfig;
    if (jiraConfig) {
      const updatedJiraConfig = await this.integrationsService.updateJiraConfig(jiraConfig);
      tools.jira = {
        toolConfig: createJiraToolsExport({
          host: updatedJiraConfig.url,
          apiHost: `https://api.atlassian.com/ex/jira/${updatedJiraConfig.id}`,
          auth: { bearerToken: updatedJiraConfig.access_token },
          ...(updatedJiraConfig.default_config
            ? {
                defaultConfig: updatedJiraConfig.default_config
              }
            : {})
        }),
        config: jiraConfig
      };
    }
    const hubspotConfig = slackWorkspace.hubspotConfig;
    if (hubspotConfig) {
      const updatedHubspotConfig =
        await this.integrationsService.updateHubspotConfig(hubspotConfig);
      tools.hubspot = {
        toolConfig: createHubspotToolsExport({ accessToken: updatedHubspotConfig.access_token }),
        config: hubspotConfig
      };
    }
    const githubConfig = slackWorkspace.githubConfig;
    if (githubConfig) {
      tools.github = {
        toolConfig: createGitHubToolsExport({
          token: githubConfig.access_token,
          owner: githubConfig.default_config?.owner,
          repo: githubConfig.default_config?.repo
        }),
        config: githubConfig
      };
    }
    const postgresConfig = slackWorkspace.postgresConfig;
    if (postgresConfig) {
      tools.postgres = {
        toolConfig: createPostgresToolsExport({
          host: postgresConfig.host,
          port: postgresConfig.port,
          user: postgresConfig.user,
          password: postgresConfig.password,
          database: postgresConfig.database,
          ssl: postgresConfig.ssl
        }),
        config: postgresConfig
      };
    }
    const salesforceConfig = slackWorkspace.salesforceConfig;
    if (salesforceConfig) {
      const updatedSalesforceConfig =
        await this.integrationsService.updateSalesforceConfig(salesforceConfig);
      tools.salesforce = {
        toolConfig: createSalesforceToolsExport({
          instanceUrl: updatedSalesforceConfig.instance_url,
          accessToken: updatedSalesforceConfig.access_token
        }),
        config: salesforceConfig
      };
    }

    // Handle MCP-based integrations
    try {
      // Call MCP service to get tools for all integrations
      const slackMcpTools = await this.mcpService.getMcpServerTools(SUPPORTED_INTEGRATIONS.SLACK, {
        SLACK_BOT_TOKEN: slackWorkspace.bot_access_token,
        SLACK_TEAM_ID: slackWorkspace.team_id
      });
      if (slackMcpTools && slackMcpTools.tools.length > 0) {
        this.runningTools.push(slackMcpTools.cleanup);
        tools.slack = {
          toolConfig: {
            tools: slackMcpTools.tools,
            prompts: {
              toolSelection: QuixPrompts.SLACK.toolSelection,
              responseGeneration: QuixPrompts.SLACK.responseGeneration
            }
          },
          config: slackWorkspace
        };
      }

      if (slackWorkspace.notionConfig) {
        const notionMcpTools = await this.mcpService.getMcpServerTools(
          SUPPORTED_INTEGRATIONS.NOTION,
          {
            NOTION_API_TOKEN: slackWorkspace.notionConfig.access_token
          }
        );
        if (notionMcpTools && notionMcpTools.tools.length > 0) {
          this.runningTools.push(notionMcpTools.cleanup);
          tools.notion = {
            toolConfig: {
              tools: notionMcpTools.tools,
              prompts: {
                toolSelection: QuixPrompts.NOTION.toolSelection,
                responseGeneration: QuixPrompts.NOTION.responseGeneration
              }
            },
            config: slackWorkspace.notionConfig
          };
        }
      }

      if (slackWorkspace.linearConfig) {
        const linearMcpTools = await this.mcpService.getMcpServerTools(
          SUPPORTED_INTEGRATIONS.LINEAR,
          {
            LINEAR_API_KEY: slackWorkspace.linearConfig.access_token
          },
          slackWorkspace.linearConfig.default_config?.team_id
            ? { teamId: slackWorkspace.linearConfig.default_config.team_id }
            : undefined
        );
        if (linearMcpTools && linearMcpTools.tools.length > 0) {
          this.runningTools.push(linearMcpTools.cleanup);
          tools.linear = {
            toolConfig: {
              tools: linearMcpTools.tools,
              prompts: {
                toolSelection: QuixPrompts.LINEAR.toolSelection,
                responseGeneration: QuixPrompts.LINEAR.responseGeneration
              }
            },
            config: slackWorkspace.linearConfig
          };
        }
      }
    } catch (error) {
      // Log error but continue with other tools
      console.error('Failed to load MCP tools:', error);
    }

    return tools;
  }

  async shutDownMcpServers() {
    await Promise.all(this.runningTools.map((cleanup) => cleanup()));
    this.runningTools = [];
  }
}

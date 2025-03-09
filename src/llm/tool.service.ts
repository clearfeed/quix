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
      return createHubspotToolsExport({ apiKey: hubspotToken });
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
      include: ['jiraSite']
    });
    if (!slackWorkspace) return;
    const tools: Record<string, ToolConfig> = {};
    const jiraSite = slackWorkspace.jiraSite;
    if (jiraSite) {
      const updatedJiraSite = await this.integrationsService.updateJiraConfig(jiraSite);
      tools.jira = createJiraToolsExport({ host: updatedJiraSite.url, apiHost: `https://api.atlassian.com/ex/jira/${updatedJiraSite.id}`, auth: { bearerToken: updatedJiraSite.access_token } });
    }
    return tools;
  }
}
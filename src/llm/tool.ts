import { createHubspotToolsExport } from '@clearfeed-ai/quix-hubspot-agent';
import { createJiraToolsExport } from '@clearfeed-ai/quix-jira-agent';
import { createGitHubToolsExport } from '@clearfeed-ai/quix-github-agent';
import { createZendeskToolsExport } from '@clearfeed-ai/quix-zendesk-agent';
import { Tool, ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { ConfigService } from '@nestjs/config';

export class ToolClass {
  constructor(private readonly config: ConfigService) { }

  get hubspotTools(): ToolConfig | undefined {
    const hubspotToken = this.config.get('HUBSPOT_ACCESS_TOKEN');
    if (hubspotToken) {
      return createHubspotToolsExport({ apiKey: hubspotToken });
    }
  }

  get jiraTools(): ToolConfig | undefined {
    const jiraHost = this.config.get('JIRA_HOST');
    const jiraUsername = this.config.get('JIRA_USERNAME');
    const jiraApiToken = this.config.get('JIRA_API_TOKEN');
    if (jiraHost && jiraUsername && jiraApiToken) {
      return createJiraToolsExport({ host: jiraHost, username: jiraUsername, password: jiraApiToken });
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

  get tools(): Record<string, Tool[] | undefined> {
    return {
      hubspot: this.hubspotTools?.tools,
      jira: this.jiraTools?.tools,
      github: this.githubTools?.tools,
      zendesk: this.zendeskTools?.tools
    };
  }

  get availableCategories(): string[] {
    return ['none', ...Object.keys(this.toolPrompts).filter(key =>
      this.toolPrompts[key as keyof typeof this.toolPrompts] &&
      Object.keys(this.toolPrompts[key as keyof typeof this.toolPrompts]).length > 0
    )];
  }

  get toolPrompts(): Record<keyof typeof this.tools, { toolSelection?: string; responseGeneration?: string }> {
    return {
      hubspot: this.hubspotTools?.prompts || {},
      jira: this.jiraTools?.prompts || {},
      github: this.githubTools?.prompts || {},
      zendesk: this.zendeskTools?.prompts || {}
    };
  }
}

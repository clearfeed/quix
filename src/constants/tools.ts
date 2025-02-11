import { createHubspotToolsExport } from '@clearfeed-ai/quix-hubspot-agent';
import { createJiraToolsExport } from '@clearfeed-ai/quix-jira-agent';
import { createGitHubToolsExport } from '@clearfeed-ai/quix-github-agent';
import { createZendeskToolsExport } from '@clearfeed-ai/quix-zendesk-agent';
import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import config from '../config';

// Get tools and handlers from each service
let hubspotExport: ToolConfig | undefined;
if (config.hubspot?.accessToken) {
  hubspotExport = createHubspotToolsExport({ apiKey: config.hubspot.accessToken });
}

let jiraExport: ToolConfig | undefined;
if (config.jira?.host && config.jira?.username && config.jira?.password) {
  jiraExport = createJiraToolsExport({
    host: config.jira.host,
    username: config.jira.username,
    password: config.jira.password
  });
}

let githubExport: ToolConfig | undefined;
if (config.github?.token && config.github?.owner) {
  githubExport = createGitHubToolsExport({
    token: config.github.token,
    owner: config.github.owner
  });
}

let zendeskExport: ToolConfig | undefined;
if (config.zendesk?.subdomain && config.zendesk?.email && config.zendesk?.token) {
  zendeskExport = createZendeskToolsExport({
    subdomain: config.zendesk.subdomain,
    email: config.zendesk.email,
    token: config.zendesk.token
  });
}

// Combine all tools and handlers
export const tools = [
  ...(hubspotExport?.tools || []),
  ...(jiraExport?.tools || []),
  ...(githubExport?.tools || []),
  ...(zendeskExport?.tools || [])
];

export const toolHandlers = {
  ...hubspotExport?.handlers,
  ...jiraExport?.handlers,
  ...githubExport?.handlers,
  ...zendeskExport?.handlers
};

// Combine all prompts
export const toolPrompts: Record<string, { toolSelection?: string; responseGeneration?: string }> = {
  hubspot: hubspotExport?.prompts || {},
  jira: jiraExport?.prompts || {},
  github: githubExport?.prompts || {},
  zendesk: zendeskExport?.prompts || {}
};

// Add global tool selection prompt
toolPrompts.toolSelection = {
  toolSelection: Object.values([
    hubspotExport?.prompts?.toolSelection,
    jiraExport?.prompts?.toolSelection,
    githubExport?.prompts?.toolSelection,
    zendeskExport?.prompts?.toolSelection
  ]).filter(Boolean).join('\n')
};

export const OPENAI_CONTEXT_SIZE = 30;
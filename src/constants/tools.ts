import { createHubspotToolsExport } from '@clearfeed-ai/quix-hubspot-agent';
import { createJiraToolsExport } from '@clearfeed-ai/quix-jira-agent';
import { createGitHubToolsExport } from '@clearfeed-ai/quix-github-agent';
import { createZendeskToolsExport } from '@clearfeed-ai/quix-zendesk-agent';
import config from '../config';

// Get tools and handlers from each service
let hubspotExport;
if (config.hubspot?.accessToken) {
  hubspotExport = createHubspotToolsExport({ apiKey: config.hubspot.accessToken });
}

let jiraExport;
if (config.jira?.host && config.jira?.username && config.jira?.password) {
  jiraExport = createJiraToolsExport({
    host: config.jira.host,
    username: config.jira.username,
    password: config.jira.password
  });
}

let githubExport;
if (config.github?.token && config.github?.owner) {
  githubExport = createGitHubToolsExport({
    token: config.github.token,
    owner: config.github.owner
  });
}

let zendeskExport;
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
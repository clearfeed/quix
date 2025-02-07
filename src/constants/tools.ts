import { createHubspotToolsExport } from '@clearfeed-agent/hubspot';
import { createJiraToolsExport } from '@clearfeed-agent/jira';
import { createGitHubToolsExport } from '@clearfeed-agent/github';
import config from '../config';

// Get tools and handlers from each service
let hubspotExport;
if (config.hubspot?.accessToken) {
  hubspotExport = createHubspotToolsExport({ accessToken: config.hubspot.accessToken });
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

// Combine all tools and handlers
export const tools = [
  ...(hubspotExport?.tools || []),
  ...(jiraExport?.tools || []),
  ...(githubExport?.tools || []),
];

export const toolHandlers = {
  ...(hubspotExport?.handlers || {}),
  ...(jiraExport?.handlers || {}),
  ...(githubExport?.handlers || {}),
};
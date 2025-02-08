import { createHubspotToolsExport } from '@clearfeed/hubspot-agent';
import { createJiraToolsExport } from '@clearfeed/jira-agent';
import { createGitHubToolsExport } from '@clearfeed/github-agent';
import { createPostgresToolsExport } from '@clearfeed/postgres-agent';
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

let postgresExport;
if (config.postgres?.host && config.postgres?.database && config.postgres?.whitelistedTables) {
  postgresExport = createPostgresToolsExport({
    host: config.postgres.host,
    database: config.postgres.database,
    user: config.postgres.user,
    password: config.postgres.password,
    port: config.postgres.port,
    whitelistedTables: config.postgres.whitelistedTables
  });
}

// Combine all tools and handlers
export const tools = [
  ...(hubspotExport?.tools || []),
  ...(jiraExport?.tools || []),
  ...(githubExport?.tools || []),
  ...(postgresExport?.tools || []),
];

export const toolHandlers = {
  ...(hubspotExport?.handlers || {}),
  ...(jiraExport?.handlers || {}),
  ...(githubExport?.handlers || {}),
  ...(postgresExport?.handlers || {}),
};
import dotenv from 'dotenv';

dotenv.config();

export default {
  port: process.env.PORT || 3000,
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  hubspot: {
    accessToken: process.env.HUBSPOT_ACCESS_TOKEN,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN,
  },
  jira: {
    host: process.env.JIRA_HOST,
    username: process.env.JIRA_USERNAME || '',
    password: process.env.JIRA_API_TOKEN,
  },
  github: {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_OWNER,
  },
  postgres: {
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    whitelistedTables: (process.env.POSTGRES_WHITELISTED_TABLES || '').split(',').filter(Boolean),
  },
} as const; 
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.JIRA_HOST || !process.env.JIRA_API_TOKEN) {
  throw new Error('Missing required JIRA environment variables');
}

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
} as const; 
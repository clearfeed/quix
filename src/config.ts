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
} as const; 
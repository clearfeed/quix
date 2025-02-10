import { WebClient } from '@slack/web-api';
import { AssistantThreadEvent } from './types';
import logger from '../../utils/logger';

export const handleThreadStarted = async (
  event: AssistantThreadEvent
) => {
  
  const client = new WebClient(process.env.SLACK_BOT_TOKEN);

  const threadId = event.assistant_thread.thread_ts;
  const channelId = event.assistant_thread.channel_id;

  try {
    await client.apiCall('assistant.threads.setSuggestedPrompts', {
      thread_ts: threadId,
      channel_id: channelId,
      title: "Welcome to ClearFeed Agent. Here are some suggestions to get started:",
      prompts: [
        {
          title: "Get deal details from HubSpot",
          message: "What's the status of my deal with Tesla?",
        },
        {
          title: "Create a Jira issue",
          message: "I need to create a new Jira task to build AI agents in the APP project.",
        },
        {
          title: "Get Jira issue details",
          message: "What's the status of my Jira issue APP-123?",
        }
      ]
    });
    logger.info('Successfully set suggested prompts for thread', { threadId, channelId });
  } catch (error) {
    logger.error('Error setting suggested prompts:', error);
  }
}; 
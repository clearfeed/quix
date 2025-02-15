import { AppMentionEvent } from './types';
import { llmService } from '../../services/llm/llm.service';
import logger from '../../utils/logger';
import { WebClient } from '@slack/web-api';
import { createOpenAIContext } from '../../utils/slack';

export const handleAppMention = async (
  event: AppMentionEvent,
) => {
  const client = new WebClient(process.env.SLACK_BOT_TOKEN);

  try {
    const messages = await createOpenAIContext(event);
    const response = await llmService.processMessage(event.text, messages);
    await client.chat.postMessage({
      channel: event.channel,
      text: response,
      thread_ts: event.thread_ts
    });

    logger.info('Sent response to app mention', { channel: event.channel, response });
  } catch (error) {
    logger.error('Error handling app mention:', error);
  }
}; 
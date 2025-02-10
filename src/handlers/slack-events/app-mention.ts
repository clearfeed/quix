import { AppMentionEvent, SlackEventContext } from './types';
import { processMessage } from '../../services/openai.service';

export const handleAppMention = async (
  event: AppMentionEvent,
  { client, logger }: SlackEventContext
) => {
  try {
    const response = await processMessage(event.text);
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
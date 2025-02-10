import { MessageEvent } from './types';
import { processMessage } from '../../services/openai.service';
import logger from '../../utils/logger';
import { WebClient } from '@slack/web-api';
import { OpenAIContext } from '../../types';
import { MessageElement } from '@slack/web-api/dist/types/response/ConversationsHistoryResponse';

export const handleMessage = async (
  event: MessageEvent,
) => {
  // Ignore bot messages and messages with subtypes
  if (event.bot_id || event.subtype) {
    return;
  }
  const client = new WebClient(process.env.SLACK_BOT_TOKEN);

  logger.info('Received message', { event });

  try {
    await client.apiCall('assistant.threads.setStatus', {
      status: 'Looking up information...',
      thread_ts: event.thread_ts,
      channel_id: event.channel
    });

    if (event.text) {
      let messages: OpenAIContext[] = [];
      // get previous messages
      if (event.thread_ts) {
        const messagesResponse = await client.conversations.replies({
          channel: event.channel,
          ts: event.thread_ts,
          limit: 10
        });

        if (messagesResponse.messages && messagesResponse.messages.length > 0) {
          messages = messagesResponse.messages.map((message: MessageElement) => {
            if (message.subtype === 'assistant_app_thread' || !message.text) return;
            return {
              role: message.bot_id ? 'assistant' : 'user',
              content: message.text
            } as OpenAIContext;
          }).filter((message) => message !== undefined).slice(-10);
        }
      }
      const response = await processMessage(event.text, messages);
      await client.chat.postMessage({
        channel: event.channel,
        text: response,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: response
            }
          }
        ],
        thread_ts: event.thread_ts
      });
      logger.info('Sent response to message', { channel: event.channel, response });
    } else {
      await client.chat.postMessage({
        channel: event.channel,
        text: 'Please provide more information...',
        thread_ts: event.thread_ts
      });
      logger.info('No text in message', { event });
    }
  } catch (error) {
    logger.error('Error sending response:', error);
  }
}; 
import { RequestHandler } from 'express';
import { SlackChallengeEvent } from '../types';
import logger from '../utils/logger';
import { WebClient } from '@slack/web-api';
import config from '../config';
import { processMessage } from '../services/openai.service';

const slackClient = new WebClient(config.slack.botToken);

export const slackEventsHandler: RequestHandler = async (req, res) => {
  const event = req.body;

  try {
    switch (event.type) {
      case 'url_verification':
        res.json({ challenge: (event as SlackChallengeEvent).challenge });
        return;
      case 'event_callback':
        if (event.event?.type === 'assistant_thread_started') {
          const threadId = event.event.assistant_thread.thread_ts;
          const channelId = event.event.assistant_thread.channel_id;

          try {
            await slackClient.apiCall('assistant.threads.setSuggestedPrompts', {
              thread_ts: threadId,
              channel_id: channelId,
              title: "Welcome to ClearFeed Agent. Here are some suggestions to get started:",
              prompts: [
                {
                  title: "What's the deal with a company?",
                  message: "What's the status of my deal with xyz company?",
                }
              ]
            });
            logger.info('Successfully set suggested prompts for thread', { threadId, channelId });
          } catch (error) {
            logger.error('Error setting suggested prompts:', error);
          }
        } else if (event.event?.type === 'message' && event.event?.channel_type === 'im' && !event.event.bot_id && !event.event.subtype) {
          try {
            // ignore bot messages
            if (event.event.bot_id) {
              return;
            }
            await slackClient.apiCall('assistant.threads.setStatus', {
              status: 'Looking up information...',
              thread_ts: event.event.thread_ts,
              channel_id: event.event.channel
            });
            logger.info('Looking up information...', { event: event.event });
            processMessage(event.event.text).then(async (response) => {
              await slackClient.chat.postMessage({
                channel: event.event.channel,
                text: response,
                thread_ts: event.event.thread_ts
              });
              logger.info('Sent response to message', { channel: event.event.channel, response });
            });
          } catch (error) {
            logger.error('Error sending response:', error);
          }
        }
        break;
      default:
        logger.info('Unhandled Slack event:', { event });
        break;
    }

    res.sendStatus(200);
  } catch (error) {
    logger.error('Error processing Slack event:', error);
    res.sendStatus(500);
  }
}; 
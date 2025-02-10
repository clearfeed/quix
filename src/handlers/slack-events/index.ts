import { RequestHandler } from 'express';
import logger from '../../utils/logger';
import { handleUrlVerification } from './url-verification';
import { handleThreadStarted } from './thread-started';
import { handleMessage } from './message';
import { handleAppMention } from './app-mention';


export const slackEventsHandler: RequestHandler = async (req, res) => {
  const event = req.body;
  const innerEvent = event.event;

  try {
    switch (event.type) {
      case 'url_verification':
        return handleUrlVerification(event, res);

      case 'event_callback':
        // Send 200 OK early for event_callback to meet Slack's 3s requirement
        res.sendStatus(200);

        switch (event.event?.type) {
          case 'assistant_thread_started':
            await handleThreadStarted(innerEvent);
            break;

          case 'message':
            await handleMessage(innerEvent);
            break;

          case 'app_mention':
            await handleAppMention(innerEvent);
            break;

          default:
            logger.info('Unhandled Slack event:', { event });
        }
        break;

      default:
        logger.info('Unknown event type:', { type: event.type });
        res.sendStatus(200);
    }
  } catch (error) {
    logger.error('Error processing Slack event:', error);
    // Only send error response if we haven't sent a response yet
    if (!res.headersSent) {
      res.sendStatus(500);
    }
  }
}; 
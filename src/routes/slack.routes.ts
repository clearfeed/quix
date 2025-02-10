import { Router } from 'express';
import { slackEventsHandler } from '../handlers/slack-events';
import { exposeRawBody, verifySlackRequest, parseVerifiedJson } from '../middleware/slack.middleware';

const router = Router();

// Apply middlewares in order:
// 1. Expose raw body for verification
// 2. Verify Slack request signature
// 3. Parse verified JSON body
// 4. Handle the event
router.post('/events',
  exposeRawBody,
  verifySlackRequest,
  parseVerifiedJson,
  slackEventsHandler
);

export default router; 
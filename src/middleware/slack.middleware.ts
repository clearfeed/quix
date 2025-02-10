import { RequestHandler } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import logger from '../utils/logger';
import config from '../config';

// Middleware to expose raw body for Slack verification
export const exposeRawBody: RequestHandler = (req, res, next) => {
  const chunks: Buffer[] = [];
  req.on('data', chunk => {
    chunks.push(chunk);
  });
  req.on('end', () => {
    const rawBody = Buffer.concat(chunks).toString();
    (req as any).rawBody = rawBody;
    next();
  });
};

// Verify request is from Slack
// https://api.slack.com/authentication/verifying-requests-from-slack
export const verifySlackRequest: RequestHandler = (req, res, next) => {
  const signature = req.headers['x-slack-signature'];
  const timestamp = req.headers['x-slack-request-timestamp'];

  if (!signature || !timestamp) {
    logger.warn('Missing Slack signature headers');
    res.sendStatus(401);
    return;
  }

  // Verify timestamp is recent to prevent replay attacks
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - Number(timestamp)) > 300) {
    logger.warn('Slack request timestamp too old');
    res.sendStatus(401);
    return;
  }

  if (!config.slack.signingSecret) {
    logger.error('Slack signing secret not configured');
    res.sendStatus(500);
    return;
  }

  const rawBody = (req as any).rawBody;
  if (!rawBody) {
    logger.error('Raw body not exposed');
    res.sendStatus(500);
    return;
  }

  const sigBasestring = `v0:${timestamp}:${rawBody}`;
  const mySignature = `v0=${createHmac('sha256', config.slack.signingSecret)
    .update(sigBasestring)
    .digest('hex')}`;

  try {
    if (timingSafeEqual(Buffer.from(mySignature), Buffer.from(signature as string))) {
      next();
    } else {
      logger.warn('Invalid Slack signature');
      res.sendStatus(401);
    }
  } catch (error) {
    logger.error('Error verifying Slack signature:', error);
    res.sendStatus(500);
  }
};

// Parse JSON body after verification
export const parseVerifiedJson: RequestHandler = (req, res, next) => {
  try {
    const rawBody = (req as any).rawBody;
    if (rawBody) {
      req.body = JSON.parse(rawBody);
    }
    next();
  } catch (error) {
    logger.error('Error parsing JSON body:', error);
    res.sendStatus(400);
  }
}; 
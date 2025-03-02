import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SlackMiddleware implements NestMiddleware {
  private readonly signingSecret: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.signingSecret = configService.get('SLACK_SIGNING_SECRET');
  }

  use(req: Request, res: Response, next: NextFunction) {
    // The raw body is now available as req.body from the express.raw middleware
    const rawBody = req.body ? Buffer.isBuffer(req.body) ? req.body.toString() : JSON.stringify(req.body) : '';

    // Store the raw body for later use if needed
    (req as any).rawBody = rawBody;

    // Verify the request is from Slack
    this.verifySlackRequest(req, res, next, rawBody);
  }

  private verifySlackRequest(req: Request, res: Response, next: NextFunction, rawBody: string) {
    const signature = req.headers['x-slack-signature'];
    const timestamp = req.headers['x-slack-request-timestamp'];

    if (!signature || !timestamp) {
      console.warn('Missing Slack signature headers');
      res.status(401).send();
      return;
    }

    // Verify timestamp is recent to prevent replay attacks
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - Number(timestamp)) > 300) {
      console.warn('Slack request timestamp too old');
      res.status(401).send();
      return;
    }

    if (!this.signingSecret) {
      console.error('Slack signing secret not configured');
      res.status(500).send();
      return;
    }

    if (!rawBody) {
      console.error('Raw body not exposed');
      res.status(500).send();
      return;
    }

    const sigBasestring = `v0:${timestamp}:${rawBody}`;
    const mySignature = `v0=${createHmac('sha256', this.signingSecret)
      .update(sigBasestring)
      .digest('hex')}`;

    try {
      if (timingSafeEqual(Buffer.from(mySignature), Buffer.from(signature as string))) {
        // If JSON content, parse it
        if (req.headers['content-type']?.includes('application/json')) {
          req.body = JSON.parse(rawBody);
        }
        next();
      } else {
        // next();
        console.warn('Invalid Slack signature', req.body);
        res.status(401).send();
      }
    } catch (error) {
      console.error('Error verifying Slack signature:', error);
      res.status(500).send();
    }
  }
}

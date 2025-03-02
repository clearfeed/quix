import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createHmac } from 'crypto';
import tsscmp from 'tsscmp';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SlackMiddleware implements NestMiddleware {
  private readonly signingSecret: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.signingSecret = this.configService.get('SLACK_SIGNING_SECRET');
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
    if (!this.signingSecret) return false;
    if (!req.headers['x-slack-signature'] || !req.headers['x-slack-request-timestamp']) return false;
    // Grab the signature and timestamp from the headers
    const requestSignature = req.headers['x-slack-signature'] as string;
    const requestTimestamp = req.headers['x-slack-request-timestamp'];

    // Create the HMAC
    const hmac = createHmac('sha256', this.signingSecret);

    // Update it with the Slack Request
    const [version, hash] = requestSignature.split('=');
    const base = `${version}:${requestTimestamp}:${rawBody}`;
    hmac.update(base);
    if (tsscmp(hash, hmac.digest('hex'))) {
      next();
    } else {
      res.status(401).send('Unauthorized');
    }
  }
}

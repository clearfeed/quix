import { Request } from 'express';
import { createHmac } from 'crypto';
import tsscmp = require('tsscmp');
import { RawBodyRequest } from '@nestjs/common';
export const verifySlackSignature = (req: RawBodyRequest<Request>, secret: string | undefined) => {
  try {
    if (!secret) return false;
    if (!req.headers['x-slack-signature'] || !req.headers['x-slack-request-timestamp'])
      return false;
    // Grab the signature and timestamp from the headers
    const requestSignature = req.headers['x-slack-signature'] as string;
    const requestTimestamp = req.headers['x-slack-request-timestamp'];

    // Create the HMAC
    const hmac = createHmac('sha256', secret);

    // Update it with the Slack Request
    const [version, hash] = requestSignature.split('=');
    const base = `${version}:${requestTimestamp}:${req.rawBody}`;
    hmac.update(base);

    if (tsscmp(hash, hmac.digest('hex'))) {
      return true;
    } else {
      console.log('Slack signature verification failed');
      return false;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
};

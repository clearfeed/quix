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

    // Reject stale or replayed requests: Slack requires the request timestamp to
    // be recent (within 5 minutes) before the signature is trusted.
    const timestampSeconds = Number(requestTimestamp);
    if (
      !Number.isFinite(timestampSeconds) ||
      Math.abs(Date.now() / 1000 - timestampSeconds) > 60 * 5
    ) {
      return false;
    }

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

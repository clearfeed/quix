import { createHmac } from 'crypto';
import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { verifySlackSignature } from './verifySlackSignature';

const SECRET = 'test-signing-secret';
const RAW_BODY = 'payload=%7B%22type%22%3A%22block_actions%22%7D';

const sign = (timestamp: string, rawBody: string): string => {
  const hash = createHmac('sha256', SECRET).update(`v0:${timestamp}:${rawBody}`).digest('hex');
  return `v0=${hash}`;
};

const makeReq = (opts: {
  timestamp: string;
  signature: string;
  rawBody?: string;
}): RawBodyRequest<Request> =>
  ({
    headers: {
      'x-slack-signature': opts.signature,
      'x-slack-request-timestamp': opts.timestamp
    },
    rawBody: Buffer.from(opts.rawBody ?? RAW_BODY)
  }) as unknown as RawBodyRequest<Request>;

const nowSeconds = () => Math.floor(Date.now() / 1000);

describe('verifySlackSignature', () => {
  it('accepts a valid signature with a fresh timestamp', () => {
    const ts = nowSeconds().toString();
    const req = makeReq({ timestamp: ts, signature: sign(ts, RAW_BODY) });

    expect(verifySlackSignature(req, SECRET)).toBe(true);
  });

  it('rejects a replayed request whose timestamp is older than 5 minutes', () => {
    const ts = (nowSeconds() - 60 * 6).toString();
    // The signature itself is valid for this (stale) timestamp; only the
    // freshness check should reject it, guarding against replay attacks.
    const req = makeReq({ timestamp: ts, signature: sign(ts, RAW_BODY) });

    expect(verifySlackSignature(req, SECRET)).toBe(false);
  });

  it('rejects a request with a tampered signature', () => {
    const ts = nowSeconds().toString();
    const req = makeReq({ timestamp: ts, signature: 'v0=deadbeef' });

    expect(verifySlackSignature(req, SECRET)).toBe(false);
  });

  it('rejects when the request body differs from the signed body', () => {
    const ts = nowSeconds().toString();
    const req = makeReq({
      timestamp: ts,
      signature: sign(ts, RAW_BODY),
      rawBody: 'payload=%7B%22type%22%3A%22tampered%22%7D'
    });

    expect(verifySlackSignature(req, SECRET)).toBe(false);
  });

  it('rejects when the signing secret is missing', () => {
    const ts = nowSeconds().toString();
    const req = makeReq({ timestamp: ts, signature: sign(ts, RAW_BODY) });

    expect(verifySlackSignature(req, undefined)).toBe(false);
  });

  it('rejects when the Slack headers are absent', () => {
    const req = { headers: {}, rawBody: Buffer.from(RAW_BODY) } as unknown as RawBodyRequest<Request>;

    expect(verifySlackSignature(req, SECRET)).toBe(false);
  });
});

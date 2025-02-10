import { Response } from 'express';
import { SlackChallengeEvent } from './types';

export const handleUrlVerification = (event: SlackChallengeEvent, res: Response) => {
  res.json({ challenge: event.challenge });
}; 
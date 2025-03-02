import { SlackMiddleware } from './slack.middleware';

describe('SlackMiddleware', () => {
  it('should be defined', () => {
    expect(new SlackMiddleware()).toBeDefined();
  });
});

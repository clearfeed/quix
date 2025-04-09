import { BaseConfig } from '@clearfeed-ai/quix-common-agent';

export * from './schema';

export interface SlackConfig extends BaseConfig {
  token: string;
  teamId: string;
}

import { BaseConfig } from '@clearfeed-ai/quix-common-agent';

export interface NotionConfig extends BaseConfig {
  token: string;
}

export * from './args';
export * from './responses';

import { BaseConfig } from '@clearfeed-ai/quix-common-agent';

export type JiraAuth =
  | {
      username: string;
      password: string;
    }
  | {
      bearerToken: string;
    }
  | {
      sharedSecret: string;
      atlassianConnectAppKey: string;
    };

export interface JiraConfig extends BaseConfig {
  host: string;
  defaultConfig?: {
    projectKey?: string;
  };
  auth: JiraAuth;
  apiHost?: string;
}

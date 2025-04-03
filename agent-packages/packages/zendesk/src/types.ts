import { BaseConfig, BaseResponse } from '@clearfeed-ai/quix-common-agent';

export type ZendeskAuth =
  | {
    token: string;
    username: string;
  }
  | {
    oauthToken: string;
  };

export interface ZendeskConfig extends BaseConfig {
  subdomain: string;
  auth: ZendeskAuth;
}

export interface GetTicketParams {
  ticketId: number;
}

export interface SearchTicketsParams {
  query: string;
  limit: number;
}

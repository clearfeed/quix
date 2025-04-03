import { BaseConfig, BaseResponse } from '@clearfeed-ai/quix-common-agent';
import { Ticket } from 'node-zendesk/dist/types/clients/core/tickets';

export type ZendeskAuth = {
  token: string;
  username: string;
} | {
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
  limit?: number;
}

export interface GetTicketWithRepliesParams {
  ticketId: number;
}

export interface TicketWithReplies {
  ticket: Ticket;
  comments: any[];
}

export type GetTicketWithRepliesResponse = BaseResponse<TicketWithReplies>;
export type GetTicketResponse = BaseResponse<Ticket>;
export type SearchTicketsResponse = BaseResponse<Ticket[]>; 
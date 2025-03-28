import { BaseConfig, BaseResponse } from '@clearfeed-ai/quix-common-agent';
import { Ticket } from 'node-zendesk/dist/types/clients/core/tickets';

export interface ZendeskConfig extends BaseConfig {
  subdomain: string;
  token: string;
  username: string;
}

export interface GetTicketParams {
  ticketId: number;
}

export interface SearchTicketsParams {
  query: string;
  limit?: number;
}

export type GetTicketResponse = BaseResponse<Ticket>;
export type SearchTicketsResponse = BaseResponse<Ticket[]>; 
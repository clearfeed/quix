import { BaseConfig } from '@clearfeed-ai/quix-common-agent';
import { Ticket, TicketComment } from 'node-zendesk/dist/types/clients/core/tickets';

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

// Handler param types
export interface GetTicketParams {
  ticketId: number;
}
export interface SearchTicketsParams {
  query: string;
  limit: number;
}
export interface GetTicketWithRepliesParams {
  ticketId: number;
}
export interface AddInternalCommentParams {
  ticketId: number;
  comment: string;
}

// Handle Return types
export type TicketWithRepliesResponse = {
  ticket: Ticket;
  comments: TicketComment[];
}
export type AddInternalCommentResponse = {
  ticket: Ticket;
  comment: string;
}; 

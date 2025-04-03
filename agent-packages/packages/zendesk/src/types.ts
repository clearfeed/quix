import { BaseConfig, BaseResponse } from '@clearfeed-ai/quix-common-agent';
import { Ticket, TicketComment } from 'node-zendesk/dist/types/clients/core/tickets';

// Authentication types
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

// Handle param types
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
export interface AddInternalCommentParams {
  ticketId: number;
  comment: string;
}

// Handle Return types
export type TicketWithRepliesResponse = {
  ticket: Ticket;
  comments: TicketComment[];
}
export type GetTicketResponse = BaseResponse<Ticket>;
export type SearchTicketsResponse = BaseResponse<Ticket[]>;
export type AddInternalCommentResponse = BaseResponse<{
  ticketId: number;
  comment: string;
}>; 
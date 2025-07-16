import { BaseConfig, BaseResponse } from '@clearfeed-ai/quix-common-agent';
import { Ticket } from 'node-zendesk/dist/types/clients/core/tickets';

export interface ZendeskConfig extends BaseConfig {
  subdomain: string;
  email: string;
  token: string;
}

export interface GetTicketParams {
  ticketId: number;
}

export interface SearchTicketsParams {
  query: string;
  limit?: number;
}

export interface GetTicketWithCommentsParams {
  ticketId: number;
}

export interface AddInternalCommentParams {
  ticketId: number;
  comment: string;
}

export interface AddInternalNoteParams {
  ticketId: number;
  note: string;
}

export interface GetCommentsParams {
  ticketId: number;
  public?: boolean;
}

export interface CreateTicketParams {
  subject: string;
  description: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  type?: 'problem' | 'incident' | 'question' | 'task';
  status?: 'new' | 'open' | 'pending' | 'hold' | 'solved' | 'closed';
  assigneeId?: number;
  requesterId?: number;
  tags?: string[];
}

export type GetTicketResponse = BaseResponse<Ticket>;
export type SearchTicketsResponse = BaseResponse<Ticket[]>; 
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
export interface GetTicketWithCommentsParams {
  ticketId: number;
}

export interface AddCommentParams {
  ticketId: number;
  comment: string;
  public: boolean;
}
export interface AddInternalNoteParams {
  ticketId: number;
  note: string;
}
export interface GetCommentsParams {
  ticketId: number;
  public: boolean;
}
export interface GetInternalNotesParams {
  ticketId: number;
}
export interface AddInternalCommentParams {
  ticketId: number;
  comment: string;
}

// Handler Return types
export type TicketWithCommentsResponse = {
  ticket: Ticket;
  comments: TicketComment[];
};
export type AddCommentResponse = {
  ticket: Ticket;
  comment: string;
};
export type AddInternalNoteResponse = {
  ticket: Ticket;
  note: string;
};
export type GetInternalNotesResponse = {
  id: number;
  type: 'internal_note';
  body: string;
  created_at: string;
  author_id: number;
}[];

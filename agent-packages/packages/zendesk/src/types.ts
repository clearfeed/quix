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
  defaultConfig?: {
    /**
     * If this is included, it will be added at the end of ticket descriptions.
     * This is useful for adding more context to the tickets created by the agent.
     */
    additionalDescription?: string;
  };
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
export interface CreateTicketParams {
  subject: string;
  description: string;
  requesterEmail?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  assigneeId?: number;
  tags?: string[];
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
export interface CreateTicketResponse {
  ticket: Ticket;
}

// Payload types
export type TicketPayload = {
  subject: string;
  comment: {
    body: string;
  };
  requester?: {
    email: string;
  };
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  assignee_id?: number;
  tags?: string[];
};

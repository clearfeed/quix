import { createClient } from 'node-zendesk';
import {
  ZendeskConfig,
  GetTicketParams,
  SearchTicketsParams,
  GetTicketWithRepliesParams,
  AddInternalNoteParams,
  GetInternalNotesResponse,
  GetInternalNotesParams,
  AddInternalNoteResponse,
  AddInternalCommentParams,
  AddInternalCommentResponse,
  TicketWithRepliesResponse
} from './types';
import { BaseService, BaseResponse } from '@clearfeed-ai/quix-common-agent';
import { TicketComment } from 'node-zendesk/dist/types/clients/core/tickets';
import { Ticket } from 'node-zendesk/dist/types/clients/core/tickets';

export * from './tools';
export * from './types';

export class ZendeskService implements BaseService<ZendeskConfig> {
  private client;

  constructor(private config: ZendeskConfig) {
    if ('oauthToken' in config.auth) {
      this.client = createClient({
        subdomain: config.subdomain,
        oauth: true,
        token: config.auth.oauthToken
      });
    } else {
      this.client = createClient({
        subdomain: config.subdomain,
        token: config.auth.token,
        username: config.auth.username
      });
    }
  }

  validateConfig(
    config?: Record<string, any>
  ): { isValid: boolean; error?: string } & Record<string, any> {
    return { isValid: true };
  }

  async searchTickets(params: SearchTicketsParams): Promise<BaseResponse<Ticket[]>> {
    try {
      const response = await this.client.search.query(`type:ticket ${params.query}`);
      const tickets: Ticket[] = Array.isArray(response.result)
        ? response.result.slice(0, params.limit)
        : [];
      return {
        success: true,
        data: tickets.map(this.processTicketObjectForResponse)
      };
    } catch (error: any) {
      console.error('Zendesk search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search tickets'
      };
    }
  }

  async getTicket(params: GetTicketParams): Promise<BaseResponse<Ticket>> {
    try {
      const response = await this.client.tickets.show(params.ticketId);
      const ticket: Ticket = response.result;
      return {
        success: true,
        data: this.processTicketObjectForResponse(ticket)
      };
    } catch (error: any) {
      console.error('Zendesk get ticket error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch ticket'
      };
    }
  }

  async getTicketWithReplies(params: GetTicketWithRepliesParams): Promise<BaseResponse<TicketWithRepliesResponse>> {
    try {
      const [ticketResponse, commentsResponse] = await Promise.all([
        this.client.tickets.show(params.ticketId),
        this.client.tickets.getComments(params.ticketId)
      ]);
      const ticket: Ticket = ticketResponse.result;
      return {
        success: true,
        data: {
          ticket: this.processTicketObjectForResponse(ticket),
          comments: commentsResponse || []
        }
      };
    } catch (error: any) {
      console.error('Zendesk get ticket with replies error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch ticket with replies'
      };
    }
  }

  async addInternalNote(params: AddInternalNoteParams): Promise<BaseResponse<AddInternalNoteResponse>> {
    try {
      const response = await this.client.tickets.update(params.ticketId, {
        ticket: {
          comment: {
            body: params.note,
            public: false
          }
        }
      });
      const ticket: Ticket = response.result;
      return {
        success: true,
        data: {
          ticket: this.processTicketObjectForResponse(ticket),
          note: params.note
        }
      };
    } catch (error: any) {
      console.error('Zendesk add internal note error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add internal note'
      };
    }
  }

  async addInternalComment(params: AddInternalCommentParams): Promise<BaseResponse<AddInternalCommentResponse>> {
    try {
      const response = await this.client.tickets.update(params.ticketId, {
        ticket: {
          comment: {
            body: params.comment,
            public: true
          }
        }
      });
      const ticket: Ticket = response.result;
      return {
        success: true,
        data: {
          ticket: this.processTicketObjectForResponse(ticket),
          comment: params.comment,
        }
      };
    } catch (error: any) {
      console.error('Zendesk add internal comment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add internal comment'
      };
    }
  }

  async getInternalNotes(params: GetInternalNotesParams): Promise<BaseResponse<GetInternalNotesResponse>> {
    try {
      const response = await this.client.tickets.getComments(params.ticketId);
      const internalNotes = response
        .filter((comment: TicketComment) => !comment.public)
        .map((comment: TicketComment) => ({
          id: comment.id,
          type: 'internal_note' as const,
          body: comment.body,
          created_at: comment.created_at,
          author_id: comment.author_id
        }));

      return {
        success: true,
        data: internalNotes
      };
    } catch (error: any) {
      console.error('Zendesk get internal notes error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch internal notes'
      };
    }
  }
  private processTicketObjectForResponse(ticket: Ticket): Ticket {
    ticket.url = `https://${this.config.subdomain}.zendesk.com/agent/tickets/${ticket.id}`;
    return ticket;
  }
}

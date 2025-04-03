import { createClient } from 'node-zendesk';
import {
  ZendeskConfig,
  GetTicketParams,
  SearchTicketsParams,
  GetTicketResponse,
  SearchTicketsResponse,
  GetTicketWithRepliesParams,
  TicketWithReplies,
  AddInternalNoteParams,
  InternalNote,
  GetInternalNotesParams,
  AddInternalCommentParams,
  AddInternalCommentResponse,
  AddInternalNoteResponse
} from './types';
import { BaseService, BaseResponse } from '@clearfeed-ai/quix-common-agent';
import _ from 'lodash';
import { TicketComment } from 'node-zendesk/dist/types/clients/core/tickets';

export * from './tools';
export * from './types';

export class ZendeskService implements BaseService<ZendeskConfig> {
  private client;

  constructor(private config: ZendeskConfig) {
    this.client = createClient({
      subdomain: config.subdomain,
      token: config.auth.token,
      username: config.auth.username
    });
    if (!config.subdomain || !config.auth.token || !config.auth.username) {
      throw new Error('Zendesk integration is not configured. Please pass in a token.');
    }
  }

  validateConfig(config?: Record<string, any>): { isValid: boolean; error?: string; } & Record<string, any> {
    const ticketId = config?.ticketId;
    if (!ticketId) {
      return {
        isValid: false,
        error: 'Ticket must be provided'
      }
    }
    return { isValid: true, ticketId }
  }

  async searchTickets(params: SearchTicketsParams): Promise<BaseResponse<SearchTicketsResponse['data']>> {
    try {
      _.every(['query'], (field) => _.has(params, field));
      const response = await this.client.search.query(`type:ticket ${params.query}`);
      const tickets = Array.isArray(response.result) ? response.result.slice(0, params.limit || 10) : [];
      return {
        success: true,
        data: tickets
      };
    } catch (error: any) {
      console.error('Zendesk search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search tickets'
      };
    }
  }

  async getTicket(params: GetTicketParams): Promise<BaseResponse<GetTicketResponse['data']>> {
    try {
      _.every(['ticketId'], (field) => _.has(params, field));
      const response = await this.client.tickets.show(params.ticketId);
      return {
        success: true,
        data: response.result
      };
    } catch (error: any) {
      console.error('Zendesk get ticket error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch ticket'
      };
    }
  }

  async getTicketWithReplies(params: GetTicketWithRepliesParams): Promise<BaseResponse<TicketWithReplies>> {
    try {
      _.every(['ticketId'], (field) => _.has(params, field));

      const [ticketResponse, commentsResponse] = await Promise.all([
        this.client.tickets.show(params.ticketId),
        this.client.tickets.getComments(params.ticketId)
      ]);

      return {
        success: true,
        data: {
          ticket: ticketResponse.result,
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
      _.every(['ticketId', 'note'], (field) => _.has(params, field));

      const response = await this.client.tickets.update(params.ticketId, {
        ticket: {
          comment: {
            body: params.note,
            public: false
          }
        }
      });

      return {
        success: true,
        data: {
          ticketId: params.ticketId,
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

  async addInternalComment(params: AddInternalCommentParams): Promise<BaseResponse<AddInternalCommentResponse['data']>> {
    try {
      _.every(['ticketId', 'comment'], (field) => _.has(params, field));

      const response = await this.client.tickets.update(params.ticketId, {
        ticket: {
          comment: {
            body: params.comment,
            public: true
          }
        }
      });

      return {
        success: true,
        data: {
          ticketId: params.ticketId,
          commentId: response.result.id
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

  async getInternalNotes(params: GetInternalNotesParams): Promise<BaseResponse<InternalNote[]>> {
    try {
      _.every(['ticketId'], (field) => _.has(params, field));

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
}

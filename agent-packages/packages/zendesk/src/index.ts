import { createClient } from 'node-zendesk';
import {
  ZendeskConfig,
  GetTicketParams,
  SearchTicketsParams,
  GetTicketWithCommentsParams,
  AddInternalNoteResponse,
  AddCommentResponse,
  AddCommentParams,
  GetCommentsParams,
  TicketWithCommentsResponse
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

  async getTicketWithComments(
    params: GetTicketWithCommentsParams
  ): Promise<BaseResponse<TicketWithCommentsResponse>> {
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

  async addComment(
    params: Extract<AddCommentParams, { public: false }>
  ): Promise<BaseResponse<AddInternalNoteResponse>>;
  async addComment(
    params: Extract<AddCommentParams, { public: true }>
  ): Promise<BaseResponse<AddCommentResponse>>;
  async addComment(
    params: AddCommentParams
  ): Promise<BaseResponse<AddInternalNoteResponse | AddCommentResponse>>;
  async addComment(
    params: AddCommentParams
  ): Promise<BaseResponse<AddInternalNoteResponse | AddCommentResponse>> {
    try {
      const response = await this.client.tickets.update(params.ticketId, {
        ticket: {
          comment: {
            body: params.comment,
            public: params.public
          }
        }
      });
      const ticket: Ticket = response.result;
      return {
        success: true,
        data: {
          ticket: this.processTicketObjectForResponse(ticket),
          ...(params.public ? { note: params.comment } : { comment: params.comment })
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

  async getComments(params: GetCommentsParams): Promise<BaseResponse<TicketComment[]>> {
    try {
      const response: TicketComment[] = await this.client.tickets.getComments(params.ticketId);

      const comments = response.filter(
        (comment: TicketComment) => comment.public === params.public
      );

      return {
        success: true,
        data: comments
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

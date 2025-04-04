import { createClient } from 'node-zendesk';
import {
  ZendeskConfig,
  GetTicketParams,
  SearchTicketsParams,
  GetTicketWithRepliesParams,
  TicketWithRepliesResponse
} from './types';
import { BaseService, BaseResponse } from '@clearfeed-ai/quix-common-agent';
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

  private processTicketObjectForResponse(ticket: Ticket): Ticket {
    ticket.url = `https://${this.config.subdomain}.zendesk.com/agent/tickets/${ticket.id}`;
    return ticket;
  }
}

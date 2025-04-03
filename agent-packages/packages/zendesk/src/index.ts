import { createClient } from 'node-zendesk';
import {
  ZendeskConfig,
  GetTicketParams,
  SearchTicketsParams,
  GetTicketResponse,
  SearchTicketsResponse,
  GetTicketWithRepliesParams,
  TicketWithReplies
} from './types';
import { BaseService, BaseResponse } from '@clearfeed-ai/quix-common-agent';

export * from './tools';
export * from './types';

export class ZendeskService implements BaseService<ZendeskConfig> {
  private client;

  constructor(private config: ZendeskConfig) {
    if ('oauthToken' in config.auth) {
      this.client = createClient({
        subdomain: config.subdomain,
        oauth: true,
        token: config.auth.oauthToken,
      });
    } else {
      this.client = createClient({
        subdomain: config.subdomain,
        token: config.auth.token,
        username: config.auth.username,
      });
    }
  }

  validateConfig(config?: Record<string, any>): { isValid: boolean; error?: string; } & Record<string, any> {
    return { isValid: true }
  }

  async searchTickets(params: SearchTicketsParams): Promise<BaseResponse<SearchTicketsResponse['data']>> {
    try {
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
}
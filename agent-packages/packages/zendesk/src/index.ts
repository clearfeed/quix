import { createClient } from 'node-zendesk';
import {
  ZendeskConfig,
  GetTicketParams,
  SearchTicketsParams,
  GetTicketResponse,
  SearchTicketsResponse
} from './types';
import { BaseService, BaseResponse } from '@clearfeed-ai/quix-common-agent';
import { validateRequiredFields } from './utils';

export * from './tools';
export * from './types';

export class ZendeskService implements BaseService<ZendeskConfig> {
  private client;

  constructor(private config: ZendeskConfig) {
    this.client = createClient({
      subdomain: config.subdomain,
      token: config.token,
      username: config.username
    });
    if (!config.subdomain || !config.token || !config.username) {
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
      validateRequiredFields({
        params,
        requiredFields: ['query']
      })
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
        error: error.message || 'Failed to search tickets'
      };
    }
  }

  async getTicket(params: GetTicketParams): Promise<BaseResponse<GetTicketResponse['data']>> {
    try {
      validateRequiredFields({
        params,
        requiredFields: ['ticketId']
      })
      const response = await this.client.tickets.show(params.ticketId);
      return {
        success: true,
        data: response.result
      };
    } catch (error: any) {
      console.error('Zendesk get ticket error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch ticket'
      };
    }
  }
}
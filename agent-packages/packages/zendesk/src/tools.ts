import { createClient } from 'node-zendesk';
import { Tools, Tool } from '@clearfeed-ai/quix-common-agent';
import {
  GetTicketParams,
  SearchTicketsParams,
  ZendeskConfig,
  GetTicketResponse,
  SearchTicketsResponse
} from './types';

export interface ZendeskTools extends Tools {
  getTicket: Tool<GetTicketParams, GetTicketResponse>;
  searchTickets: Tool<SearchTicketsParams, SearchTicketsResponse>;
}

export function createZendeskTools(config: ZendeskConfig): ZendeskTools {
  const client = createClient({
    username: config.email,
    token: config.token,
    subdomain: config.subdomain
  });

  const tools: ZendeskTools = {
    getTicket: {
      type: 'function',
      function: {
        name: 'get_zendesk_ticket',
        description: 'Retrieve a specific Zendesk ticket by ID',
        parameters: {
          type: 'object',
          properties: {
            ticketId: {
              type: 'number',
              description: 'The ID of the ticket to retrieve'
            }
          },
          required: ['ticketId']
        }
      },
      handler: async (params: GetTicketParams): Promise<GetTicketResponse> => {
        try {
          const response = await client.tickets.show(params.ticketId);
          return {
            success: true,
            data: response.result
          };
        } catch (error: any) {
          return {
            success: false,
            error: `Failed to get ticket: ${error.message}`
          };
        }
      }
    },
    searchTickets: {
      type: 'function',
      function: {
        name: 'search_zendesk_tickets',
        description: 'Search Zendesk tickets using a query string',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of tickets to return'
            }
          },
          required: ['query']
        }
      },
      handler: async (params: SearchTicketsParams): Promise<SearchTicketsResponse> => {
        try {
          const searchQuery = params.query;
          const limit = params.limit || 10;

          const response = await client.search.query(`type:ticket ${searchQuery}`);

          const tickets = Array.isArray(response.result) ? response.result.slice(0, limit) : [];
          return {
            success: true,
            data: tickets
          };
        } catch (error: any) {
          return {
            success: false,
            error: `Failed to search tickets: ${error.message}`
          };
        }
      }
    }
  };

  return tools;
}

export function createZendeskToolsExport(config: ZendeskConfig) {
  const tools = createZendeskTools(config);
  return { tools: Object.values(tools), handlers: Object.fromEntries(Object.entries(tools).map(([_, tool]) => [tool.function.name, tool.handler])) };
} 
import { createClient } from 'node-zendesk';
import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import {
  GetTicketParams,
  SearchTicketsParams,
  ZendeskConfig,
  GetTicketResponse,
  SearchTicketsResponse
} from './types';

const ZENDESK_TOOL_SELECTION_PROMPT = `
For Zendesk-related queries, consider using Zendesk tools when the user wants to:
- Search for tickets or customer support issues
- View ticket status and details
- Create new support tickets
- Update ticket information
- Access customer support history
`;

const ZENDESK_RESPONSE_GENERATION_PROMPT = `
When formatting Zendesk responses:
- Always include ticket numbers/IDs
- Format ticket status and priority in bold
- Include relevant customer information
- Show ticket creation and update times in human-readable format
- Format ticket descriptions maintaining proper markdown
- List assignees and requesters clearly
`;

export function createZendeskToolsExport(config: ZendeskConfig): ToolConfig {
  const client = createClient({
    username: config.email,
    token: config.token,
    subdomain: config.subdomain
  });

  const tools: ToolConfig['tools'] = [
    {
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
      }
    },
    {
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
      }
    }
  ];

  const handlers = {
    search_zendesk_tickets: async (params: SearchTicketsParams): Promise<SearchTicketsResponse> => {
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
    },
    get_zendesk_ticket: async (params: GetTicketParams): Promise<GetTicketResponse> => {
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
  };

  return {
    tools,
    handlers,
    prompts: {
      toolSelection: ZENDESK_TOOL_SELECTION_PROMPT,
      responseGeneration: ZENDESK_RESPONSE_GENERATION_PROMPT
    }
  };
} 
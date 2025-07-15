import { createClient } from 'node-zendesk';
import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { ZendeskConfig } from './types';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

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

const searchTicketsSchema = z.object({
  query: z.string().describe('The search query'),
  limit: z.number().describe('Maximum number of tickets to return').optional()
});

const getTicketSchema = z.object({
  ticketId: z.number().describe('The ID of the ticket to retrieve')
});

export function createZendeskToolsExport(config: ZendeskConfig): ToolConfig {
  const client = createClient({
    username: config.email,
    token: config.token,
    subdomain: config.subdomain
  });

  const tools: DynamicStructuredTool<any>[] = [
    new DynamicStructuredTool({
      name: 'search_zendesk_tickets',
      description: 'Search Zendesk tickets using a query string',
      schema: searchTicketsSchema,
      func: async (args: z.infer<typeof searchTicketsSchema>) => {
        try {
          const searchQuery = args.query;
          const limit = args.limit || 10;
  
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
    }),
    new DynamicStructuredTool({
      name: 'get_zendesk_ticket',
      description: 'Retrieve a specific Zendesk ticket by ID',
      schema: getTicketSchema,
      func: async (args: z.infer<typeof getTicketSchema>) => {
        try {
          const response = await client.tickets.show(args.ticketId);
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
    })
  ];

  return {
    tools,
    prompts: {
      toolSelection: ZENDESK_TOOL_SELECTION_PROMPT,
      responseGeneration: ZENDESK_RESPONSE_GENERATION_PROMPT
    }
  };
} 
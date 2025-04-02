import {
  ZendeskConfig,
  SearchTicketsParams,
  GetTicketParams,
  GetTicketWithRepliesParams,
  AddInternalCommentParams
} from './types';
import { ZendeskService } from './index';
import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
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

export function createZendeskToolsExport(config: ZendeskConfig): ToolConfig {
  const service = new ZendeskService(config);

  const tools: DynamicStructuredTool<any>[] = [
    new DynamicStructuredTool({
      name: 'search_zendesk_tickets',
      description: 'Search Zendesk tickets using a query string',
      schema: z.object({
        query: z.string().describe('Search keywords or phrases to filter Zendesk tickets by title, description, or metadata'),
        limit: z.number().optional().describe('Optional limit on the number of tickets to return (default: 10)')
      }),
      func: async (args: SearchTicketsParams) => service.searchTickets(args)
    }),
    new DynamicStructuredTool({
      name: 'get_zendesk_ticket',
      description: 'Retrieve a specific Zendesk ticket by ID',
      schema: z.object({
        ticketId: z.number().describe('The unique ID of the Zendesk ticket to retrieve')
      }),
      func: async (args: GetTicketParams) => service.getTicket(args)
    }),
    new DynamicStructuredTool({
      name: 'get_zendesk_ticket_with_replies',
      description: 'Retrieve a specific Zendesk ticket along with its replies and comments',
      schema: z.object({
        ticketId: z.number().describe('The unique ID of the Zendesk ticket to retrieve along with its replies')
      }),
      func: async (args: GetTicketWithRepliesParams) => service.getTicketWithReplies(args)
    }),
    new DynamicStructuredTool({
      name: 'add_zendesk_internal_comment',
      description: 'Add an internal comment (private note) to a Zendesk ticket',
      schema: z.object({
        ticketId: z.number().describe('The unique ID of the Zendesk ticket to add the internal comment to'),
        comment: z.string().describe('The internal comment text to add to the ticket')
      }),
      func: async (args: AddInternalCommentParams) => service.addInternalComment(args)
    }),
  ];

  return {
    tools,
    prompts: {
      toolSelection: ZENDESK_TOOL_SELECTION_PROMPT,
      responseGeneration: ZENDESK_RESPONSE_GENERATION_PROMPT
    }
  };
}
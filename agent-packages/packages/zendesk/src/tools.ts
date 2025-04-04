import {
  ZendeskConfig,
  SearchTicketsParams,
  GetTicketParams,
  GetTicketWithCommentsParams,
  AddInternalNoteParams,
  AddInternalCommentParams,
  GetCommentsParams
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
        query: z
          .string()
          .describe(
            'Search keywords or phrases to filter Zendesk tickets by title, description, or metadata'
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .describe('Limit on the number of tickets to return')
          .optional()
          .default(10)
      }),
      func: async (args: SearchTicketsParams) => service.searchTickets(args)
    }),
    new DynamicStructuredTool({
      name: 'get_zendesk_ticket',
      description: 'Retrieve a specific Zendesk ticket by ID',
      schema: z.object({
        ticketId: z.number().int().describe('The ID of the Zendesk ticket to retrieve')
      }),
      func: async (args: GetTicketParams) => service.getTicket(args)
    }),
    new DynamicStructuredTool({
      name: 'get_zendesk_ticket_with_coments',
      description:
        'Retrieve a specific Zendesk ticket along with its public comments and internal notes',
      schema: z.object({
        ticketId: z.number().int().describe('The ID of the Zendesk ticket to retrieve')
      }),
      func: async (args: GetTicketWithCommentsParams) => service.getTicketWithComments(args)
    }),
    new DynamicStructuredTool({
      name: 'add_zendesk_ticket_public_comment',
      description: 'Add a public comment to a Zendesk ticket',
      schema: z.object({
        ticketId: z
          .number()
          .int()
          .describe('The ID of the Zendesk ticket to add the public comment to'),
        comment: z.string().describe('The public comment text to add to the ticket')
      }),
      func: async (args: AddInternalCommentParams) =>
        service.addComment({ public: true, ticketId: args.ticketId, comment: args.comment })
    }),
    new DynamicStructuredTool({
      name: 'add_zendesk_ticket_internal_note',
      description: 'Add an internal note (private comment) to a Zendesk ticket',
      schema: z.object({
        ticketId: z
          .number()
          .int()
          .describe('The ID of the Zendesk ticket to add the internal note (private comment) to'),
        note: z.string().describe('The content of the internal note (private comment) to add')
      }),
      func: async (args: AddInternalNoteParams) =>
        service.addComment({ public: false, ticketId: args.ticketId, comment: args.note })
    }),
    new DynamicStructuredTool({
      name: 'get_zendesk_ticket_internal_notes',
      description: 'Retrieve all internal notes (private comments) from a Zendesk ticket',
      schema: z.object({
        ticketId: z
          .number()
          .int()
          .describe('The ID of the Zendesk ticket to get internal notes (private comments) from')
      }),
      func: async (args: Pick<GetCommentsParams, 'ticketId'>) =>
        service.getComments({ ...args, public: false })
    }),
    new DynamicStructuredTool({
      name: 'get_zendesk_ticket_public_comments',
      description: 'Retrieve all public comments of a Zendesk ticket',
      schema: z.object({
        ticketId: z
          .number()
          .int()
          .describe('The ID of the Zendesk ticket to get public comments from')
      }),
      func: async (args: Pick<GetCommentsParams, 'ticketId'>) =>
        service.getComments({ ...args, public: true })
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

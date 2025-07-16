import {
  ZendeskConfig,
  SearchTicketsParams,
  GetTicketParams,
  GetTicketWithCommentsParams,
  AddInternalCommentParams,
  AddInternalNoteParams,
  GetCommentsParams,
  CreateTicketParams
} from './types';
import { ZendeskService } from './index';
import { ToolConfig, ToolOperation, tool } from '@clearfeed-ai/quix-common-agent';
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

  const tools = [
    tool({
      name: 'search_zendesk_tickets',
      description: 'Search Zendesk tickets using a query string',
      schema: z.object({
        query: z
          .string()
          .describe(
            'The search query to find tickets. You can search by status, priority, assignee, requester, etc.'
          ),
        sort_by: z
          .enum(['created_at', 'updated_at', 'priority', 'status', 'ticket_type'])
          .optional()
          .describe('Field to sort results by'),
        sort_order: z
          .enum(['asc', 'desc'])
          .optional()
          .describe('Sort order for results'),
        limit: z
          .number()
          .min(1)
          .max(100)
          .optional()
          .describe('Maximum number of tickets to return')
          .default(10)
      }),
      operations: [ToolOperation.READ],
      func: async (args: SearchTicketsParams) => service.searchTickets(args)
    }),
    tool({
      name: 'get_zendesk_ticket',
      description: 'Retrieve a Zendesk ticket by its ID',
      schema: z.object({
        ticketId: z.number().int().describe('The ID of the Zendesk ticket to retrieve')
      }),
      operations: [ToolOperation.READ],
      func: async (args: GetTicketParams) => service.getTicket(args)
    }),
    tool({
      name: 'get_zendesk_ticket_with_comments',
      description:
        'Retrieve a Zendesk ticket along with all its public comments and internal notes',
      schema: z.object({
        ticketId: z.number().int().describe('The ID of the Zendesk ticket to retrieve')
      }),
      operations: [ToolOperation.READ],
      func: async (args: GetTicketWithCommentsParams) => service.getTicketWithComments(args)
    }),
    tool({
      name: 'add_zendesk_ticket_public_comment',
      description: 'Add a public comment to a Zendesk ticket',
      schema: z.object({
        ticketId: z
          .number()
          .int()
          .describe('The ID of the Zendesk ticket to add the public comment to'),
        comment: z.string().describe('The content of the public comment to add')
      }),
      operations: [ToolOperation.CREATE],
      func: async (args: AddInternalCommentParams) =>
        service.addComment({ public: true, ticketId: args.ticketId, comment: args.comment })
    }),
    tool({
      name: 'add_zendesk_ticket_internal_note',
      description: 'Add an internal note (private comment) to a Zendesk ticket',
      schema: z.object({
        ticketId: z
          .number()
          .int()
          .describe('The ID of the Zendesk ticket to add the internal note (private comment) to'),
        note: z.string().describe('The content of the internal note (private comment) to add')
      }),
      operations: [ToolOperation.CREATE],
      func: async (args: AddInternalNoteParams) =>
        service.addComment({ public: false, ticketId: args.ticketId, comment: args.note })
    }),
    tool({
      name: 'get_zendesk_ticket_internal_notes',
      description: 'Retrieve all internal notes (private comments) from a Zendesk ticket',
      schema: z.object({
        ticketId: z
          .number()
          .int()
          .describe(
            'The ID of the Zendesk ticket to retrieve internal notes (private comments) from'
          )
      }),
      operations: [ToolOperation.READ],
      func: async (args: Pick<GetCommentsParams, 'ticketId'>) =>
        service.getComments({ ...args, public: false })
    }),
    tool({
      name: 'get_zendesk_ticket_public_comments',
      description: 'Retrieve all public comments from a Zendesk ticket',
      schema: z.object({
        ticketId: z
          .number()
          .int()
          .describe('The ID of the Zendesk ticket to retrieve public comments from')
      }),
      operations: [ToolOperation.READ],
      func: async (args: Pick<GetCommentsParams, 'ticketId'>) =>
        service.getComments({ ...args, public: true })
    }),
    tool({
      name: 'create_zendesk_ticket',
      description: 'Create a new Zendesk ticket with subject, description, and optional properties',
      schema: z.object({
        subject: z.string().describe('The subject/title of the ticket'),
        description: z.string().describe('The description/content of the ticket'),
        priority: z
          .enum(['low', 'normal', 'high', 'urgent'])
          .optional()
          .describe('Priority level of the ticket'),
        type: z
          .enum(['problem', 'incident', 'question', 'task'])
          .optional()
          .describe('Type of the ticket'),
        status: z
          .enum(['new', 'open', 'pending', 'hold', 'solved', 'closed'])
          .optional()
          .describe('Initial status of the ticket'),
        assigneeId: z
          .number()
          .int()
          .optional()
          .describe('ID of the agent to assign the ticket to'),
        requesterId: z
          .number()
          .int()
          .optional()
          .describe('ID of the user requesting support'),
        tags: z
          .array(z.string())
          .optional()
          .transform((val) => val ?? undefined)
          .describe('List of tags to categorize or label the ticket')
      }),
      operations: [ToolOperation.CREATE],
      func: async (args: CreateTicketParams) => service.createTicket(args)
    }),
    tool({
      name: 'search_zendesk_users_by_name',
      description:
        'Search for Zendesk users (agents or end users) by name. Useful for finding assignees or requesters.',
      schema: z.object({
        name: z.string().describe('The name to search for among Zendesk users'),
        role: z
          .enum(['end-user', 'agent', 'admin'])
          .optional()
          .describe(
            'Filter users by role. Use "agent" or "admin" when looking for assignees. Use "end-user" for requesters.'
          )
      }),
      operations: [ToolOperation.READ],
      func: async (args: { name: string; role?: 'end-user' | 'agent' | 'admin' }) =>
        service.searchUsersByName(args.name, args.role)
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
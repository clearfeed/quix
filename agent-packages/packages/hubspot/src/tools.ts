import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { HubspotService } from './index';
import {
  CreateContactParams,
  HubspotConfig,
  CreateDealParams,
  HubspotEntityType,
  UpdateTaskParams,
  TaskSearchParams,
  GetPipelinesParams,
  CreateTicketParams,
  AssociateTicketWithEntityParams,
  UpdateTicketParams,
  TicketSearchParams,
  SearchDealsParams,
  UpdateDealParams,
  CreateTaskParams,
  AssociateTaskWithEntityParams
} from './types';
import { DynamicStructuredTool, tool } from '@langchain/core/tools';
import { z } from 'zod';
import {
  taskUpdateSchema,
  taskSearchSchema,
  baseTicketSchema,
  getPipelinesSchema,
  associateTicketWithEntitySchema,
  ticketUpdateSchema,
  ticketSearchSchema,
  createDealSchema,
  searchDealsSchema,
  updateDealSchema,
  baseTaskSchema,
  associateTaskWithEntitySchema
} from './schema';

const HUBSPOT_TOOL_SELECTION_PROMPT = `
HubSpot is a CRM platform that manages:
- Contacts: People and leads with properties like name, email, phone, title, etc.
- Companies: Organizations with properties like name, domain, industry, size, etc.
- Deals: Sales opportunities with stages, amounts, close dates, etc.
- Tasks: To-do items and reminders with title, status, priority, due dates, etc.
- Tickets: Support cases with priority, status, category, etc.
- Marketing: Campaigns, emails, forms, landing pages, etc.

Consider using HubSpot tools when the user wants to:
- Find specific contacts, companies, deals, or tasks by name/ID/properties
- Look up contact details like email, phone, job title
- Check company information like industry, size, revenue
- View deal status, amount, pipeline stage, close date
- Create, update, or search tasks and reminders
- Create, update, or search tickets for support cases
- Access ticket details, support history, resolutions
- Get marketing campaign performance and engagement metrics
- View and manage deals
- View or manage contacts
`;

const HUBSPOT_RESPONSE_GENERATION_PROMPT = `
When formatting HubSpot responses:
- Include contact/company IDs when referencing specific records
- Format important contact details in bold
- Present deal values and stages clearly
- Include relevant contact properties and custom fields
- Format dates in a human-readable format
- For tickets, show priority, status, and category clearly
`;

export function createHubspotToolsExport(config: HubspotConfig): ToolConfig {
  const service = new HubspotService(config);

  const tools: DynamicStructuredTool<any>[] = [
    tool(async (args: SearchDealsParams) => service.searchDeals(args), {
      name: 'search_hubspot_deals',
      description: 'Search for deals in HubSpot',
      schema: searchDealsSchema
    }),
    tool(async (args: { keyword: string }) => service.searchContacts(args.keyword), {
      name: 'search_hubspot_contacts',
      description: 'Search for contacts in HubSpot based on name or email',
      schema: z.object({
        keyword: z
          .string()
          .describe('The keyword to search for in contact names or email addresses')
      })
    }),
    tool(
      async (args: { entityId: string; note: string }) =>
        service.createNote({
          entityType: HubspotEntityType.DEAL,
          entityId: args.entityId,
          note: args.note
        }),
      {
        name: 'add_note_to_hubspot_deal',
        description: 'Add a note to a deal in HubSpot',
        schema: z.object({
          entityId: z.string().describe('The ID of the deal'),
          note: z.string().describe('The content of the note')
        })
      }
    ),
    tool(
      async (args: { entityId: string; note: string }) =>
        service.createNote({
          entityType: HubspotEntityType.CONTACT,
          entityId: args.entityId,
          note: args.note
        }),
      {
        name: 'add_note_to_hubspot_contact',
        description: 'Add a note to a contact in HubSpot',
        schema: z.object({
          entityId: z.string().describe('The ID of the contact'),
          note: z.string().describe('The content of the note')
        })
      }
    ),
    tool(
      async (args: { entityId: string; note: string }) =>
        service.createNote({
          entityType: HubspotEntityType.COMPANY,
          entityId: args.entityId,
          note: args.note
        }),
      {
        name: 'add_note_to_hubspot_company',
        description: 'Add a note to a company in HubSpot',
        schema: z.object({
          entityId: z.string().describe('The ID of the company'),
          note: z.string().describe('The content of the note')
        })
      }
    ),
    tool(async (args: CreateDealParams) => service.createDeal(args), {
      name: 'create_hubspot_deal',
      description: 'Create a new deal in HubSpot',
      schema: createDealSchema
    }),
    tool(async (args: UpdateDealParams) => service.updateDeal(args), {
      name: 'update_hubspot_deal',
      description: 'Update the details of an existing HubSpot deal.',
      schema: updateDealSchema
    }),
    tool(async (args: CreateContactParams) => service.createContact(args), {
      name: 'create_hubspot_contact',
      description: 'Create a new contact in HubSpot',
      schema: z.object({
        firstName: z.string().describe('The first name of the contact'),
        lastName: z.string().describe('The last name of the contact'),
        email: z.string().describe('The email address of the contact'),
        phone: z.string().optional().describe('The phone number of the contact'),
        company: z.string().optional().describe('The company associated with the contact')
      })
    }),
    tool(async (args: GetPipelinesParams) => service.getPipelines(args.entityType), {
      name: 'get_hubspot_pipelines',
      description:
        'Retrieve all pipelines in HubSpot associated with a specific object type, such as tickets or deals.',
      schema: getPipelinesSchema
    }),
    tool(async () => service.getOwners(), {
      name: 'get_hubspot_owners',
      description: 'Fetch all HubSpot owners (users) and their IDs',
      schema: z.object({})
    }),
    tool(async (args: { keyword: string }) => service.searchCompanies(args.keyword), {
      name: 'search_hubspot_companies',
      description: 'Search companies in HubSpot based on a keyword (e.g., company name)',
      schema: z.object({
        keyword: z.string().describe('The keyword to search for in company names')
      })
    }),
    tool(async (args: CreateTaskParams) => service.createTask(args), {
      name: 'create_hubspot_task',
      description: 'Create a new HubSpot task.',
      schema: baseTaskSchema
    }),
    tool(async (args: AssociateTaskWithEntityParams) => service.associateTaskWithEntity(args), {
      name: 'associate_task_with_entity',
      description: 'Associate an existing task with a HubSpot contact, company, or deal.',
      schema: associateTaskWithEntitySchema
    }),
    tool(async (args: UpdateTaskParams) => service.updateTask(args), {
      name: 'update_hubspot_task',
      description: 'Update the details of an existing task in HubSpot.',
      schema: taskUpdateSchema
    }),
    tool(async (args: TaskSearchParams) => service.searchTasks(args), {
      name: 'search_hubspot_tasks',
      description:
        'Search for tasks in HubSpot using filters such as keyword, owner, status, priority, due date.',
      schema: taskSearchSchema
    }),
    tool(async (args: CreateTicketParams) => service.createTicket(args), {
      name: 'create_hubspot_ticket',
      description: 'Create a new HubSpot ticket.',
      schema: baseTicketSchema
    }),
    tool(async (args: AssociateTicketWithEntityParams) => service.associateTicketWithEntity(args), {
      name: 'associate_ticket_with_entity',
      description: 'Associate an existing ticket with a HubSpot contact, company, or deal.',
      schema: associateTicketWithEntitySchema
    }),
    tool(async (args: UpdateTicketParams) => service.updateTicket(args), {
      name: 'update_hubspot_ticket',
      description: 'Update the details of an existing HubSpot ticket.',
      schema: ticketUpdateSchema
    }),
    tool(async (args: TicketSearchParams) => service.searchTickets(args), {
      name: 'search_hubspot_tickets',
      description: 'Search for tickets in HubSpot based on a keyword, owner, stage, or priority.',
      schema: ticketSearchSchema
    })
  ];

  return {
    tools,
    prompts: {
      toolSelection: HUBSPOT_TOOL_SELECTION_PROMPT,
      responseGeneration: HUBSPOT_RESPONSE_GENERATION_PROMPT
    }
  };
}

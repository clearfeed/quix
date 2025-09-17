import { ToolConfig, ToolOperation, tool } from '@clearfeed-ai/quix-common-agent';
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
  AssociateTaskWithEntityParams,
  AssociateDealWithContactParams
} from './types';
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
  associateTaskWithEntitySchema,
  searchContactsSchema,
  createContactSchema,
  searchCompaniesSchema,
  associateDealWithContactSchema
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

  const tools = [
    tool({
      name: 'search_hubspot_deals',
      description: 'Search for deals in HubSpot',
      schema: searchDealsSchema,
      operations: [ToolOperation.READ],
      func: async (args: SearchDealsParams) => service.searchDeals(args)
    }),
    tool({
      name: 'search_hubspot_contacts',
      description: 'Search for contacts in HubSpot based on name or email',
      schema: searchContactsSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof searchContactsSchema>) =>
        service.searchContacts(args.keyword)
    }),
    tool({
      name: 'add_note_to_hubspot_deal',
      description: 'Add a note to a deal in HubSpot',
      schema: z.object({
        entityId: z.string().describe('The ID of the deal'),
        note: z.string().describe('The content of the note')
      }),
      operations: [ToolOperation.CREATE],
      func: async (args: { entityId: string; note: string }) =>
        service.createNote({
          entityType: HubspotEntityType.DEAL,
          entityId: args.entityId,
          note: args.note
        })
    }),
    tool({
      name: 'add_note_to_hubspot_contact',
      description: 'Add a note to a contact in HubSpot',
      schema: z.object({
        entityId: z.string().describe('The ID of the contact'),
        note: z.string().describe('The content of the note')
      }),
      operations: [ToolOperation.CREATE],
      func: async (args: { entityId: string; note: string }) =>
        service.createNote({
          entityType: HubspotEntityType.CONTACT,
          entityId: args.entityId,
          note: args.note
        })
    }),
    tool({
      name: 'add_note_to_hubspot_company',
      description: 'Add a note to a company in HubSpot',
      schema: z.object({
        entityId: z.string().describe('The ID of the company'),
        note: z.string().describe('The content of the note')
      }),
      operations: [ToolOperation.CREATE],
      func: async (args: { entityId: string; note: string }) =>
        service.createNote({
          entityType: HubspotEntityType.COMPANY,
          entityId: args.entityId,
          note: args.note
        })
    }),
    tool({
      name: 'create_hubspot_deal',
      description: 'Create a new deal in HubSpot',
      schema: createDealSchema,
      operations: [ToolOperation.CREATE],
      func: async (args: CreateDealParams) => service.createDeal(args)
    }),
    tool({
      name: 'update_hubspot_deal',
      description:
        'Update the details of an existing HubSpot deal. Only the fields explicitly provided should be updated; leave all other fields unchanged.',
      schema: updateDealSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: UpdateDealParams) => service.updateDeal(args)
    }),
    tool({
      name: 'create_hubspot_contact',
      description: 'Create a new contact in HubSpot',
      schema: createContactSchema,
      operations: [ToolOperation.CREATE],
      func: async (args: CreateContactParams) => service.createContact(args)
    }),
    tool({
      name: 'get_hubspot_pipelines',
      description:
        'Retrieve all pipelines in HubSpot associated with a specific object type, such as tickets or deals.',
      schema: getPipelinesSchema,
      operations: [ToolOperation.READ],
      func: async (args: GetPipelinesParams) => service.getPipelines(args.entityType)
    }),
    tool({
      name: 'get_hubspot_owners',
      description: 'Fetch all HubSpot owners (users) and their IDs',
      schema: z.object({}),
      operations: [ToolOperation.READ],
      func: async () => service.getOwners()
    }),
    tool({
      name: 'search_hubspot_companies',
      description: 'Search companies in HubSpot based on a keyword (e.g., company name)',
      schema: searchCompaniesSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof searchCompaniesSchema>) =>
        service.searchCompanies(args.keyword)
    }),
    tool({
      name: 'create_hubspot_task',
      description:
        'Create a new HubSpot task using only the information provided. Do not populate any additional fields unless they are required.',
      schema: baseTaskSchema,
      operations: [ToolOperation.CREATE],
      func: async (args: CreateTaskParams) => service.createTask(args)
    }),
    tool({
      name: 'associate_task_with_entity',
      description: 'Associate an existing task with a HubSpot contact, company, or deal.',
      schema: associateTaskWithEntitySchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: AssociateTaskWithEntityParams) => service.associateTaskWithEntity(args)
    }),
    tool({
      name: 'update_hubspot_task',
      description: 'Update the details of an existing task in HubSpot.',
      schema: taskUpdateSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: UpdateTaskParams) => service.updateTask(args)
    }),
    tool({
      name: 'search_hubspot_tasks',
      description:
        'Search for tasks in HubSpot using filters such as keyword, owner, status, priority, due date.',
      schema: taskSearchSchema,
      operations: [ToolOperation.READ],
      func: async (args: TaskSearchParams) => service.searchTasks(args)
    }),
    tool({
      name: 'create_hubspot_ticket',
      description: 'Create a new HubSpot ticket.',
      schema: baseTicketSchema,
      operations: [ToolOperation.CREATE],
      func: async (args: CreateTicketParams) => service.createTicket(args)
    }),
    tool({
      name: 'associate_ticket_with_entity',
      description: 'Associate an existing ticket with a HubSpot contact, company, or deal.',
      schema: associateTicketWithEntitySchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: AssociateTicketWithEntityParams) => service.associateTicketWithEntity(args)
    }),
    tool({
      name: 'update_hubspot_ticket',
      description: 'Update the details of an existing HubSpot ticket.',
      schema: ticketUpdateSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: UpdateTicketParams) => service.updateTicket(args)
    }),
    tool({
      name: 'search_hubspot_tickets',
      description: 'Search for tickets in HubSpot based on a keyword, owner, stage, or priority.',
      schema: ticketSearchSchema,
      operations: [ToolOperation.READ],
      func: async (args: TicketSearchParams) => service.searchTickets(args)
    }),
    tool({
      name: 'associate_deal_with_contact',
      description: 'Associate an existing deal with an existing contact in HubSpot',
      schema: associateDealWithContactSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: AssociateDealWithContactParams) => service.associateDealWithContact(args)
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

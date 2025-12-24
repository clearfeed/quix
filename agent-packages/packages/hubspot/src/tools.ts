import { tool } from '@langchain/core/tools';
import { ToolConfig, ToolOperation, Toolkit } from '@clearfeed-ai/quix-common-agent';
import { HubspotService } from './index';
import {
  CreateContactParams,
  UpdateContactParams,
  HubspotConfig,
  CreateDealParams,
  HubspotEntityType,
  UpdateTaskParams,
  TaskSearchParams,
  GetPipelinesParams,
  GetPropertiesParams,
  CreateTicketParams,
  AssociateTicketWithEntityParams,
  UpdateTicketParams,
  TicketSearchParams,
  SearchDealsParams,
  UpdateDealParams,
  CreateTaskParams,
  AssociateTaskWithEntityParams,
  AssociateDealWithEntityParams
} from './types';
import { z } from 'zod';
import {
  taskUpdateSchema,
  taskSearchSchema,
  baseTicketSchema,
  getPipelinesSchema,
  getPropertiesSchema,
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
  updateContactSchema,
  searchCompaniesSchema,
  associateDealWithEntitySchema
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

export function createHubspotToolsExport(config: HubspotConfig): Toolkit {
  const service = new HubspotService(config);

  const toolConfigs: ToolConfig[] = [
    {
      tool: tool(async (args: SearchDealsParams) => service.searchDeals(args), {
        name: 'search_hubspot_deals',
        description: 'Search for deals in HubSpot',
        schema: searchDealsSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(
        async (args: z.infer<typeof searchContactsSchema>) => service.searchContacts(args.keyword),
        {
          name: 'search_hubspot_contacts',
          description: 'Search for contacts in HubSpot based on name or email',
          schema: searchContactsSchema
        }
      ),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(
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
      operations: [ToolOperation.CREATE]
    },

    {
      tool: tool(
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
      operations: [ToolOperation.CREATE]
    },

    {
      tool: tool(
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
      operations: [ToolOperation.CREATE]
    },

    {
      tool: tool(async (args: CreateDealParams) => service.createDeal(args), {
        name: 'create_hubspot_deal',
        description: 'Create a new deal in HubSpot',
        schema: createDealSchema
      }),
      operations: [ToolOperation.CREATE]
    },

    {
      tool: tool(async (args: UpdateDealParams) => service.updateDeal(args), {
        name: 'update_hubspot_deal',
        description:
          'Update an existing HubSpot deal including standard fields (dealname, amount, closedate, pipeline, dealstage, owner) and custom fields. Use get_hubspot_properties with objectType="deal" first to discover available custom field names (case-sensitive).',
        schema: updateDealSchema
      }),
      operations: [ToolOperation.UPDATE]
    },

    {
      tool: tool(async (args: CreateContactParams) => service.createContact(args), {
        name: 'create_hubspot_contact',
        description: 'Create a new contact in HubSpot',
        schema: createContactSchema
      }),
      operations: [ToolOperation.CREATE]
    },

    {
      tool: tool(async (args: UpdateContactParams) => service.updateContact(args), {
        name: 'update_hubspot_contact',
        description:
          'Update an existing HubSpot contact including standard fields (firstName, lastName, email, phone, company) and custom fields. Use get_hubspot_properties with objectType="contact" first to discover available custom field names (case-sensitive).',
        schema: updateContactSchema
      }),
      operations: [ToolOperation.UPDATE]
    },

    {
      tool: tool(async (args: GetPipelinesParams) => service.getPipelines(args.entityType), {
        name: 'get_hubspot_pipelines',
        description:
          'Retrieve all pipelines in HubSpot associated with a specific object type, such as tickets or deals.',
        schema: getPipelinesSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async (args: GetPropertiesParams) => service.getProperties(args.objectType), {
        name: 'get_hubspot_properties',
        description:
          'Get all properties for a HubSpot object type (ticket, deal, or contact) including custom fields.',
        schema: getPropertiesSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async () => service.getOwners(), {
        name: 'get_hubspot_owners',
        description: 'Fetch all HubSpot owners (users) and their IDs',
        schema: z.object({})
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(
        async (args: z.infer<typeof searchCompaniesSchema>) =>
          service.searchCompanies(args.keyword),
        {
          name: 'search_hubspot_companies',
          description: 'Search companies in HubSpot based on a keyword (e.g., company name)',
          schema: searchCompaniesSchema
        }
      ),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async (args: CreateTaskParams) => service.createTask(args), {
        name: 'create_hubspot_task',
        description:
          'Create a new HubSpot task using only the information provided. Do not populate any additional fields unless they are required.',
        schema: baseTaskSchema
      }),
      operations: [ToolOperation.CREATE]
    },

    {
      tool: tool(
        async (args: AssociateTaskWithEntityParams) => service.associateTaskWithEntity(args),
        {
          name: 'associate_task_with_entity',
          description: 'Associate an existing task with a HubSpot contact, company, or deal.',
          schema: associateTaskWithEntitySchema
        }
      ),
      operations: [ToolOperation.UPDATE]
    },

    {
      tool: tool(async (args: UpdateTaskParams) => service.updateTask(args), {
        name: 'update_hubspot_task',
        description: 'Update the details of an existing task in HubSpot.',
        schema: taskUpdateSchema
      }),
      operations: [ToolOperation.UPDATE]
    },

    {
      tool: tool(async (args: TaskSearchParams) => service.searchTasks(args), {
        name: 'search_hubspot_tasks',
        description:
          'Search for tasks in HubSpot using filters such as keyword, owner, status, priority, due date.',
        schema: taskSearchSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async (args: CreateTicketParams) => service.createTicket(args), {
        name: 'create_hubspot_ticket',
        description: 'Create a new HubSpot ticket.',
        schema: baseTicketSchema
      }),
      operations: [ToolOperation.CREATE]
    },

    {
      tool: tool(
        async (args: AssociateTicketWithEntityParams) => service.associateTicketWithEntity(args),
        {
          name: 'associate_ticket_with_entity',
          description: 'Associate an existing ticket with a HubSpot contact, company, or deal.',
          schema: associateTicketWithEntitySchema
        }
      ),
      operations: [ToolOperation.UPDATE]
    },

    {
      tool: tool(async (args: UpdateTicketParams) => service.updateTicket(args), {
        name: 'update_hubspot_ticket',
        description:
          'Update an existing HubSpot ticket including standard fields (subject, content, stage, priority, owner) and custom fields. Use get_hubspot_properties with objectType="ticket" first to discover available custom field names (case-sensitive).',
        schema: ticketUpdateSchema
      }),
      operations: [ToolOperation.UPDATE]
    },

    {
      tool: tool(async (args: TicketSearchParams) => service.searchTickets(args), {
        name: 'search_hubspot_tickets',
        description: 'Search for tickets in HubSpot based on a keyword, owner, stage, or priority.',
        schema: ticketSearchSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(
        async (args: AssociateDealWithEntityParams) => service.associateDealWithEntity(args),
        {
          name: 'associate_deal_with_entity',
          description: 'Associate an existing deal with a HubSpot contact, company, or deal.',
          schema: associateDealWithEntitySchema
        }
      ),
      operations: [ToolOperation.UPDATE]
    }
  ];

  return {
    toolConfigs,
    prompts: {
      toolSelection: HUBSPOT_TOOL_SELECTION_PROMPT,
      responseGeneration: HUBSPOT_RESPONSE_GENERATION_PROMPT
    }
  };
}

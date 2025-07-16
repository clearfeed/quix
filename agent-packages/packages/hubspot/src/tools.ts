import { ToolConfig, ToolOperation, tool } from '@clearfeed-ai/quix-common-agent';
import { HubspotService } from './index';
import {
  CreateContactParams,
  CreateDealParams,
  UpdateDealParams,
  CreateNoteParams,
  GetPipelinesParams,
  SearchDealsParams,
  HubspotEntityType,
  HubspotConfig,
  CreateTaskParams,
  AssociateTaskWithEntityParams,
  UpdateTaskParams,
  TaskSearchParams,
  CreateTicketParams,
  AssociateTicketWithEntityParams,
  UpdateTicketParams,
  TicketSearchParams
} from './types';
import { z } from 'zod';

const HUBSPOT_TOOL_SELECTION_PROMPT = `
HubSpot is a CRM platform that manages:
- Contacts: People and leads with properties like name, email, phone, title, etc.
- Companies: Organizations with properties like name, domain, industry, size, etc.
- Deals: Sales opportunities with stages, amounts, close dates, etc.
- Tickets: Support cases with priority, status, category, etc.
- Marketing: Campaigns, emails, forms, landing pages, etc.

Consider using HubSpot tools when the user wants to:
- Find specific contacts, companies or deals by name/ID/properties
- Look up contact details like email, phone, job title
- Check company information like industry, size, revenue
- View deal status, amount, pipeline stage, close date
- Access ticket details, support history, resolutions
- Get marketing campaign performance and engagement metrics
`;

const HUBSPOT_RESPONSE_GENERATION_PROMPT = `
When formatting HubSpot responses:
- Include contact/company IDs when referencing specific records
- Format important contact details in bold
- Present deal values and stages clearly
- Include relevant contact properties and custom fields
- Format dates in a human-readable format
`;

// Schemas
const searchDealsSchema = z.object({
  keyword: z.string().optional().describe('Keyword to search for in deals'),
  stage: z.string().optional().describe('Deal stage to filter by'),
  ownerId: z.string().optional().describe('Owner ID to filter deals by'),
  limit: z.number().optional().default(10).describe('Maximum number of deals to return')
});

const searchContactsSchema = z.object({
  keyword: z.string().describe('Keyword to search for in contacts (name or email)')
});

const searchCompaniesSchema = z.object({
  keyword: z.string().describe('Keyword to search for in companies')
});

const createDealSchema = z.object({
  dealname: z.string().describe('Name of the deal'),
  amount: z.number().optional().describe('Deal amount'),
  dealstage: z.string().optional().describe('Deal stage'),
  pipeline: z.string().optional().describe('Pipeline ID'),
  closedate: z.string().optional().describe('Close date (YYYY-MM-DD)'),
  hubspot_owner_id: z.string().optional().describe('Owner ID'),
  associations: z.object({
    contact_ids: z.array(z.string()).optional(),
    company_ids: z.array(z.string()).optional()
  }).optional()
});

const updateDealSchema = z.object({
  dealId: z.string().describe('ID of the deal to update'),
  dealname: z.string().optional().describe('Updated deal name'),
  amount: z.number().optional().describe('Updated deal amount'),
  dealstage: z.string().optional().describe('Updated deal stage'),
  pipeline: z.string().optional().describe('Updated pipeline ID'),
  closedate: z.string().optional().describe('Updated close date (YYYY-MM-DD)'),
  hubspot_owner_id: z.string().optional().describe('Updated owner ID')
});

const createContactSchema = z.object({
  email: z.string().describe('Contact email address'),
  firstname: z.string().optional().describe('First name'),
  lastname: z.string().optional().describe('Last name'),
  company: z.string().optional().describe('Company name'),
  phone: z.string().optional().describe('Phone number'),
  website: z.string().optional().describe('Website'),
  jobtitle: z.string().optional().describe('Job title')
});

const getPipelinesSchema = z.object({
  entityType: z.nativeEnum(HubspotEntityType).describe('Type of entity (deals, tickets, etc.)')
});

const baseTaskSchema = z.object({
  hs_task_subject: z.string().describe('Task subject'),
  hs_task_body: z.string().optional().describe('Task description'),
  hs_task_status: z.string().optional().describe('Task status'),
  hs_task_priority: z.string().optional().describe('Task priority'),
  hs_task_type: z.string().optional().describe('Task type'),
  hubspot_owner_id: z.string().optional().describe('Owner ID'),
  associations: z.object({
    contact_ids: z.array(z.string()).optional(),
    company_ids: z.array(z.string()).optional(),
    deal_ids: z.array(z.string()).optional()
  }).optional()
});

const associateTaskWithEntitySchema = z.object({
  taskId: z.string().describe('Task ID'),
  entityType: z.nativeEnum(HubspotEntityType).describe('Entity type'),
  entityId: z.string().describe('Entity ID')
});

const taskUpdateSchema = z.object({
  taskId: z.string().describe('Task ID to update'),
  hs_task_subject: z.string().optional().describe('Updated task subject'),
  hs_task_body: z.string().optional().describe('Updated task description'),
  hs_task_status: z.string().optional().describe('Updated task status'),
  hs_task_priority: z.string().optional().describe('Updated task priority'),
  hs_task_type: z.string().optional().describe('Updated task type'),
  hubspot_owner_id: z.string().optional().describe('Updated owner ID')
});

const taskSearchSchema = z.object({
  keyword: z.string().optional().describe('Keyword to search for'),
  ownerId: z.string().optional().describe('Owner ID filter'),
  status: z.string().optional().describe('Status filter'),
  priority: z.string().optional().describe('Priority filter'),
  dueDate: z.string().optional().describe('Due date filter'),
  limit: z.number().optional().default(10).describe('Maximum results')
});

const baseTicketSchema = z.object({
  hs_ticket_subject: z.string().describe('Ticket subject'),
  hs_ticket_content: z.string().optional().describe('Ticket content'),
  hs_ticket_category: z.string().optional().describe('Ticket category'),
  hs_ticket_priority: z.string().optional().describe('Ticket priority'),
  hs_pipeline_stage: z.string().optional().describe('Pipeline stage'),
  hubspot_owner_id: z.string().optional().describe('Owner ID'),
  associations: z.object({
    contact_ids: z.array(z.string()).optional(),
    company_ids: z.array(z.string()).optional(),
    deal_ids: z.array(z.string()).optional()
  }).optional()
});

const associateTicketWithEntitySchema = z.object({
  ticketId: z.string().describe('Ticket ID'),
  entityType: z.nativeEnum(HubspotEntityType).describe('Entity type'),
  entityId: z.string().describe('Entity ID')
});

const ticketUpdateSchema = z.object({
  ticketId: z.string().describe('Ticket ID to update'),
  hs_ticket_subject: z.string().optional().describe('Updated subject'),
  hs_ticket_content: z.string().optional().describe('Updated content'),
  hs_ticket_category: z.string().optional().describe('Updated category'),
  hs_ticket_priority: z.string().optional().describe('Updated priority'),
  hs_pipeline_stage: z.string().optional().describe('Updated stage'),
  hubspot_owner_id: z.string().optional().describe('Updated owner ID')
});

const ticketSearchSchema = z.object({
  keyword: z.string().optional().describe('Keyword to search for'),
  ownerId: z.string().optional().describe('Owner ID filter'),
  stage: z.string().optional().describe('Stage filter'),
  priority: z.string().optional().describe('Priority filter'),
  limit: z.number().optional().default(10).describe('Maximum results')
});

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
import {
  SearchDealsResponse,
  CreateContactResponse,
  SearchContactsResponse,
  AddNoteResponse,
  CreateTaskResponse,
  UpdateTaskResponse,
  SearchTasksResponse,
  CreateTicketResponse,
  UpdateTicketResponse,
  SearchTicketsResponse,
  HubspotEntityType,
  TaskStatusEnum,
  TaskPriorityEnum,
  TaskTypeEnum,
  HubspotOwner,
  HubspotCompany,
  Deal,
  ContactWithCompanies,
  HubspotTask,
  HubspotTicket,
  HubspotPipeline,
  AssociateTaskWithEntityResponse,
  AssociateTicketWithEntityResponse
} from '@clearfeed-ai/quix-hubspot-agent';
import { BaseResponse } from '@clearfeed-ai/quix-common-agent';
import { TestCase } from '../common/types';
import { createMockedTools } from '../common/utils';
import { DynamicStructuredTool } from '@langchain/core/tools';

export interface HubspotDealResponse {
  id: string;
  properties: {
    dealname: string;
    dealstage?: string;
    amount?: string;
    closedate?: string;
    description?: string;
    pipeline?: string;
    hubspot_owner_id?: string;
    createdate?: string;
    hs_lastmodifieddate?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  archived?: boolean;
}

export type ToolResponseTypeMap = {
  search_hubspot_deals: (overrides?: {
    deals?: Deal[];
    success?: boolean;
    error?: string;
  }) => SearchDealsResponse;
  search_hubspot_companies: (overrides?: {
    companies?: HubspotCompany[];
    success?: boolean;
    error?: string;
  }) => BaseResponse<{ companies: HubspotCompany[] }>;
  create_hubspot_contact: (overrides?: {
    contactId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    company?: string;
    success?: boolean;
    error?: string;
  }) => CreateContactResponse;
  search_hubspot_contacts: (overrides?: {
    contacts?: ContactWithCompanies[];
    success?: boolean;
    error?: string;
  }) => SearchContactsResponse;
  create_hubspot_deal: (overrides?: {
    dealId?: string;
    name?: string;
    stage?: string;
    amount?: number;
    closeDate?: string;
    pipeline?: string;
    owner?: HubspotOwner;
    companies?: HubspotCompany[];
    success?: boolean;
    error?: string;
  }) => BaseResponse<{ deal: HubspotDealResponse; dealUrl: string }>;
  add_note_to_hubspot_deal: (overrides?: {
    noteId?: string;
    success?: boolean;
    error?: string;
  }) => AddNoteResponse;
  create_hubspot_task: (overrides?: {
    taskId?: string;
    title?: string;
    body?: string;
    status?: TaskStatusEnum;
    priority?: TaskPriorityEnum;
    type?: TaskTypeEnum;
    dueDate?: string;
    owner?: HubspotOwner;
    success?: boolean;
    error?: string;
  }) => CreateTaskResponse;
  associate_task_with_entity: (overrides?: {
    taskId?: string;
    associatedObjectType?: HubspotEntityType;
    associatedObjectId?: string;
    success?: boolean;
    error?: string;
  }) => AssociateTaskWithEntityResponse;
  update_hubspot_task: (overrides?: {
    taskId?: string;
    title?: string;
    body?: string;
    status?: TaskStatusEnum;
    priority?: TaskPriorityEnum;
    type?: TaskTypeEnum;
    dueDate?: string;
    owner?: HubspotOwner;
    success?: boolean;
    error?: string;
  }) => UpdateTaskResponse;
  search_hubspot_tasks: (overrides?: {
    tasks?: HubspotTask[];
    success?: boolean;
    error?: string;
  }) => SearchTasksResponse;
  create_hubspot_ticket: (overrides?: {
    ticketId?: string;
    subject?: string;
    content?: string;
    stage?: string;
    priority?: string;
    owner?: HubspotOwner;
    pipeline?: string;
    success?: boolean;
    error?: string;
  }) => CreateTicketResponse;
  update_hubspot_ticket: (overrides?: {
    ticketId?: string;
    subject?: string;
    content?: string;
    stage?: string;
    priority?: string;
    owner?: HubspotOwner;
    pipeline?: string;
    success?: boolean;
    error?: string;
  }) => UpdateTicketResponse;
  search_hubspot_tickets: (overrides?: {
    tickets?: HubspotTicket[];
    success?: boolean;
    error?: string;
  }) => SearchTicketsResponse;
  get_hubspot_pipelines: (overrides?: {
    pipelines?: HubspotPipeline[];
    success?: boolean;
    error?: string;
  }) => BaseResponse<{ pipelines: HubspotPipeline[] }>;
  associate_ticket_with_entity: (overrides?: {
    ticketId?: string;
    associatedObjectType?: HubspotEntityType;
    associatedObjectId?: string;
    success?: boolean;
    error?: string;
  }) => AssociateTicketWithEntityResponse;
  update_hubspot_deal: (overrides?: {
    dealId?: string;
    name?: string;
    stage?: string;
    amount?: number;
    closeDate?: string;
    pipeline?: string;
    owner?: HubspotOwner;
    companies?: HubspotCompany[];
    success?: boolean;
    error?: string;
  }) => BaseResponse<{ deal: HubspotDealResponse; dealUrl: string }>;
  get_hubspot_owners: (overrides?: {
    owners?: HubspotOwner[];
    success?: boolean;
    error?: string;
  }) => BaseResponse<{ owners: HubspotOwner[] }>;
};

const toolResponseMap: ToolResponseTypeMap = {
  get_hubspot_owners: (overrides = {}): BaseResponse<{ owners: HubspotOwner[] }> => ({
    success: overrides.success ?? true,
    data: {
      owners: overrides.owners ?? [
        { id: '1001', firstName: 'Sarah', lastName: 'Johnson', email: 'sjohnson@example.com' },
        { id: '1002', firstName: 'Michael', lastName: 'Chen', email: 'mchen@example.com' },
        { id: '1003', firstName: 'Priya', lastName: 'Patel', email: 'ppatel@example.com' }
      ]
    },
    error: overrides.error
  }),
  search_hubspot_deals: (overrides = {}): SearchDealsResponse => ({
    success: overrides.success ?? true,
    data: {
      deals: overrides.deals || [
        {
          id: '6001',
          name: 'Acme Corp - Enterprise License',
          stage: 'Proposal Sent',
          amount: 75000,
          closeDate: '2024-06-30',
          pipeline: 'Sales Pipeline',
          owner: {
            id: '1001',
            firstName: 'Sarah',
            lastName: 'Johnson',
            email: 'sjohnson@example.com'
          },
          companies: [
            {
              id: '2001',
              name: 'Acme Corp',
              domain: 'acmecorp.com',
              industry: 'Manufacturing',
              website: 'https://acmecorp.com',
              description: 'Leading manufacturer of innovative widgets'
            }
          ],
          createdAt: '2024-04-10T10:15:00Z',
          lastModifiedDate: '2024-05-15T11:30:00Z',
          dealUrl: 'https://app.hubspot.com/deals/6001'
        }
      ]
    },
    error: overrides.error
  }),

  search_hubspot_companies: (overrides = {}): BaseResponse<{ companies: HubspotCompany[] }> => ({
    success: overrides.success ?? true,
    data: {
      companies: overrides.companies || [
        {
          id: '2001',
          name: 'Acme Corp',
          domain: 'acmecorp.com',
          industry: 'Manufacturing',
          website: 'https://acmecorp.com',
          description: 'Leading manufacturer of innovative widgets'
        }
      ]
    },
    error: overrides.error
  }),

  create_hubspot_contact: (overrides = {}): CreateContactResponse => ({
    success: overrides.success ?? true,
    data: {
      contactId: overrides.contactId || 'new-contact-id-1'
    },
    error: overrides.error
  }),

  search_hubspot_contacts: (overrides = {}): SearchContactsResponse => ({
    success: overrides.success ?? true,
    data: {
      contacts: overrides.contacts || [
        {
          id: '3001',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@example.com',
          phone: '555-123-4567',
          company: 'Acme Corp',
          createdAt: '2024-04-01T09:00:00Z',
          lastModifiedDate: '2024-05-15T14:30:00Z',
          companies: [
            {
              name: 'Acme Corp',
              domain: 'acmecorp.com',
              industry: 'Manufacturing',
              website: 'https://acmecorp.com',
              description: 'Leading manufacturer of innovative widgets'
            }
          ]
        }
      ]
    },
    error: overrides.error
  }),

  create_hubspot_deal: (
    overrides = {}
  ): BaseResponse<{ deal: HubspotDealResponse; dealUrl: string }> => ({
    success: overrides.success ?? true,
    data: {
      deal: {
        id: overrides.dealId || 'new-deal-id-1',
        properties: {
          dealname: overrides.name || 'New Deal',
          dealstage: overrides.stage || 'Qualification',
          amount: overrides.amount?.toString() || '50000',
          closedate: overrides.closeDate || '2024-12-31',
          pipeline: overrides.pipeline || 'Sales Pipeline',
          hubspot_owner_id: overrides.owner?.id || '1001'
        }
      },
      dealUrl: `https://app.hubspot.com/deals/${overrides.dealId || 'new-deal-id-1'}`
    },
    error: overrides.error
  }),

  add_note_to_hubspot_deal: (overrides = {}): AddNoteResponse => ({
    success: overrides.success ?? true,
    data: {
      noteId: overrides.noteId || 'new-note-id-1'
    },
    error: overrides.error
  }),

  create_hubspot_task: (overrides = {}): CreateTaskResponse => ({
    success: overrides.success ?? true,
    data: {
      task: {
        id: overrides.taskId || 'new-task-id-1',
        subject: overrides.title || 'New Task',
        status: overrides.status || TaskStatusEnum.NOT_STARTED,
        priority: overrides.priority || TaskPriorityEnum.MEDIUM,
        type: overrides.type || TaskTypeEnum.CALL,
        timestamp: overrides.dueDate || new Date().toISOString(),
        body: overrides.body || 'Task description',
        url: `https://app.hubspot.com/tasks/${overrides.taskId || 'new-task-id-1'}`
      }
    },
    error: overrides.error
  }),

  associate_task_with_entity: (overrides = {}): AssociateTaskWithEntityResponse => ({
    success: overrides.success ?? true,
    data: {
      taskId: overrides.taskId || '9002',
      associatedObjectType: overrides.associatedObjectType || HubspotEntityType.COMPANY,
      associatedObjectId: overrides.associatedObjectId || '2002'
    },
    error: overrides.error
  }),

  update_hubspot_task: (overrides = {}): UpdateTaskResponse => ({
    success: overrides.success ?? true,
    data: {
      task: {
        id: overrides.taskId || '8001',
        subject: overrides.title || 'Updated Task',
        status: overrides.status || TaskStatusEnum.COMPLETED,
        priority: overrides.priority || TaskPriorityEnum.HIGH,
        type: overrides.type || TaskTypeEnum.CALL,
        timestamp: overrides.dueDate || new Date().toISOString(),
        body: overrides.body || 'Updated task description',
        url: `https://app.hubspot.com/tasks/${overrides.taskId || '8001'}`
      }
    },
    error: overrides.error
  }),

  search_hubspot_tasks: (overrides = {}): SearchTasksResponse => ({
    success: overrides.success ?? true,
    data: {
      tasks: overrides.tasks || [
        {
          id: '8001',
          title: 'Follow up with client',
          body: 'Schedule a call to discuss proposal',
          status: TaskStatusEnum.NOT_STARTED,
          priority: TaskPriorityEnum.HIGH,
          taskType: TaskTypeEnum.CALL,
          dueDate: '2024-05-20',
          ownerId: '1001',
          createdAt: '2024-05-01T09:00:00Z',
          lastModifiedDate: '2024-05-15T14:30:00Z',
          url: 'https://app.hubspot.com/tasks/8001'
        }
      ]
    },
    error: overrides.error
  }),

  create_hubspot_ticket: (overrides = {}): CreateTicketResponse => ({
    success: overrides.success ?? true,
    data: {
      ticket: {
        id: overrides.ticketId || 'new-ticket-id-1',
        subject: overrides.subject || 'New Support Ticket',
        stage: overrides.stage || 'New',
        priority: overrides.priority || 'MEDIUM',
        content: overrides.content || 'Ticket description',
        url: `https://app.hubspot.com/tickets/${overrides.ticketId || 'new-ticket-id-1'}`
      }
    },
    error: overrides.error
  }),

  update_hubspot_ticket: (overrides = {}): UpdateTicketResponse => ({
    success: overrides.success ?? true,
    data: {
      ticket: {
        id: overrides.ticketId || '9001',
        subject: overrides.subject || 'Updated Support Ticket',
        stage: overrides.stage || 'In Progress',
        priority: overrides.priority || 'HIGH',
        url: `https://app.hubspot.com/tickets/${overrides.ticketId || '9001'}`
      }
    },
    error: overrides.error
  }),

  search_hubspot_tickets: (overrides = {}): SearchTicketsResponse => ({
    success: overrides.success ?? true,
    data: {
      tickets: overrides.tickets || [
        {
          id: '9001',
          subject: 'API Integration Issue',
          content: 'Customer reporting API connection failures',
          priority: 'HIGH',
          stage: 'In Progress',
          createdAt: '2024-05-01T10:00:00Z',
          lastModifiedDate: '2024-05-15T15:30:00Z',
          owner: {
            id: '1001',
            firstName: 'Sarah',
            lastName: 'Johnson',
            email: 'sjohnson@example.com'
          },
          pipeline: 'Support Pipeline'
        }
      ]
    },
    error: overrides.error
  }),

  get_hubspot_pipelines: (overrides = {}): BaseResponse<{ pipelines: HubspotPipeline[] }> => ({
    success: overrides.success ?? true,
    data: {
      pipelines: overrides.pipelines || [
        {
          id: '4001',
          label: 'Sales Pipeline',
          archived: false,
          displayOrder: 1,
          stages: [
            { id: '5001', label: 'Qualification', archived: false, displayOrder: 1 },
            { id: '5002', label: 'Meeting Scheduled', archived: false, displayOrder: 2 },
            { id: '5003', label: 'Proposal Sent', archived: false, displayOrder: 3 },
            { id: '5004', label: 'Negotiation', archived: false, displayOrder: 4 },
            { id: '5005', label: 'Closed Won', archived: false, displayOrder: 5 },
            { id: '5006', label: 'Closed Lost', archived: false, displayOrder: 6 }
          ]
        }
      ]
    },
    error: overrides.error
  }),

  associate_ticket_with_entity: (overrides = {}): AssociateTicketWithEntityResponse => ({
    success: overrides.success ?? true,
    data: {
      ticketId: overrides.ticketId || '9001',
      associatedObjectType: overrides.associatedObjectType || HubspotEntityType.COMPANY,
      associatedObjectId: overrides.associatedObjectId || '2001'
    },
    error: overrides.error
  }),

  update_hubspot_deal: (
    overrides = {}
  ): BaseResponse<{ deal: HubspotDealResponse; dealUrl: string }> => ({
    success: overrides.success ?? true,
    data: {
      deal: {
        id: overrides.dealId || '6001',
        properties: {
          dealname: overrides.name || 'Updated Deal',
          dealstage: overrides.stage || 'Closed Won',
          amount: overrides.amount?.toString() || '75000',
          closedate: overrides.closeDate || '2024-06-30',
          pipeline: overrides.pipeline || 'Sales Pipeline',
          hubspot_owner_id: overrides.owner?.id || '1001'
        }
      },
      dealUrl: `https://app.hubspot.com/deals/${overrides.dealId || '6001'}`
    },
    error: overrides.error
  })
};

export function createHubspotMockedTools(
  testCase: TestCase<ToolResponseTypeMap>,
  originalTools: DynamicStructuredTool[]
) {
  return createMockedTools(testCase, toolResponseMap, originalTools);
}

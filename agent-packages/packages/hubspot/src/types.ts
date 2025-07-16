import { BaseConfig, BaseResponse } from '@clearfeed-ai/quix-common-agent';

export interface HubspotConfig extends BaseConfig {
  apiKey: string;
}

export interface Deal {
  id: string;
  name: string;
  stage: string;
  amount: number;
  closeDate: string;
  pipeline: string;
  owner: string;
  company: string;
  createdAt: string;
  lastModifiedDate: string;
}

export type SearchDealsResponse = BaseResponse<{
  deals: Deal[];
}>;

export enum HubspotEntityType {
  CONTACT = 'contact',
  COMPANY = 'company',
  DEAL = 'deal',
  TICKET = 'ticket',
  TASK = 'task'
}

export interface SearchDealsParams {
  keyword?: string;
  stage?: string;
  ownerId?: string;
  limit?: number;
}

export interface CreateContactParams {
  email: string;
  firstname?: string;
  lastname?: string;
  company?: string;
  phone?: string;
  website?: string;
  jobtitle?: string;
}

export interface CreateDealParams {
  dealname: string;
  amount?: number;
  dealstage?: string;
  pipeline?: string;
  closedate?: string;
  hubspot_owner_id?: string;
  associations?: {
    contact_ids?: string[];
    company_ids?: string[];
  };
}

export interface UpdateDealParams {
  dealId: string;
  dealname?: string;
  amount?: number;
  dealstage?: string;
  pipeline?: string;
  closedate?: string;
  hubspot_owner_id?: string;
}

export interface CreateNoteParams {
  entityType: HubspotEntityType;
  entityId: string;
  note: string;
}

export interface GetPipelinesParams {
  entityType: HubspotEntityType;
}

export interface CreateTaskParams {
  hs_task_subject: string;
  hs_task_body?: string;
  hs_task_status?: string;
  hs_task_priority?: string;
  hs_task_type?: string;
  hubspot_owner_id?: string;
  hs_task_for_object_type?: string;
  associations?: {
    contact_ids?: string[];
    company_ids?: string[];
    deal_ids?: string[];
  };
}

export interface AssociateTaskWithEntityParams {
  taskId: string;
  entityType: HubspotEntityType;
  entityId: string;
}

export interface UpdateTaskParams {
  taskId: string;
  hs_task_subject?: string;
  hs_task_body?: string;
  hs_task_status?: string;
  hs_task_priority?: string;
  hs_task_type?: string;
  hubspot_owner_id?: string;
}

export interface TaskSearchParams {
  keyword?: string;
  ownerId?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  limit?: number;
}

export interface CreateTicketParams {
  hs_ticket_subject: string;
  hs_ticket_content?: string;
  hs_ticket_category?: string;
  hs_ticket_priority?: string;
  hs_pipeline_stage?: string;
  hubspot_owner_id?: string;
  associations?: {
    contact_ids?: string[];
    company_ids?: string[];
    deal_ids?: string[];
  };
}

export interface AssociateTicketWithEntityParams {
  ticketId: string;
  entityType: HubspotEntityType;
  entityId: string;
}

export interface UpdateTicketParams {
  ticketId: string;
  hs_ticket_subject?: string;
  hs_ticket_content?: string;
  hs_ticket_category?: string;
  hs_ticket_priority?: string;
  hs_pipeline_stage?: string;
  hubspot_owner_id?: string;
}

export interface TicketSearchParams {
  keyword?: string;
  ownerId?: string;
  stage?: string;
  priority?: string;
  limit?: number;
} 
import { BaseConfig, BaseResponse } from '@clearfeed-ai/quix-common-agent';
import {
  baseTaskSchema,
  taskSearchSchema,
  taskUpdateSchema,
  baseTicketSchema,
  ticketSearchSchema,
  ticketUpdateSchema,
  getPipelinesSchema,
  associateTicketWithEntitySchema
} from './schema';
import { z } from 'zod';

export interface HubspotConfig extends BaseConfig {
  accessToken: string;
  hubId: number;
}

export interface HubspotOwner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface HubspotCompany {
  id: string;
  name: string;
  domain: string;
  industry: string;
  website: string;
  description: string;
}

export interface Deal {
  id: string;
  name: string;
  stage: string;
  amount: number;
  closeDate: string;
  pipeline: string;
  owner?: HubspotOwner;
  companies: HubspotCompany[];
  createdAt: string;
  lastModifiedDate: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  createdAt: string;
  lastModifiedDate: string;
}

export type ContactWithCompanies = Contact & {
  companies: {
    name: string;
    domain: string;
    industry: string;
    website: string;
    description: string;
  }[];
};

export type SearchContactsResponse = BaseResponse<{
  contacts: ContactWithCompanies[];
}>;

export interface CreateDealParams {
  name: string;
  amount?: number;
  stage: string;
  closeDate?: string;
  pipeline?: string;
  ownerId?: string;
  companyId?: string;
}

export type CreateDealResponse = BaseResponse<{
  dealId: string;
}>;

export interface CreateContactParams {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
}

export type CreateContactResponse = BaseResponse<{
  contactId: string;
}>;

export type SearchDealsResponse = BaseResponse<{
  deals: Deal[];
}>;

// Task related enums
export enum TaskStatusEnum {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING = 'WAITING',
  COMPLETED = 'COMPLETED'
}

export enum TaskPriorityEnum {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum TaskTypeEnum {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  TODO = 'TODO'
}

export type Task = z.infer<typeof baseTaskSchema>;
export type TaskSearchParams = z.infer<typeof taskSearchSchema>;
export type UpdateTaskParams = z.infer<typeof taskUpdateSchema>;
export type CreateTaskParams = z.infer<typeof baseTaskSchema> & {
  associatedObjectType: HubspotEntityType;
  associatedObjectId: string;
};

export type CreateTaskResponse = BaseResponse<{
  taskId: string;
  taskDetails: {
    hs_task_subject: string;
    hs_task_status: string;
    hs_task_priority: string;
    hs_task_type: string;
    hs_timestamp: string;
    hs_task_body: string;
  };
}>;

export type UpdateTaskResponse = BaseResponse<{
  taskId: string;
  taskDetails: {
    hs_task_subject: string;
    hs_task_status: string;
    hs_task_priority: string;
    hs_task_type: string;
    hs_timestamp: string;
    hs_task_body: string;
  };
}>;

export interface HubspotTask extends Task {
  id: string;
  createdAt: string;
  lastModifiedDate: string;
}

export type SearchTasksResponse = BaseResponse<{
  tasks: HubspotTask[];
}>;

export enum HubspotEntityType {
  DEAL = 'deal',
  COMPANY = 'company',
  CONTACT = 'contact'
}

export interface CreateNoteParams {
  entityType: HubspotEntityType;
  entityId: string;
  note: string;
}

export type AddNoteResponse = BaseResponse<{
  noteId: string;
}>;

export type AddNoteToDealResponse = AddNoteResponse;

// Ticket related enums
export enum TicketPriorityEnum {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  URGENT = 'URGENT'
}

export type GetPipelinesParams = z.infer<typeof getPipelinesSchema>;
export type Ticket = z.infer<typeof baseTicketSchema>;
export type TicketSearchParams = z.infer<typeof ticketSearchSchema>;
export type UpdateTicketParams = z.infer<typeof ticketUpdateSchema>;
export type CreateTicketParams = z.infer<typeof baseTicketSchema>;
export type AssociateTicketWithEntityParams = z.infer<typeof associateTicketWithEntitySchema>;

export type CreateTicketResponse = BaseResponse<{
  ticket: {
    id: string;
    subject: string;
    stage: string;
    priority: string;
    content: string;
    url: string;
  };
}>;

export type AssociateTicketWithEntityResponse = BaseResponse<{
  ticketId: string;
  associatedObjectType: HubspotEntityType;
  associatedObjectId: string;
}>;

export type UpdateTicketResponse = BaseResponse<{
  ticket: {
    id: string;
    subject: string;
    stage: string;
    priority: string;
    url: string;
  };
}>;

export interface HubspotTicket {
  id: string;
  subject: string;
  content: string;
  priority: string | undefined;
  stage: string | undefined;
  createdAt: string;
  lastModifiedDate: string;
  owner?: HubspotOwner;
  pipeline?: string;
}

export type SearchTicketsResponse = BaseResponse<{
  tickets: HubspotTicket[];
}>;

export type HubspotPipelineStage = {
  id: string;
  label: string;
  archived: boolean;
  displayOrder: number;
};

export type HubspotPipeline = {
  id: string;
  label: string;
  archived: boolean;
  displayOrder: number;
  stages: HubspotPipelineStage[];
};

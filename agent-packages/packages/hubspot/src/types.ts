import { BaseConfig, BaseResponse } from '@clearfeed-ai/quix-common-agent';
import {
  baseTaskSchema,
  taskSearchSchema,
  taskUpdateSchema,
  baseTicketSchema,
  ticketSearchSchema,
  ticketUpdateSchema
} from './schema';
import { z } from 'zod';

export interface HubspotConfig extends BaseConfig {
  accessToken: string;
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
  DEAL = 'deals',
  COMPANY = 'companies',
  CONTACT = 'contacts'
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

export enum TicketStatusEnum {
  NEW = '1',
  WAITING_ON_CONTACT = '2',
  WAITING_ON_US = '3',
  CLOSED = '4'
}

export enum TicketCategoryEnum {
  PRODUCT_ISSUE = 'PRODUCT_ISSUE',
  BILLING_ISSUE = 'BILLING_ISSUE',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
  GENERAL_INQUIRY = 'GENERAL_INQUIRY'
}

export type Ticket = z.infer<typeof baseTicketSchema>;
export type TicketSearchParams = z.infer<typeof ticketSearchSchema>;
export type UpdateTicketParams = z.infer<typeof ticketUpdateSchema>;
export type CreateTicketParams = Ticket & {
  associatedObjectType?: HubspotEntityType;
  associatedObjectId?: string;
};

export type CreateTicketResponse = BaseResponse<{
  ticketId: string;
  ticketDetails: {
    subject: string;
    status: string;
    priority: string;
    category?: string;
    content: string;
  };
}>;

export type UpdateTicketResponse = BaseResponse<{
  ticketId: string;
  ticketDetails: {
    subject: string;
    status: string;
    priority: string;
    category?: string;
  };
}>;

export interface HubspotTicket {
  id: string;
  subject: string;
  content: string;
  priority: string | undefined;
  status: string | undefined;
  category: string | undefined;
  createdAt: string;
  lastModifiedDate: string;
  owner?: HubspotOwner;
}

export type SearchTicketsResponse = BaseResponse<{
  tickets: HubspotTicket[];
}>;

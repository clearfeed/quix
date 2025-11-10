import { BaseConfig, BaseResponse } from '@clearfeed-ai/quix-common-agent';
import {
  baseTaskSchema,
  taskSearchSchema,
  taskUpdateSchema,
  baseTicketSchema,
  ticketSearchSchema,
  ticketUpdateSchema,
  getPipelinesSchema,
  getPropertiesSchema,
  associateTicketWithEntitySchema,
  createDealSchema,
  searchDealsSchema,
  updateDealSchema,
  associateTaskWithEntitySchema,
  createContactSchema,
  updateContactSchema,
  associateDealWithEntitySchema
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
  dealUrl: string;
  [key: string]: string | number | boolean | string[] | HubspotOwner | HubspotCompany[] | undefined;
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
  [key: string]: string | number | boolean | string[] | HubspotCompany[] | undefined;
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

export type CreateContactParams = z.infer<typeof createContactSchema>;

export type CreateContactResponse = BaseResponse<{
  contactId: string;
}>;

export type UpdateContactParams = z.infer<typeof updateContactSchema>;

export type UpdateContactResponse = BaseResponse<{
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    [key: string]: string | number | boolean | string[] | undefined;
  };
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
export type CreateTaskParams = z.infer<typeof baseTaskSchema>;
export type AssociateTaskWithEntityParams = z.infer<typeof associateTaskWithEntitySchema>;

export type CreateTaskResponse = BaseResponse<{
  task: {
    id: string;
    subject: string;
    status: string;
    priority: string;
    type: string;
    timestamp: string;
    body: string;
    url: string;
  };
}>;

export type AssociateTaskWithEntityResponse = BaseResponse<{
  taskId: string;
  associatedObjectType: HubspotEntityType;
  associatedObjectId: string;
}>;

export type UpdateTaskResponse = BaseResponse<{
  task: {
    id: string;
    subject: string;
    status: string;
    priority: string;
    type: string;
    timestamp: string;
    body: string;
    url: string;
  };
}>;

export interface HubspotTask extends Task {
  id: string;
  createdAt: string;
  lastModifiedDate: string;
  url: string;
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
    [key: string]: string | number | boolean | string[] | undefined;
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
  [key: string]: string | number | boolean | string[] | HubspotOwner | undefined;
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

/**
 * Valid HubSpot property types
 */
export const HUBSPOT_PROPERTY_TYPES = [
  'string',
  'number',
  'bool',
  'enumeration',
  'date',
  'datetime',
  'json',
  'object_coordinates'
] as const;

/**
 * Derived type from HUBSPOT_PROPERTY_TYPES constant
 */
export type HubspotPropertyType = (typeof HUBSPOT_PROPERTY_TYPES)[number];

/**
 * Represents a HubSpot property definition including custom fields
 */
export interface HubspotProperty {
  name: string; // Internal property name (case-sensitive)
  label: string; // Display label
  type: HubspotPropertyType;
  fieldType: string; // UI field type (text, select, checkbox, etc.)
  description: string; // Property description
  options?: Array<{ label: string; value: string }>; // Options for select/radio fields
  groupName?: string; // Property group
  hidden?: boolean; // Whether hidden in UI
  displayOrder?: number; // Display order
  hubspotDefined?: boolean; // Whether this is a HubSpot standard property
  calculated?: boolean; // Whether this is a system-calculated property
  createdUserId?: string | null; // User who created the property (for reference)
}

export type GetPropertiesParams = z.infer<typeof getPropertiesSchema>;
export type GetPropertiesResponse = BaseResponse<HubspotProperty[]>;

export type CreateDealParams = z.infer<typeof createDealSchema>;
export type SearchDealsParams = z.infer<typeof searchDealsSchema>;
export type UpdateDealParams = z.infer<typeof updateDealSchema>;

export type AssociateDealWithEntityParams = z.infer<typeof associateDealWithEntitySchema>;

export type AssociateDealWithEntityResponse = BaseResponse<{
  dealId: string;
  associatedObjectType: HubspotEntityType;
  associatedObjectId: string;
}>;

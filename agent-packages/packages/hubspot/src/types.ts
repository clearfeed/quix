import { BaseConfig, BaseResponse } from '@clearfeed-ai/quix-common-agent';
import { baseTaskSchema, createTaskSchema, taskSearchSchema, taskUpdateSchema } from './schema';
import { z } from 'zod';

export interface HubspotConfig extends BaseConfig {
  accessToken: string;
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

export interface HubspotDeal {
  id: string;
  properties: Record<string, string | null>;
  associations?: {
    companies?: {
      results: Array<{
        id: string;
      }>;
    };
  };
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
export type CreateTaskParams = z.infer<typeof createTaskSchema>;

export type CreateTaskResponse = BaseResponse<{
  taskId: string;
}>;

export type UpdateTaskResponse = BaseResponse<{
  taskId: string;
}>;

export interface HubspotTask extends Task {
  id: string;
  associatedObjectType?: HubspotEntityType;
  associatedObjectId?: string;
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

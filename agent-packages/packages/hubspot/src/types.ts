import { BaseConfig, BaseResponse } from '@clearfeed-ai/quix-common-agent';

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

export interface Task {
  id: string;
  title: string;
  body?: string;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'WAITING' | 'COMPLETED';
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate?: string;
  ownerId?: string;
  associatedObjectType?: HubspotEntityType;
  associatedObjectId?: string;
  createdAt: string;
  lastModifiedDate: string;
}

export interface CreateTaskParams {
  title: string;
  body?: string;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'WAITING' | 'COMPLETED';
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate: string;
  ownerId?: string;
  entityId?: string;
  associatedObjectType?: HubspotEntityType;
  associatedObjectId?: string;
}

export interface UpdateTaskParams extends Partial<CreateTaskParams> {
  taskId: string;
}

export type CreateTaskResponse = BaseResponse<{
  taskId: string;
}>;

export type UpdateTaskResponse = BaseResponse<{
  taskId: string;
}>;

export interface TaskSearchParams {
  keyword?: string;
  ownerId?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  dueDateFrom?: string;
  dueDateTo?: string;
}

export type SearchTasksResponse = BaseResponse<{
  tasks: Task[];
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

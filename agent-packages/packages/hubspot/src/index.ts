import { Client } from '@hubspot/api-client';
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/deals';
import {
  SimplePublicObjectInputForCreate,
  SimplePublicObjectInput
} from '@hubspot/api-client/lib/codegen/crm/objects/tasks';
import { BaseService } from '@clearfeed-ai/quix-common-agent';
import {
  HubspotConfig,
  SearchDealsResponse,
  CreateContactParams,
  CreateContactResponse,
  CreateDealParams,
  CreateDealResponse,
  CreateNoteParams,
  AddNoteResponse,
  HubspotEntityType,
  SearchContactsResponse,
  CreateTaskParams,
  CreateTaskResponse,
  UpdateTaskParams,
  UpdateTaskResponse,
  SearchTasksResponse,
  Task,
  TaskSearchParams,
  HubspotOwner,
  HubspotCompany
} from './types';
import { AssociationSpecAssociationCategoryEnum } from '@hubspot/api-client/lib/codegen/crm/objects/notes';
import { validateRequiredFields } from './utils';
import { keyBy } from 'lodash';

export * from './types';
export * from './tools';

export class HubspotService implements BaseService<HubspotConfig> {
  private client: Client;

  constructor(private config: HubspotConfig) {
    const validation = this.validateConfig();
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    this.client = new Client({ accessToken: config.accessToken });
  }

  validateConfig(): { isValid: boolean; error?: string } {
    if (!this.config.accessToken) {
      return { isValid: false, error: 'HubSpot access token is not configured' };
    }
    return { isValid: true };
  }

  async getPipelines(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.client.crm.pipelines.pipelinesApi.getAll('deals');
      return { success: true, data: response.results };
    } catch (error) {
      console.error('Error fetching pipelines:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pipelines'
      };
    }
  }

  async getOwners(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.client.crm.owners.ownersApi.getPage();
      return { success: true, data: response.results };
    } catch (error) {
      console.error('Error fetching owners:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch owners'
      };
    }
  }

  async searchCompanies(
    keyword: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.client.crm.companies.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'name',
                operator: FilterOperatorEnum.ContainsToken,
                value: keyword
              }
            ]
          }
        ],
        properties: ['name', 'domain', 'industry', 'hs_lastmodifieddate'],
        limit: 10
      });

      return {
        success: true,
        data: response.results.map((company) => ({
          id: company.id,
          name: company.properties.name,
          domain: company.properties.domain,
          industry: company.properties.industry,
          lastModified: company.properties.hs_lastmodifieddate
        }))
      };
    } catch (error) {
      console.error('Error searching companies:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search companies'
      };
    }
  }

  async searchContacts(keyword: string): Promise<SearchContactsResponse> {
    try {
      const response = await this.client.crm.contacts.searchApi.doSearch({
        filterGroups: ['email', 'firstname', 'lastname'].map((property) => {
          return {
            filters: [
              { propertyName: property, operator: FilterOperatorEnum.ContainsToken, value: keyword }
            ]
          };
        }),
        properties: [
          'firstname',
          'lastname',
          'email',
          'phone',
          'createdate',
          'hs_lastmodifieddate'
        ],
        sorts: ['createdate'],
        limit: 100,
        after: '0'
      });

      // First, collect all company IDs from all contacts
      const contactCompanyMap = new Map<string, Set<string>>();
      const allCompanyIds = new Set<string>();

      const allContactIds: string[] = response.results.map((contact) => contact.id);

      const associationsResponse = await this.client.crm.associations.v4.batchApi.getPage(
        'contact',
        'companies',
        {
          inputs: allContactIds.map((id) => ({
            id
          }))
        }
      );

      associationsResponse.results.forEach((result) => {
        contactCompanyMap.set(result._from.id, new Set(result.to.map((c) => c.toObjectId)));
        result.to.forEach((c) => allCompanyIds.add(c.toObjectId));
      });

      // Batch fetch all unique companies
      const companies = await this.getCompanyDetails(allCompanyIds);
      const companyMap = keyBy(
        companies.map((company) => {
          return {
            id: company.id,
            name: company.name || '',
            domain: company.domain || '',
            industry: company.industry || '',
            website: company.website || '',
            description: company.description || ''
          };
        }),
        'id'
      );
      // Map contacts with their associated companies
      const contacts = response.results.map((contact) => {
        const associatedCompanies = Array.from(contactCompanyMap.get(contact.id) || [])
          .map((companyId) => companyMap[companyId])
          .filter((company) => company !== undefined);

        return {
          id: contact.id,
          firstName: contact.properties.firstname || '',
          lastName: contact.properties.lastname || '',
          email: contact.properties.email || '',
          phone: contact.properties.phone || undefined,
          companies: associatedCompanies,
          createdAt: contact.properties.createdate || '',
          lastModifiedDate: contact.properties.hs_lastmodifieddate || ''
        };
      });

      return {
        success: true,
        data: { contacts }
      };
    } catch (error) {
      console.error('Error searching HubSpot contacts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search HubSpot contacts'
      };
    }
  }

  async searchDeals(keyword: string): Promise<SearchDealsResponse> {
    try {
      const response = await this.client.crm.deals.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'dealname',
                operator: FilterOperatorEnum.ContainsToken,
                value: keyword
              }
            ]
          }
        ],
        properties: [
          'dealname',
          'pipeline',
          'dealstage',
          'amount',
          'closedate',
          'hubspot_owner_id',
          'createdate',
          'hs_lastmodifieddate'
        ],
        limit: 100
      });

      // First, collect all company IDs from all deals
      const dealCompanyMap = new Map<string, Set<string>>();
      const allCompanyIds = new Set<string>();
      const allDealIds: string[] = response.results.map((deal) => deal.id);
      const associationsResponse = await this.client.crm.associations.v4.batchApi.getPage(
        'deal',
        'companies',
        {
          inputs: allDealIds.map((id) => ({
            id
          }))
        }
      );
      associationsResponse.results.forEach((result) => {
        dealCompanyMap.set(result._from.id, new Set(result.to.map((c) => c.toObjectId)));
        result.to.forEach((c) => allCompanyIds.add(c.toObjectId));
      });

      // Batch fetch all unique companies
      const companies = await this.getCompanyDetails(allCompanyIds);
      const companyMap = keyBy(
        companies.map((company) => {
          return {
            id: company.id,
            name: company.name || '',
            domain: company.domain || '',
            industry: company.industry || '',
            website: company.website || '',
            description: company.description || ''
          };
        }),
        'id'
      );
      // Map deals with their associated companies
      const deals = await Promise.all(
        response.results.map(async (deal) => {
          const associatedCompanies = Array.from(dealCompanyMap.get(deal.id) || [])
            .map((id) => companyMap[id])
            .filter((company) => company !== undefined);

          let owner: HubspotOwner | null = null;

          if (deal.properties.hubspot_owner_id) {
            owner = await this.getOwner(Number(deal.properties.hubspot_owner_id));
          }

          return {
            id: deal.id,
            name: deal.properties.dealname || '',
            stage: deal.properties.dealstage || '',
            amount: parseFloat(deal.properties.amount || '0'),
            closeDate: deal.properties.closedate || '',
            pipeline: deal.properties.pipeline || '',
            ...(owner && { owner }),
            companies: associatedCompanies,
            createdAt: deal.properties.createdate || '',
            lastModifiedDate: deal.properties.hs_lastmodifieddate || ''
          };
        })
      );

      return {
        success: true,
        data: { deals }
      };
    } catch (error) {
      console.error('Error searching HubSpot deals:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search HubSpot deals'
      };
    }
  }

  async createNote(params: CreateNoteParams): Promise<AddNoteResponse> {
    try {
      const { entityType, entityId, note } = params;

      /**
       * @see https://developers.hubspot.com/docs/guides/api/crm/associations/associations-v4#note-to-object
       */
      const associationTypeIds = {
        [HubspotEntityType.DEAL]: 214,
        [HubspotEntityType.COMPANY]: 190,
        [HubspotEntityType.CONTACT]: 202
      };

      const response = await this.client.crm.objects.notes.basicApi.create({
        properties: {
          hs_note_body: note,
          hs_timestamp: new Date().toISOString()
        },
        associations: [
          {
            to: { id: entityId },
            types: [
              {
                associationCategory: AssociationSpecAssociationCategoryEnum.HubspotDefined,
                associationTypeId: associationTypeIds[entityType]
              }
            ]
          }
        ]
      });

      return {
        success: true,
        data: { noteId: response.id }
      };
    } catch (error) {
      console.error('Error creating note:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create note'
      };
    }
  }

  async createDeal(params: CreateDealParams): Promise<CreateDealResponse> {
    try {
      validateRequiredFields({
        params,
        requiredFields: ['name', 'stage']
      });

      const properties: Record<string, string> = {
        dealname: params.name,
        dealstage: params.stage,
        pipeline: params.pipeline || 'default'
      };

      if (params.amount !== undefined) {
        properties.amount = params.amount.toString();
      }
      if (params.closeDate) {
        properties.closedate = params.closeDate;
      }
      if (params.ownerId) {
        properties.hubspot_owner_id = params.ownerId;
      }

      const associations = [];
      if (params.companyId) {
        associations.push({
          to: { id: params.companyId },
          types: [
            {
              associationCategory: AssociationSpecAssociationCategoryEnum.HubspotDefined,
              associationTypeId: 5
            }
          ]
        });
      }

      const response = await this.client.crm.deals.basicApi.create({
        properties,
        associations
      });

      return {
        success: true,
        data: { dealId: response.id }
      };
    } catch (error) {
      console.error('Error creating HubSpot deal:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create HubSpot deal'
      };
    }
  }

  async createContact(params: CreateContactParams): Promise<CreateContactResponse> {
    try {
      validateRequiredFields({
        params,
        requiredFields: ['firstName', 'lastName', 'email']
      });

      const properties: Record<string, string> = {
        firstname: params.firstName,
        lastname: params.lastName,
        email: params.email
      };

      if (params.phone) {
        properties.phone = params.phone;
      }
      if (params.company) {
        properties.company = params.company;
      }

      const response = await this.client.crm.contacts.basicApi.create({
        properties
      });

      return {
        success: true,
        data: { contactId: response.id }
      };
    } catch (error) {
      console.error('Error creating HubSpot contact:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create HubSpot contact'
      };
    }
  }

  async createTask(params: CreateTaskParams): Promise<CreateTaskResponse> {
    try {
      const {
        title,
        status,
        priority,
        taskType,
        body,
        dueDate,
        ownerId,
        associatedObjectType,
        associatedObjectId
      } = params;

      /**
       * @see https://developers.hubspot.com/docs/guides/api/crm/associations/associations-v4#task-to-object
       */
      const associationTypeIds = {
        [HubspotEntityType.DEAL]: 216,
        [HubspotEntityType.COMPANY]: 192,
        [HubspotEntityType.CONTACT]: 204
      };

      const taskInput: SimplePublicObjectInputForCreate = {
        properties: {
          hs_task_subject: title,
          hs_task_status: status,
          hs_task_priority: priority,
          hs_task_type: taskType,
          hs_timestamp: dueDate
        },
        associations: []
      };

      if (body) {
        taskInput.properties.hs_task_body = body;
      }

      if (ownerId) {
        taskInput.properties.hubspot_owner_id = ownerId;
      }

      taskInput.associations.push({
        to: { id: associatedObjectId },
        types: [
          {
            associationCategory: AssociationSpecAssociationCategoryEnum.HubspotDefined,
            associationTypeId: associationTypeIds[associatedObjectType as HubspotEntityType]
          }
        ]
      });

      const response = await this.client.crm.objects.tasks.basicApi.create(taskInput);

      return {
        success: true,
        data: {
          taskId: response.id,
          taskDetails: {
            hs_task_subject: response.properties.hs_task_subject || '',
            hs_task_status: response.properties.hs_task_status || '',
            hs_task_priority: response.properties.hs_task_priority || '',
            hs_task_type: response.properties.hs_task_type || '',
            hs_timestamp: response.properties.hs_timestamp || '',
            hs_task_body: response.properties.hs_task_body || ''
          }
        }
      };
    } catch (error) {
      console.error('Error creating HubSpot task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create HubSpot task'
      };
    }
  }

  async updateTask(params: UpdateTaskParams): Promise<UpdateTaskResponse> {
    try {
      const properties: Record<string, string> = {};

      if (params.title) {
        properties.hs_task_subject = params.title;
      }
      if (params.status) {
        properties.hs_task_status = params.status;
      }
      if (params.priority) {
        properties.hs_task_priority = params.priority;
      }
      if (params.taskType) {
        properties.hs_task_type = params.taskType;
      }
      if (params.body) {
        properties.hs_task_body = params.body;
      }
      if (params.dueDate) {
        properties.hs_timestamp = params.dueDate;
      }
      if (params.ownerId) {
        properties.hubspot_owner_id = params.ownerId;
      }

      const updateInput: SimplePublicObjectInput = { properties };

      const response = await this.client.crm.objects.tasks.basicApi.update(
        params.taskId,
        updateInput
      );

      return {
        success: true,
        data: {
          taskId: response.id,
          taskDetails: {
            hs_task_subject: response.properties.hs_task_subject || '',
            hs_task_status: response.properties.hs_task_status || '',
            hs_task_priority: response.properties.hs_task_priority || '',
            hs_task_type: response.properties.hs_task_type || '',
            hs_timestamp: response.properties.hs_timestamp || '',
            hs_task_body: response.properties.hs_task_body || ''
          }
        }
      };
    } catch (error) {
      console.error('Error updating HubSpot task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update HubSpot task'
      };
    }
  }

  async searchTasks(params: TaskSearchParams): Promise<SearchTasksResponse> {
    try {
      const filterGroups: Array<{
        filters: Array<{ propertyName: string; operator: FilterOperatorEnum; value: string }>;
      }> = [];

      // Add keyword search filters if keyword is provided
      if (params.keyword) {
        filterGroups.push(
          ...['hs_task_subject', 'hs_task_body'].map((property) => ({
            filters: [
              {
                propertyName: property,
                operator: FilterOperatorEnum.ContainsToken,
                value: params.keyword!
              }
            ]
          }))
        );
      }

      // Add owner filter
      if (params.ownerId) {
        filterGroups.push({
          filters: [
            {
              propertyName: 'hubspot_owner_id',
              operator: FilterOperatorEnum.Eq,
              value: params.ownerId
            }
          ]
        });
      }

      // Add status filter
      if (params.status) {
        filterGroups.push({
          filters: [
            {
              propertyName: 'hs_task_status',
              operator: FilterOperatorEnum.Eq,
              value: params.status
            }
          ]
        });
      }

      // Add priority filter
      if (params.priority) {
        filterGroups.push({
          filters: [
            {
              propertyName: 'hs_task_priority',
              operator: FilterOperatorEnum.Eq,
              value: params.priority
            }
          ]
        });
      }

      // Add due date range filters
      if (params.dueDateFrom) {
        filterGroups.push({
          filters: [
            {
              propertyName: 'hs_timestamp',
              operator: FilterOperatorEnum.Gte,
              value: params.dueDateFrom
            }
          ]
        });
      }

      if (params.dueDateTo) {
        filterGroups.push({
          filters: [
            {
              propertyName: 'hs_timestamp',
              operator: FilterOperatorEnum.Lte,
              value: params.dueDateTo
            }
          ]
        });
      }

      const response = await this.client.crm.objects.tasks.searchApi.doSearch({
        filterGroups: filterGroups.length > 0 ? filterGroups : undefined,
        properties: [
          'hs_task_subject',
          'hs_task_body',
          'hs_task_status',
          'hs_task_priority',
          'hs_task_type',
          'hs_timestamp',
          'hubspot_owner_id',
          'createdate',
          'hs_lastmodifieddate'
        ],
        limit: 10
      });

      const tasks = response.results.map((task) => {
        return {
          id: task.id,
          title: task.properties.hs_task_subject || '',
          body: task.properties.hs_task_body || undefined,
          status: task.properties.hs_task_status as Task['status'],
          priority: task.properties.hs_task_priority as Task['priority'],
          taskType: task.properties.hs_task_type as Task['taskType'],
          dueDate: task.properties.hs_timestamp || '',
          ownerId: task.properties.hubspot_owner_id || undefined,
          createdAt: task.properties.createdate || '',
          lastModifiedDate: task.properties.hs_lastmodifieddate || ''
        };
      });

      return {
        success: true,
        data: { tasks }
      };
    } catch (error) {
      console.error('Error searching HubSpot tasks:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search HubSpot tasks'
      };
    }
  }

  async getOwner(ownerId: number): Promise<HubspotOwner | null> {
    try {
      const response = await this.client.crm.owners.ownersApi.getById(ownerId);
      return {
        id: response.userId?.toString() || '',
        firstName: response.firstName || '',
        lastName: response.lastName || '',
        email: response.email || ''
      };
    } catch (error) {
      console.error(`Error fetching owner with ID ${ownerId}: ${error}`);
      return null;
    }
  }

  private async getCompanyDetails(companyIds: Set<string>): Promise<HubspotCompany[]> {
    try {
      const response = await this.client.crm.companies.batchApi.read({
        inputs: Array.from(companyIds).map((id) => ({ id })),
        properties: ['name', 'domain', 'industry', 'website', 'description'],
        propertiesWithHistory: []
      });

      return response.results.map((company) => ({
        id: company.id,
        name: company.properties.name || '',
        domain: company.properties.domain || '',
        industry: company.properties.industry || '',
        website: company.properties.website || '',
        description: company.properties.description || ''
      }));
    } catch (error) {
      console.error('Error fetching company details:', error);
      return [];
    }
  }
}

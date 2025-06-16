import { Client } from '@hubspot/api-client';
import { BaseResponse, BaseService } from '@clearfeed-ai/quix-common-agent';
import {
  HubspotConfig,
  SearchDealsResponse,
  CreateContactParams,
  CreateContactResponse,
  CreateDealParams,
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
  HubspotCompany,
  CreateTicketParams,
  CreateTicketResponse,
  UpdateTicketParams,
  UpdateTicketResponse,
  TicketSearchParams,
  SearchTicketsResponse,
  HubspotTicket,
  HubspotPipeline,
  HubspotPipelineStage,
  AssociateTicketWithEntityParams,
  AssociateTicketWithEntityResponse,
  SearchDealsParams,
  UpdateDealParams,
  AssociateTaskWithEntityParams,
  AssociateTaskWithEntityResponse
} from './types';
import { FilterOperatorEnum as CompanyFilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/companies';
import { FilterOperatorEnum as ContactFilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/contacts';
import {
  AssociationSpecAssociationCategoryEnum as DealAssociationSpecAssociationCategoryEnum,
  SimplePublicObject as DealResponse,
  FilterOperatorEnum as DealFilterOperatorEnum
} from '@hubspot/api-client/lib/codegen/crm/deals';
import {
  FilterOperatorEnum as TicketFilterOperatorEnum,
  SimplePublicObjectInputForCreate as TicketParametersWithAssociations,
  SimplePublicObjectInput as TicketParameters
} from '@hubspot/api-client/lib/codegen/crm/tickets';
import {
  FilterOperatorEnum as TaskFilterOperatorEnum,
  AssociationSpecAssociationCategoryEnum as TaskAssociationSpecAssociationCategoryEnum,
  SimplePublicObjectInputForCreate as TaskParametersWithAssociations,
  SimplePublicObjectInput as TaskParameters
} from '@hubspot/api-client/lib/codegen/crm/objects/tasks';
import { AssociationSpecAssociationCategoryEnum } from '@hubspot/api-client/lib/codegen/crm/objects';
import { keyBy } from 'lodash';
import { ASSOCIATION_TYPE_IDS } from './constants';

export * from './types';
export * from './tools';

export class HubspotService implements BaseService<HubspotConfig> {
  private client: Client;
  constructor(private config: HubspotConfig) {
    this.client = new Client({ accessToken: config.accessToken });
  }

  async getOwners(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.client.crm.owners.ownersApi.getPage();
      return { success: true, data: response.results ? response.results : [] };
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
                operator: CompanyFilterOperatorEnum.ContainsToken,
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
              {
                propertyName: property,
                operator: ContactFilterOperatorEnum.ContainsToken,
                value: keyword
              }
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

  async searchDeals(params: SearchDealsParams): Promise<SearchDealsResponse> {
    try {
      const { keyword, ownerId, stage } = params;

      const filterGroups: Array<{
        filters: Array<{
          propertyName: string;
          operator: DealFilterOperatorEnum;
          value: string;
        }>;
      }> = [];

      if (keyword) {
        filterGroups.push(
          ...['dealname', 'description'].map((property) => ({
            filters: [
              {
                propertyName: property,
                operator: DealFilterOperatorEnum.ContainsToken,
                value: keyword
              }
            ]
          }))
        );
      }

      if (ownerId) {
        filterGroups.push({
          filters: [
            {
              propertyName: 'hubspot_owner_id',
              operator: DealFilterOperatorEnum.Eq,
              value: ownerId
            }
          ]
        });
      }
      if (stage) {
        const modifiedStage = stage?.toLowerCase().replace(/\s+/g, '');
        filterGroups.push({
          filters: [
            {
              propertyName: 'dealstage',
              operator: DealFilterOperatorEnum.Eq,
              value: modifiedStage
            }
          ]
        });
      }

      const searchRequest = {
        ...(filterGroups.length > 0 ? { filterGroups } : {}),
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
      };
      const response = await this.client.crm.deals.searchApi.doSearch(searchRequest);

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
          const dealUrl = this.getDealUrl(deal.id);
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
            lastModifiedDate: deal.properties.hs_lastmodifieddate || '',
            dealUrl
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
        [HubspotEntityType.DEAL]: ASSOCIATION_TYPE_IDS.NOTE_TO_ENTITY.DEAL,
        [HubspotEntityType.COMPANY]: ASSOCIATION_TYPE_IDS.NOTE_TO_ENTITY.COMPANY,
        [HubspotEntityType.CONTACT]: ASSOCIATION_TYPE_IDS.NOTE_TO_ENTITY.CONTACT
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

  async createDeal(
    params: CreateDealParams
  ): Promise<BaseResponse<{ deal: DealResponse; dealUrl: string }>> {
    try {
      const {
        dealname,
        dealstage,
        pipeline,
        companyId,
        contactId,
        ownerId,
        amount,
        closedate,
        description
      } = params;
      const properties: Record<string, string> = {
        dealname
      };

      if (pipeline && dealstage) {
        properties.pipeline = pipeline;
        const validStages = await this.getValidStagesByPipelineId({
          entityType: 'deal',
          pipelineId: pipeline
        });
        if (!validStages || !validStages.length) {
          return {
            success: false,
            error: 'There is no valid stage for the pipeline. Atleast one valid stage is required.'
          };
        }
        const validStage = validStages.find(
          (stage) =>
            stage.label.toLowerCase() === dealstage?.toLowerCase() || stage.id === dealstage
        );
        if (!validStage) {
          return {
            success: false,
            error: 'Deal stage is not valid for the pipeline'
          };
        }
        properties.dealstage = validStage.id;
      }

      if (amount !== undefined) {
        properties.amount = amount.toString();
      }

      if (closedate) {
        properties.closedate = closedate;
      }

      if (description) {
        properties.description = description;
      }

      if (ownerId) {
        properties.hubspot_owner_id = ownerId;
      }

      const associations = [];
      if (companyId) {
        associations.push({
          to: { id: companyId },
          types: [
            {
              associationCategory: DealAssociationSpecAssociationCategoryEnum.HubspotDefined,
              associationTypeId: ASSOCIATION_TYPE_IDS.DEAL_TO_ENTITY.COMPANY
            }
          ]
        });
      }
      if (contactId) {
        associations.push({
          to: { id: contactId },
          types: [
            {
              associationCategory: DealAssociationSpecAssociationCategoryEnum.HubspotDefined,
              associationTypeId: ASSOCIATION_TYPE_IDS.DEAL_TO_ENTITY.CONTACT
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
        data: { deal: response, dealUrl: this.getDealUrl(response.id) }
      };
    } catch (error) {
      console.error('Error creating HubSpot deal:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create HubSpot deal'
      };
    }
  }

  async updateDeal(
    params: UpdateDealParams
  ): Promise<BaseResponse<{ deal: DealResponse; dealUrl: string }>> {
    try {
      const { dealId, dealstage, ownerId } = params;
      let error: string | undefined = undefined;
      const properties: Record<string, string> = {};

      const propertiesToUpdate: (keyof UpdateDealParams)[] = [
        'dealname',
        'amount',
        'closedate',
        'pipeline',
        'description'
      ];

      propertiesToUpdate.forEach((property) => {
        if (params[property]) {
          properties[property] = params[property] as string;
        }
      });

      if (ownerId) {
        properties.hubspot_owner_id = ownerId;
      }

      if (dealstage) {
        const validStage = await this.validateDealStage({
          dealId,
          stage: dealstage
        });
        if (validStage) {
          properties.dealstage = validStage;
        } else {
          error = `The provided deal stage '${dealstage}' is not valid for the pipeline associated with deal ID '${dealId}'. Please provide a valid stage for this deal's pipeline.`;
        }
      }

      const response = await this.client.crm.deals.basicApi.update(dealId, { properties });

      return {
        success: true,
        data: { deal: response, dealUrl: this.getDealUrl(dealId) },
        error
      };
    } catch (error) {
      console.error('Error updating HubSpot deal:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update HubSpot deal'
      };
    }
  }

  private getDealUrl(dealId: string): string {
    return `https://app.hubspot.com/contacts/${this.config.hubId}/deal/${dealId}`;
  }

  async createContact(params: CreateContactParams): Promise<CreateContactResponse> {
    try {
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
      const { title, status, priority, taskType, body, dueDate, ownerId } = params;
      const taskInput: TaskParametersWithAssociations = {
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

      const response = await this.client.crm.objects.tasks.basicApi.create(taskInput);

      return {
        success: true,
        data: {
          task: {
            id: response.id,
            subject: response.properties.hs_task_subject || '',
            status: response.properties.hs_task_status || '',
            priority: response.properties.hs_task_priority || '',
            type: response.properties.hs_task_type || '',
            timestamp: response.properties.hs_timestamp || '',
            body: response.properties.hs_task_body || '',
            url: this.getTaskUrl(response.id)
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

  async associateTaskWithEntity(
    params: AssociateTaskWithEntityParams
  ): Promise<AssociateTaskWithEntityResponse> {
    try {
      const { taskId, associatedObjectType, associatedObjectId } = params;
      const associationTypeIds = {
        [HubspotEntityType.DEAL]: ASSOCIATION_TYPE_IDS.TASK_TO_ENTITY.DEAL,
        [HubspotEntityType.COMPANY]: ASSOCIATION_TYPE_IDS.TASK_TO_ENTITY.COMPANY,
        [HubspotEntityType.CONTACT]: ASSOCIATION_TYPE_IDS.TASK_TO_ENTITY.CONTACT
      };

      const typeId = associationTypeIds[associatedObjectType];

      await this.client.crm.associations.v4.basicApi.create(
        'task',
        taskId,
        associatedObjectType,
        associatedObjectId,
        [
          {
            associationCategory: TaskAssociationSpecAssociationCategoryEnum.HubspotDefined,
            associationTypeId: typeId
          }
        ]
      );

      return {
        success: true,
        data: {
          taskId,
          associatedObjectType,
          associatedObjectId
        }
      };
    } catch (error) {
      console.error('Error associating task with entity:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to associate task with entity'
      };
    }
  }

  async updateTask(params: UpdateTaskParams): Promise<UpdateTaskResponse> {
    try {
      const properties: TaskParameters['properties'] = {};

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

      const updateInput: TaskParameters = { properties };

      const response = await this.client.crm.objects.tasks.basicApi.update(
        params.taskId,
        updateInput
      );

      return {
        success: true,
        data: {
          task: {
            id: response.id,
            subject: response.properties.hs_task_subject || '',
            status: response.properties.hs_task_status || '',
            priority: response.properties.hs_task_priority || '',
            type: response.properties.hs_task_type || '',
            timestamp: response.properties.hs_timestamp || '',
            body: response.properties.hs_task_body || '',
            url: this.getTaskUrl(response.id)
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
        filters: Array<{ propertyName: string; operator: TaskFilterOperatorEnum; value: string }>;
      }> = [];

      // Add keyword search filters if keyword is provided
      if (params.keyword) {
        filterGroups.push(
          ...['hs_task_subject', 'hs_task_body'].map((property) => ({
            filters: [
              {
                propertyName: property,
                operator: TaskFilterOperatorEnum.ContainsToken,
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
              operator: TaskFilterOperatorEnum.Eq,
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
              operator: TaskFilterOperatorEnum.Eq,
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
              operator: TaskFilterOperatorEnum.Eq,
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
              operator: TaskFilterOperatorEnum.Gte,
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
              operator: TaskFilterOperatorEnum.Lte,
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
          lastModifiedDate: task.properties.hs_lastmodifieddate || '',
          url: this.getTaskUrl(task.id)
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

  private getTaskUrl(taskId: string): string {
    return `https://app.hubspot.com/tasks/${this.config.hubId}/view/all/task/${taskId}`;
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

  async createTicket(params: CreateTicketParams): Promise<CreateTicketResponse> {
    try {
      const { subject, content, priority, ownerId, stage, pipeline } = params;

      const ticketInput: TicketParametersWithAssociations = {
        properties: {
          subject,
          content,
          hs_ticket_priority: priority,
          hs_pipeline: pipeline
        },
        associations: []
      };

      if (ownerId) {
        ticketInput.properties.hubspot_owner_id = ownerId;
      }

      if (stage) {
        ticketInput.properties.hs_pipeline_stage = stage;
      } else {
        const validStages = await this.getValidStagesByPipelineId({
          entityType: 'ticket',
          pipelineId: pipeline
        });
        if (!validStages || !validStages.length) {
          return {
            success: false,
            error: 'There is no valid stage for the pipeline. Atleast one valid stage is required.'
          };
        }
        ticketInput.properties.hs_pipeline_stage = validStages[0].id;
      }

      const response = await this.client.crm.tickets.basicApi.create(ticketInput);

      return {
        success: true,
        data: {
          ticket: {
            id: response.id,
            subject: response.properties.subject || '',
            stage: response.properties.hs_pipeline_stage || '',
            priority: response.properties.hs_ticket_priority || '',
            content: response.properties.hs_ticket_body || '',
            url: this.getTicketUrl(response.id)
          }
        }
      };
    } catch (error) {
      console.error('Error creating HubSpot ticket:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create HubSpot ticket'
      };
    }
  }

  async associateTicketWithEntity(
    params: AssociateTicketWithEntityParams
  ): Promise<AssociateTicketWithEntityResponse> {
    try {
      const { ticketId, associatedObjectType, associatedObjectId } = params;
      const associationTypeIds: Record<string, number> = {
        [HubspotEntityType.DEAL]: ASSOCIATION_TYPE_IDS.TICKET_TO_ENTITY.DEAL,
        [HubspotEntityType.COMPANY]: ASSOCIATION_TYPE_IDS.TICKET_TO_ENTITY.COMPANY,
        [HubspotEntityType.CONTACT]: ASSOCIATION_TYPE_IDS.TICKET_TO_ENTITY.CONTACT
      };

      const typeId = associationTypeIds[associatedObjectType];

      await this.client.crm.associations.v4.basicApi.create(
        'ticket',
        ticketId,
        associatedObjectType,
        associatedObjectId,
        [
          {
            associationCategory: TaskAssociationSpecAssociationCategoryEnum.HubspotDefined,
            associationTypeId: typeId
          }
        ]
      );

      return {
        success: true,
        data: {
          ticketId,
          associatedObjectType,
          associatedObjectId
        }
      };
    } catch (error) {
      console.error('Error associating ticket with entity:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to associate ticket with entity'
      };
    }
  }

  async updateTicket(params: UpdateTicketParams): Promise<UpdateTicketResponse> {
    try {
      const { subject, content, stage, priority, ownerId, ticketId } = params;
      const properties: Record<string, string> = {};
      if (subject) {
        properties.subject = subject;
      }
      if (content) {
        properties.content = content;
      }
      if (stage) {
        const validStage = await this.validateTicketStatus({
          ticketId: params.ticketId,
          statusStage: stage
        });
        if (!validStage) {
          return {
            success: false,
            error: 'Invalid ticket status. Please provide a valid ticket status.'
          };
        }
        properties.hs_pipeline_stage = validStage;
      }
      if (priority) {
        properties.hs_ticket_priority = priority;
      }

      if (ownerId) {
        properties.hubspot_owner_id = ownerId;
      }

      const updateInput: TicketParameters = { properties };

      const response = await this.client.crm.tickets.basicApi.update(ticketId, updateInput);

      return {
        success: true,
        data: {
          ticket: {
            id: response.id,
            subject: response.properties.subject || '',
            stage: response.properties.hs_pipeline_stage || '',
            priority: response.properties.hs_ticket_priority || '',
            url: this.getTicketUrl(response.id)
          }
        }
      };
    } catch (error) {
      console.error('Error updating HubSpot ticket:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update HubSpot ticket'
      };
    }
  }
  private getTicketUrl(id: string): string {
    return `https://app.hubspot.com/contacts/${this.config.hubId}/ticket/${id}`;
  }

  async getPipelines(entityType: string): Promise<BaseResponse<HubspotPipeline[]>> {
    try {
      const response = await this.client.crm.pipelines.pipelinesApi.getAll(entityType);

      const result = response.results.map((pipeline) => {
        return {
          id: pipeline.id,
          label: pipeline.label,
          archived: pipeline.archived,
          displayOrder: pipeline.displayOrder,
          stages: pipeline.stages.map((stage) => {
            return {
              id: stage.id,
              label: stage.label,
              archived: stage.archived,
              displayOrder: stage.displayOrder
            };
          })
        };
      });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error fetching ticket pipelines:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch ticket pipelines'
      };
    }
  }

  async getValidStagesByPipelineId({
    entityType,
    pipelineId
  }: {
    entityType: string;
    pipelineId: string;
  }): Promise<HubspotPipelineStage[] | null> {
    try {
      const stageResponse = await this.client.crm.pipelines.pipelineStagesApi.getAll(
        entityType,
        pipelineId
      );
      const validStages = stageResponse.results.filter((stage) => !stage.archived);
      return validStages || null;
    } catch (error) {
      console.error('Error getting pipeline Id', error);
      return null;
    }
  }

  async getTicketById(ticketId: string): Promise<HubspotTicket | null> {
    try {
      const response = await this.client.crm.tickets.basicApi.getById(ticketId, [
        'hs_pipeline',
        'hs_pipeline_stage',
        'hs_ticket_priority',
        'hs_ticket_category',
        'hubspot_owner_id'
      ]);
      const result = {
        id: response.id,
        subject: response.properties.subject || '',
        content: response.properties.hs_ticket_body || '',
        stage: response.properties.hs_pipeline_stage || '',
        priority: response.properties.hs_ticket_priority || '',
        category: response.properties.hs_ticket_category || '',
        ownerId: response.properties.hubspot_owner_id || '',
        createdAt: response.properties.createdate || '',
        lastModifiedDate: response.properties.hs_lastmodifieddate || '',
        pipeline: response.properties.hs_pipeline || ''
      };
      return result || null;
    } catch (error) {
      console.error('Error getting ticket by Id', error);
      return null;
    }
  }

  async validateTicketStatus(params: {
    ticketId: string;
    statusStage: string;
  }): Promise<string | null> {
    try {
      const ticket = await this.getTicketById(params.ticketId);
      if (!ticket?.pipeline) return null;
      const validStages = await this.getValidStagesByPipelineId({
        entityType: 'ticket',
        pipelineId: ticket.pipeline
      });
      if (!validStages) {
        return null;
      }

      const validStage = validStages.find(
        (stage) => stage.label.toLowerCase() === params.statusStage.toLowerCase()
      );

      return validStage?.id || null;
    } catch (error) {
      console.error('Error validating ticket status:', error);
      return null;
    }
  }

  async getDealById(dealId: string): Promise<DealResponse | null> {
    try {
      const response = await this.client.crm.deals.basicApi.getById(dealId, [
        'dealname',
        'dealstage',
        'amount',
        'closedate',
        'description',
        'pipeline',
        'hubspot_owner_id'
      ]);
      return response;
    } catch (error) {
      console.error('Error getting deal by Id', error);
      return null;
    }
  }

  async validateDealStage(params: { dealId: string; stage: string }): Promise<string | null> {
    try {
      const deal = await this.getDealById(params.dealId);
      if (!deal?.properties.pipeline) return null;
      const validStages = await this.getValidStagesByPipelineId({
        entityType: 'deal',
        pipelineId: deal.properties.pipeline
      });
      if (!validStages) {
        return null;
      }
      const validStage = validStages.find(
        (stage) =>
          stage.label.toLowerCase() === params.stage.toLowerCase() || stage.id === params.stage
      );
      return validStage?.id || null;
    } catch (error) {
      console.error('Error validating deal stage:', error);
      return null;
    }
  }

  /**
   * Search for tickets in HubSpot using various filters
   */
  async searchTickets(params: TicketSearchParams): Promise<SearchTicketsResponse> {
    try {
      const filterGroups: Array<{
        filters: Array<{
          propertyName: string;
          operator: TicketFilterOperatorEnum;
          value: string;
        }>;
      }> = [];

      if (params.keyword) {
        filterGroups.push(
          ...['subject', 'content'].map((property) => ({
            filters: [
              {
                propertyName: property,
                operator: TicketFilterOperatorEnum.ContainsToken,
                value: params.keyword!
              }
            ]
          }))
        );
      }

      if (params.ownerId) {
        filterGroups.push({
          filters: [
            {
              propertyName: 'hubspot_owner_id',
              operator: TicketFilterOperatorEnum.Eq,
              value: params.ownerId
            }
          ]
        });
      }

      if (params.stage) {
        filterGroups.push({
          filters: [
            {
              propertyName: 'hs_pipeline_stage',
              operator: TicketFilterOperatorEnum.Eq,
              value: params.stage
            }
          ]
        });
      }

      if (params.priority) {
        filterGroups.push({
          filters: [
            {
              propertyName: 'hs_ticket_priority',
              operator: TicketFilterOperatorEnum.Eq,
              value: params.priority
            }
          ]
        });
      }

      const searchRequest = {
        ...(filterGroups.length > 0 ? { filterGroups } : {}),
        properties: [
          'subject',
          'content',
          'hs_ticket_priority',
          'hs_ticket_category',
          'createdate',
          'hs_lastmodifieddate',
          'hubspot_owner_id'
        ],
        limit: 100
      };

      const response = await this.client.crm.tickets.searchApi.doSearch(searchRequest);

      // Collect owner IDs
      const ownerIds = new Set<string>();
      response.results.forEach((ticket) => {
        if (ticket.properties.hubspot_owner_id) {
          ownerIds.add(ticket.properties.hubspot_owner_id);
        }
      });

      // Get owner details if needed
      const ownerMap: Record<string, HubspotOwner> = {};
      if (ownerIds.size > 0) {
        const ownersResponse = await this.getOwners();
        ownersResponse.data?.forEach((owner: HubspotOwner) => {
          if (owner && owner.id && ownerIds.has(owner.id)) {
            ownerMap[owner.id] = {
              id: owner.id,
              firstName: owner.firstName || '',
              lastName: owner.lastName || '',
              email: owner.email || ''
            };
          }
        });
      }

      const tickets: HubspotTicket[] = response.results.map((ticket) => {
        const ownerId = ticket.properties.hubspot_owner_id;
        const owner = ownerId ? ownerMap[ownerId] : undefined;

        return {
          id: ticket.id,
          url: this.getTicketUrl(ticket.id),
          subject: ticket.properties.subject || '',
          content: ticket.properties.content || '',
          priority: ticket.properties.hs_ticket_priority || '',
          stage: ticket.properties.hs_pipeline_stage || '',
          category: ticket.properties.hs_ticket_category || '',
          createdAt: ticket.properties.createdate || '',
          lastModifiedDate: ticket.properties.hs_lastmodifieddate || '',
          owner
        };
      });

      return {
        success: true,
        data: { tickets }
      };
    } catch (error) {
      console.error('Error searching HubSpot tickets:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search HubSpot tickets'
      };
    }
  }
}

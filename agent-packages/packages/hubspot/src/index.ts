import { Client } from '@hubspot/api-client';
import { BaseResponse, BaseService } from '@clearfeed-ai/quix-common-agent';
import {
  HubspotConfig,
  SearchDealsResponse,
  Deal,
  CreateContactParams,
  CreateContactResponse,
  UpdateContactParams,
  UpdateContactResponse,
  ContactWithCompanies,
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
  UpdateDealResponse,
  AssociateTaskWithEntityParams,
  AssociateTaskWithEntityResponse,
  AssociateDealWithEntityParams,
  AssociateDealWithEntityResponse,
  HubspotProperty,
  GetPropertiesParams,
  GetPropertiesResponse,
  HUBSPOT_PROPERTY_TYPES
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
      // Fetch contact properties metadata to include custom fields
      const propertiesResponse = await this.getProperties('contact');

      const propertiesToFetch = [
        'firstname',
        'lastname',
        'email',
        'phone',
        'createdate',
        'hs_lastmodifieddate'
      ];

      // Add custom properties using metadata filtering
      const customPropertyNames = this.getCustomPropertyNames(propertiesResponse);
      propertiesToFetch.push(...customPropertyNames);

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
        properties: propertiesToFetch,
        sorts: ['createdate'],
        limit: 100,
        after: '0'
      });

      // Define standard properties to exclude from custom properties
      const standardContactProperties = new Set([
        'firstname',
        'lastname',
        'email',
        'phone',
        'createdate',
        'hs_lastmodifieddate'
      ]);

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

        const baseContact: ContactWithCompanies = {
          id: contact.id,
          firstName: contact.properties.firstname || '',
          lastName: contact.properties.lastname || '',
          email: contact.properties.email || '',
          phone: contact.properties.phone || undefined,
          companies: associatedCompanies,
          createdAt: contact.properties.createdate || '',
          lastModifiedDate: contact.properties.hs_lastmodifieddate || ''
        };

        // Add custom properties directly to the contact object
        this.addCustomPropertiesToObject(
          contact.properties,
          standardContactProperties,
          baseContact
        );

        return baseContact;
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

      // Fetch deal properties metadata to include custom fields
      const propertiesResponse = await this.getProperties('deal');

      const propertiesToFetch = [
        'dealname',
        'pipeline',
        'dealstage',
        'amount',
        'closedate',
        'hubspot_owner_id',
        'createdate',
        'hs_lastmodifieddate'
      ];

      // Add custom properties using metadata filtering
      const customPropertyNames = this.getCustomPropertyNames(propertiesResponse);
      propertiesToFetch.push(...customPropertyNames);

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
        properties: propertiesToFetch,
        limit: 100
      };
      const response = await this.client.crm.deals.searchApi.doSearch(searchRequest);

      // Define standard properties to exclude from custom properties
      const standardDealProperties = new Set([
        'dealname',
        'pipeline',
        'dealstage',
        'amount',
        'closedate',
        'hubspot_owner_id',
        'createdate',
        'hs_lastmodifieddate'
      ]);

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
          const baseDeal: Deal = {
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

          // Add custom properties directly to the deal object
          this.addCustomPropertiesToObject(deal.properties, standardDealProperties, baseDeal);

          return baseDeal;
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

      if (typeof amount === 'number') {
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

  async updateDeal(params: UpdateDealParams): Promise<UpdateDealResponse> {
    try {
      const { dealId, dealstage, ownerId, customProperties } = params;
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

      // Transform and add custom properties
      if (customProperties) {
        const transformedCustomProperties =
          this.transformCustomPropertiesToHubSpotFormat(customProperties);
        Object.assign(properties, transformedCustomProperties);
      }

      const response = await this.client.crm.deals.basicApi.update(dealId, { properties });

      const dealData: NonNullable<UpdateDealResponse['data']>['deal'] = {
        id: response.id,
        name: response.properties.dealname || '',
        stage: response.properties.dealstage || '',
        amount: parseFloat(response.properties.amount || '0'),
        closeDate: response.properties.closedate || '',
        pipeline: response.properties.pipeline || '',
        dealUrl: this.getDealUrl(dealId)
      };

      // If custom properties were updated, extract them from the response and add directly
      if (customProperties && Object.keys(customProperties).length > 0) {
        this.extractUpdatedCustomProperties(
          Object.keys(customProperties),
          response.properties,
          dealData
        );
      }

      return {
        success: true,
        data: { deal: dealData },
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

  async updateContact(params: UpdateContactParams): Promise<UpdateContactResponse> {
    try {
      const { contactId, customProperties } = params;
      const properties: Record<string, string> = {};

      if (params.firstName) {
        properties.firstname = params.firstName;
      }
      if (params.lastName) {
        properties.lastname = params.lastName;
      }
      if (params.email) {
        properties.email = params.email;
      }
      if (params.phone) {
        properties.phone = params.phone;
      }
      if (params.company) {
        properties.company = params.company;
      }

      // Transform and add custom properties
      if (customProperties) {
        const transformedCustomProperties =
          this.transformCustomPropertiesToHubSpotFormat(customProperties);
        Object.assign(properties, transformedCustomProperties);
      }

      const response = await this.client.crm.contacts.basicApi.update(contactId, {
        properties
      });

      const contactData: NonNullable<UpdateContactResponse['data']>['contact'] = {
        id: response.id,
        firstName: response.properties.firstname || '',
        lastName: response.properties.lastname || '',
        email: response.properties.email || '',
        phone: response.properties.phone ?? undefined,
        company: response.properties.company ?? undefined
      };

      // If custom properties were updated, extract them from the response and add directly
      if (customProperties && Object.keys(customProperties).length > 0) {
        this.extractUpdatedCustomProperties(
          Object.keys(customProperties),
          response.properties,
          contactData
        );
      }

      return {
        success: true,
        data: {
          contact: contactData
        }
      };
    } catch (error) {
      console.error('Error updating HubSpot contact:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update HubSpot contact'
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

  async associateDealWithEntity(
    params: AssociateDealWithEntityParams
  ): Promise<AssociateDealWithEntityResponse> {
    try {
      const { dealId, associatedObjectType, associatedObjectId } = params;
      const associationTypeIds: Record<string, number> = {
        [HubspotEntityType.COMPANY]: ASSOCIATION_TYPE_IDS.DEAL_TO_ENTITY.COMPANY,
        [HubspotEntityType.CONTACT]: ASSOCIATION_TYPE_IDS.DEAL_TO_ENTITY.CONTACT,
        [HubspotEntityType.DEAL]: ASSOCIATION_TYPE_IDS.DEAL_TO_ENTITY.DEAL
      };

      const typeId = associationTypeIds[associatedObjectType];

      if (!typeId) {
        throw new Error(
          `Unsupported association type: ${associatedObjectType}. Only CONTACT, COMPANY, and DEAL are supported for deal associations.`
        );
      }

      await this.client.crm.associations.v4.basicApi.create(
        'deal',
        dealId,
        associatedObjectType,
        associatedObjectId,
        [
          {
            associationCategory: DealAssociationSpecAssociationCategoryEnum.HubspotDefined,
            associationTypeId: typeId
          }
        ]
      );

      return {
        success: true,
        data: {
          dealId,
          associatedObjectType,
          associatedObjectId
        }
      };
    } catch (error) {
      console.error('Error associating deal with entity:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to associate deal with entity'
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
      const { subject, content, stage, priority, ownerId, ticketId, customProperties } = params;

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

      // Transform and add custom properties
      if (customProperties) {
        const transformedCustomProperties =
          this.transformCustomPropertiesToHubSpotFormat(customProperties);
        Object.assign(properties, transformedCustomProperties);
      }

      const updateInput: TicketParameters = { properties };

      const response = await this.client.crm.tickets.basicApi.update(ticketId, updateInput);

      const ticketData: NonNullable<UpdateTicketResponse['data']>['ticket'] = {
        id: response.id,
        subject: response.properties.subject || '',
        stage: response.properties.hs_pipeline_stage || '',
        priority: response.properties.hs_ticket_priority || '',
        url: this.getTicketUrl(response.id)
      };

      // If custom properties were updated, extract them from the response and add directly
      if (customProperties && Object.keys(customProperties).length > 0) {
        this.extractUpdatedCustomProperties(
          Object.keys(customProperties),
          response.properties,
          ticketData
        );
      }

      return {
        success: true,
        data: {
          ticket: ticketData
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
   * Validates if a string is a valid HubSpot property type
   * @param type - The type string to validate
   * @returns True if the type is valid, false otherwise
   */
  private isValidPropertyType(type: string): type is HubspotProperty['type'] {
    return HUBSPOT_PROPERTY_TYPES.includes(type as HubspotProperty['type']);
  }

  /**
   * Extracts custom property names from property metadata response
   * Filters out hidden, HubSpot-defined, and calculated properties
   * @param propertiesResponse - Response from getProperties API call
   * @returns Array of custom property names
   */
  private getCustomPropertyNames(propertiesResponse: GetPropertiesResponse): string[] {
    if (!propertiesResponse.success || !propertiesResponse.data) {
      return [];
    }

    return propertiesResponse.data
      .filter((prop) => !prop.hidden && !prop.hubspotDefined && !prop.calculated)
      .map((prop) => prop.name);
  }

  /**
   * Adds custom properties directly to target object, excluding standard properties
   * @param sourceProperties - All properties from HubSpot API response
   * @param standardProperties - Set of standard property names to exclude
   * @param targetObject - Object to add custom properties to
   */
  private addCustomPropertiesToObject(
    sourceProperties: Record<string, unknown>,
    standardProperties: Set<string>,
    targetObject: Record<string, unknown>
  ): void {
    Object.keys(sourceProperties).forEach((key) => {
      if (!standardProperties.has(key)) {
        const value = sourceProperties[key];
        if (value !== null && value !== undefined && value !== '') {
          targetObject[key] = value;
        }
      }
    });
  }

  /**
   * Extracts updated custom properties from API response and adds to target object
   * @param customPropertyKeys - Keys of custom properties that were updated
   * @param responseProperties - Properties object from HubSpot API response
   * @param targetObject - Object to add extracted properties to
   */
  private extractUpdatedCustomProperties(
    customPropertyKeys: string[],
    responseProperties: Record<string, unknown>,
    targetObject: Record<string, unknown>
  ): void {
    customPropertyKeys.forEach((key) => {
      const value = responseProperties[key];
      if (value !== undefined && value !== null) {
        targetObject[key] = value;
      }
    });
  }

  /**
   * Transform custom properties to HubSpot-compatible format
   * @param customProperties - Record of custom property key-value pairs
   * @returns Record of transformed properties as strings
   */
  private transformCustomPropertiesToHubSpotFormat(
    customProperties: Record<string, unknown>
  ): Record<string, string> {
    const transformedProperties: Record<string, string> = {};

    for (const [key, value] of Object.entries(customProperties)) {
      // Skip null/undefined values
      if (value === null || value === undefined) {
        continue;
      }

      /**
       * Type-aware value transformation based on HubSpot API requirements:
       * - Enumeration/multi-select: semicolon-separated string
       * - Boolean checkbox: string 'true'/'false'
       * - Number: string representation
       * - Date: ISO 8601 YYYY-MM-DD
       * - Other: direct string conversion
       */
      if (Array.isArray(value)) {
        // Multi-select checkbox or enumeration field
        // HubSpot requires semicolon-separated values
        // Example: ["urgent", "vip"] → "urgent;vip"
        transformedProperties[key] = value.join(';');
      } else if (typeof value === 'boolean') {
        // Boolean checkbox field
        // HubSpot requires string representation
        // Example: true → "true"
        transformedProperties[key] = String(value);
      } else if (typeof value === 'number') {
        // Number field (integer or decimal)
        // HubSpot accepts string representation
        // Example: 42 → "42"
        transformedProperties[key] = String(value);
      } else {
        // String fields (text, textarea, phone, date, etc.)
        // Use value as-is, converted to string
        // For dates, pass ISO 8601 YYYY-MM-DD format strings
        transformedProperties[key] = String(value);
      }
    }

    return transformedProperties;
  }

  /**
   * Search for tickets in HubSpot using various filters
   */
  async searchTickets(params: TicketSearchParams): Promise<SearchTicketsResponse> {
    try {
      // Fetch all ticket properties to include custom fields
      const propertiesResponse = await this.getProperties('ticket');

      const propertiesToFetch = [
        'subject',
        'content',
        'hs_ticket_priority',
        'hs_ticket_category',
        'createdate',
        'hs_lastmodifieddate',
        'hubspot_owner_id',
        'hs_pipeline_stage',
        'hs_pipeline'
      ];

      // Add custom properties using metadata filtering
      if (propertiesResponse.success && propertiesResponse.data) {
        const customPropertyNames = propertiesResponse.data
          .filter((prop) => !prop.hidden && !prop.hubspotDefined && !prop.calculated)
          .map((prop) => prop.name);

        propertiesToFetch.push(...customPropertyNames);
      }

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
        properties: propertiesToFetch,
        limit: 100
      };

      const response = await this.client.crm.tickets.searchApi.doSearch(searchRequest);

      // Standard properties that are explicitly included in the response
      const standardProperties = new Set([
        'subject',
        'content',
        'hs_ticket_priority',
        'hs_ticket_category',
        'createdate',
        'hs_lastmodifieddate',
        'hubspot_owner_id',
        'hs_pipeline_stage',
        'hs_pipeline'
      ]);

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

        const baseTicket: HubspotTicket = {
          id: ticket.id,
          subject: ticket.properties.subject || '',
          content: ticket.properties.content || '',
          priority: ticket.properties.hs_ticket_priority || '',
          stage: ticket.properties.hs_pipeline_stage || '',
          createdAt: ticket.properties.createdate || '',
          lastModifiedDate: ticket.properties.hs_lastmodifieddate || '',
          owner
        };

        // Add custom properties directly to the ticket object
        this.addCustomPropertiesToObject(ticket.properties, standardProperties, baseTicket);

        return baseTicket;
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

  /**
   * Retrieve all properties for a HubSpot object type including custom fields
   * @param objectType - The type of HubSpot object ('ticket', 'deal', or 'contact')
   * @returns BaseResponse containing array of HubspotProperty objects
   */
  async getProperties(
    objectType: GetPropertiesParams['objectType']
  ): Promise<GetPropertiesResponse> {
    try {
      // Map user-facing object types to HubSpot API object types
      const objectTypeMap: Record<string, string> = {
        ticket: 'tickets',
        deal: 'deal',
        contact: 'contact'
      };

      const hubspotObjectType = objectTypeMap[objectType];

      // Call HubSpot Properties API to get all property definitions
      const response = await this.client.crm.properties.coreApi.getAll(hubspotObjectType);

      // Transform API response to our interface including metadata fields
      const properties: HubspotProperty[] = response.results.map((prop) => ({
        name: prop.name,
        label: prop.label,
        type: this.isValidPropertyType(prop.type) ? prop.type : 'string',
        fieldType: prop.fieldType,
        description: prop.description || '',
        options: prop.options?.map((opt) => ({
          label: opt.label,
          value: opt.value
        })),
        groupName: prop.groupName,
        hidden: prop.hidden,
        displayOrder: prop.displayOrder,
        hubspotDefined: prop.hubspotDefined,
        calculated: prop.calculated,
        createdUserId: prop.createdUserId
      }));

      return {
        success: true,
        data: properties
      };
    } catch (error) {
      console.error(`Error fetching ${objectType} properties:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : `Failed to fetch ${objectType} properties`
      };
    }
  }
}

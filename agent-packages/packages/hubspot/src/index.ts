import { Client } from '@hubspot/api-client';
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/deals';
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
  SearchContactsResponse
} from './types';
import { AssociationSpecAssociationCategoryEnum } from '@hubspot/api-client/lib/codegen/crm/objects/notes';
import { validateRequiredFields } from './utils';

export * from './types';
export * from './tools';

interface HubspotDeal {
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

      // Get all associations in parallel
      const associationsPromises = response.results.map(async (contact) => {
        const contactId = contact.id;
        const { results } = await this.client.crm.associations.v4.basicApi.getPage(
          'contact',
          contactId,
          'companies'
        );

        // Store the company IDs for this contact
        const companyIds = new Set(results.map((r) => r.toObjectId));
        contactCompanyMap.set(contactId, companyIds);
        results.forEach((r) => allCompanyIds.add(r.toObjectId));
      });

      await Promise.all(associationsPromises);

      // Batch fetch all unique companies
      const companyPromises = Array.from(allCompanyIds).map(async (companyId) => {
        const company = await this.client.crm.companies.basicApi.getById(companyId, [
          'name',
          'domain',
          'industry',
          'website',
          'description'
        ]);
        return {
          id: companyId,
          name: company.properties.name || '',
          domain: company.properties.domain || '',
          industry: company.properties.industry || '',
          website: company.properties.website || '',
          description: company.properties.description || ''
        };
      });

      const companies = await Promise.all(companyPromises);
      const companyMap = new Map(
        companies.map((c) => [
          c.id,
          {
            name: c.name,
            domain: c.domain,
            industry: c.industry,
            website: c.website,
            description: c.description
          }
        ])
      );

      // Map contacts with their associated companies
      const contacts = response.results.map((contact) => {
        const associatedCompanies = Array.from(contactCompanyMap.get(contact.id) || [])
          .map((companyId) => companyMap.get(companyId))
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
          'hs_lastmodifieddate',
          'associations.company'
        ],
        limit: 10
      });

      const deals = await Promise.all(
        response.results.map(async (deal) => {
          const hubspotDeal = deal as unknown as HubspotDeal;
          let company = 'Unknown';
          let owner = 'Unassigned';

          // Get company name if available
          if (hubspotDeal.associations?.companies?.results?.[0]?.id) {
            const companyResponse = await this.client.crm.companies.basicApi.getById(
              hubspotDeal.associations.companies.results[0].id
            );
            company = companyResponse.properties.name || 'Unknown';
          }

          // Get owner name if available
          if (hubspotDeal.properties.hubspot_owner_id) {
            const ownerId = parseInt(hubspotDeal.properties.hubspot_owner_id, 10);
            if (!isNaN(ownerId)) {
              const ownerResponse = await this.client.crm.owners.ownersApi.getById(ownerId);
              owner = `${ownerResponse.firstName} ${ownerResponse.lastName}`.trim() || 'Unassigned';
            }
          }

          return {
            id: hubspotDeal.id,
            name: hubspotDeal.properties.dealname || 'Unnamed Deal',
            stage: hubspotDeal.properties.dealstage || 'Unknown',
            amount: parseFloat(hubspotDeal.properties.amount || '0'),
            closeDate: hubspotDeal.properties.closedate || '',
            pipeline: hubspotDeal.properties.pipeline || 'Default Pipeline',
            owner,
            company,
            createdAt: hubspotDeal.properties.createdate || '',
            lastModifiedDate: hubspotDeal.properties.hs_lastmodifieddate || ''
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

      // Map of entity types to their association type IDs
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
}

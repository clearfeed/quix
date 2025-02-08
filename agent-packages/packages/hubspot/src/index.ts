import { Client } from '@hubspot/api-client';
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/deals';
import { BaseService } from 'quix-common-agent';
import { HubspotConfig, SearchDealsResponse, Deal } from './types';

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
    this.client = new Client({ accessToken: config.apiKey });
  }

  validateConfig(): { isValid: boolean; error?: string } {
    if (!this.config.apiKey) {
      return {
        isValid: false,
        error: 'HubSpot integration is not configured. Please set HUBSPOT_API_KEY environment variable.'
      };
    }
    return { isValid: true };
  }

  async searchDeals(keyword: string): Promise<SearchDealsResponse> {
    try {
      const validation = this.validateConfig();
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const response = await this.client.crm.deals.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'dealname',
                operator: FilterOperatorEnum.ContainsToken,
                value: keyword,
              },
            ],
          },
        ],
        properties: ['dealname', 'pipeline', 'dealstage', 'amount', 'closedate', 'hubspot_owner_id', 'createdate', 'hs_lastmodifieddate', 'associations.company'],
        limit: 10,
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
            lastModifiedDate: hubspotDeal.properties.hs_lastmodifieddate || '',
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
} 
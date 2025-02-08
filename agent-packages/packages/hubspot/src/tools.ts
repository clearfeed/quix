import { Tool, Tools, createToolsExport } from '@clearfeed/quix-common-agent';
import { HubspotService } from './index';
import { SearchDealsResponse, HubspotConfig } from './types';

export interface HubspotTools extends Tools {
  search_hubspot_deals: Tool<{ keyword: string }, SearchDealsResponse>;
}

export function createHubspotTools(config: HubspotConfig): HubspotTools {
  const service = new HubspotService(config);

  return {
    search_hubspot_deals: {
      type: 'function',
      function: {
        name: 'search_hubspot_deals',
        description: 'Search for deals in HubSpot based on a keyword',
        parameters: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: 'The keyword to search for in HubSpot deals',
            },
          },
          required: ['keyword'],
        },
      },
      handler: ({ keyword }: { keyword: string }) => service.searchDeals(keyword),
    },
  };
}

export function createHubspotToolsExport(config: HubspotConfig) {
  const tools = createHubspotTools(config);
  return createToolsExport(tools);
} 
import { searchHubspotDeals } from "../services/hubspot.service";

const toolsMap = {
    hubspot: {
      search_hubspot_deals: {
        name: 'search_hubspot_deals',
        function: ({ keyword }: { keyword: string }) => searchHubspotDeals(keyword),
        description: 'Search for deals in HubSpot based on a keyword',
      },
  },
} as const;

export const tools = [
  {
    type: 'function' as const,
    function: {
      name: toolsMap.hubspot.search_hubspot_deals.name,
      description: toolsMap.hubspot.search_hubspot_deals.description,
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
  },
]

export const toolHandlers: Record<string, (args: any) => Promise<any>> = {
  [toolsMap.hubspot.search_hubspot_deals.name]: toolsMap.hubspot.search_hubspot_deals.function,
};
import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { HubspotService } from './index';
import { HubspotConfig } from './types';

const HUBSPOT_TOOL_SELECTION_PROMPT = `
HubSpot is a CRM platform that manages:
- Contacts: People and leads with properties like name, email, phone, title, etc.
- Companies: Organizations with properties like name, domain, industry, size, etc.
- Deals: Sales opportunities with stages, amounts, close dates, etc.
- Tickets: Support cases with priority, status, category, etc.
- Marketing: Campaigns, emails, forms, landing pages, etc.

Consider using HubSpot tools when the user wants to:
- Find specific contacts, companies or deals by name/ID/properties
- Look up contact details like email, phone, job title
- Check company information like industry, size, revenue
- View deal status, amount, pipeline stage, close date
- Access ticket details, support history, resolutions
- Get marketing campaign performance and engagement metrics
`;

const HUBSPOT_RESPONSE_GENERATION_PROMPT = `
When formatting HubSpot responses:
- Include contact/company IDs when referencing specific records
- Format important contact details in bold
- Present deal values and stages clearly
- Include relevant contact properties and custom fields
- Format dates in a human-readable format
`;

export function createHubspotToolsExport(config: HubspotConfig): ToolConfig {
  const service = new HubspotService(config);

  const tools: ToolConfig['tools'] = [
    {
      type: 'function',
      function: {
        name: 'search_hubspot_deals',
        description: 'Search for deals in HubSpot based on a keyword',
        parameters: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: 'The keyword to search for in HubSpot deals'
            }
          },
          required: ['keyword']
        }
      }
    }
  ];

  const handlers = {
    search_hubspot_deals: (args: { keyword: string }) => service.searchDeals(args.keyword)
  };

  return {
    tools,
    handlers,
    prompts: {
      toolSelection: HUBSPOT_TOOL_SELECTION_PROMPT,
      responseGeneration: HUBSPOT_RESPONSE_GENERATION_PROMPT
    }
  };
} 
import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { HubspotService } from './index';
import { HubspotConfig } from './types';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
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

const searchDealsSchema = z.object({
  keyword: z.string().describe('The keyword to search for in HubSpot deals')
});

export function createHubspotToolsExport(config: HubspotConfig): ToolConfig {
  const service = new HubspotService(config);

  const tools: DynamicStructuredTool<any>[] = [
    new DynamicStructuredTool({
      name: 'search_hubspot_deals',
      description: 'Search for deals in HubSpot based on a keyword',
      schema: searchDealsSchema,
      func: async (args: z.infer<typeof searchDealsSchema>) => service.searchDeals(args.keyword)
    })
  ]

  return {
    tools,
    prompts: {
      toolSelection: HUBSPOT_TOOL_SELECTION_PROMPT,
      responseGeneration: HUBSPOT_RESPONSE_GENERATION_PROMPT
    }
  };
} 
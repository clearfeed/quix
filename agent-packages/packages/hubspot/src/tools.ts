import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { HubspotService } from './index';
import { CreateContactParams, HubspotConfig } from './types';
import { DynamicStructuredTool, tool } from '@langchain/core/tools';
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

export function createHubspotToolsExport(config: HubspotConfig): ToolConfig {
  const service = new HubspotService(config);

  const tools: DynamicStructuredTool<any>[] = [
    tool(
      async (args: { keyword: string }) => service.searchDeals(args.keyword),
      {
        name: 'search_hubspot_deals',
        description: 'Search for deals in HubSpot based on a keyword',
        schema: z.object({
          keyword: z.string().describe('The keyword to search for in HubSpot deals')
        }),
      }),
    tool(
      async (args: { dealId: string; note: string }) => service.addNoteToDeal(args.dealId, args.note),
      {
        name: 'add_note_to_deal',
        description: 'Add a note to a deal in HubSpot',
        schema: z.object({
          dealId: z.string().describe('The ID of the deal to add a note to'),
          note: z.string().describe('The note to add to the deal')
        }),
      }),
    tool(
      async (args: CreateContactParams) => service.createContact(args),
      {
        name: "create_hubspot_contact",
        description: "Create a new contact in HubSpot",
        schema: z.object({
          firstName: z.string().describe("The first name of the contact"),
          lastName: z.string().describe("The last name of the contact"),
          email: z.string().describe("The email address of the contact"),
          phone: z.string().optional().describe("The phone number of the contact"),
          company: z.string().optional().describe("The company associated with the contact"),
        }),
      }
    ),

  ]

  return {
    tools,
    prompts: {
      toolSelection: HUBSPOT_TOOL_SELECTION_PROMPT,
      responseGeneration: HUBSPOT_RESPONSE_GENERATION_PROMPT
    }
  };
} 
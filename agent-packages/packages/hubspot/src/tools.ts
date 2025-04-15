import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { HubspotService } from './index';
import { CreateContactParams, HubspotConfig, CreateDealParams, HubspotEntityType } from './types';
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
- View and manage deals
- View or manage contacts
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
    tool(async (args: { keyword: string }) => service.searchDeals(args.keyword), {
      name: 'search_hubspot_deals',
      description: 'Search for deals in HubSpot based on a keyword',
      schema: z.object({
        keyword: z.string().describe('The keyword to search for in HubSpot deals')
      })
    }),
    tool(async (args: { keyword: string }) => service.searchContacts(args.keyword), {
      name: 'search_hubspot_contacts',
      description: 'Search for contacts in HubSpot based on name or email',
      schema: z.object({
        keyword: z
          .string()
          .describe('The keyword to search for in contact names or email addresses')
      })
    }),
    tool(
      async (args: { entityId: string; note: string }) =>
        service.createNote({
          entityType: HubspotEntityType.DEAL,
          entityId: args.entityId,
          note: args.note
        }),
      {
        name: 'add_note_to_hubspot_deal',
        description: 'Add a note to a deal in HubSpot',
        schema: z.object({
          entityId: z.string().describe('The ID of the deal'),
          note: z.string().describe('The content of the note')
        })
      }
    ),
    tool(
      async (args: { entityId: string; note: string }) =>
        service.createNote({
          entityType: HubspotEntityType.CONTACT,
          entityId: args.entityId,
          note: args.note
        }),
      {
        name: 'add_note_to_hubspot_contact',
        description: 'Add a note to a contact in HubSpot',
        schema: z.object({
          entityId: z.string().describe('The ID of the contact'),
          note: z.string().describe('The content of the note')
        })
      }
    ),
    tool(
      async (args: { entityId: string; note: string }) =>
        service.createNote({
          entityType: HubspotEntityType.COMPANY,
          entityId: args.entityId,
          note: args.note
        }),
      {
        name: 'add_note_to_hubspot_company',
        description: 'Add a note to a company in HubSpot',
        schema: z.object({
          entityId: z.string().describe('The ID of the company'),
          note: z.string().describe('The content of the note')
        })
      }
    ),
    tool(async (args: CreateDealParams) => service.createDeal(args), {
      name: 'create_hubspot_deal',
      description: 'Create a new deal in HubSpot',
      schema: z.object({
        name: z.string().describe('The name of the deal'),
        amount: z.number().optional().describe('The deal amount'),
        stage: z.string().describe('The deal stage'),
        closeDate: z.string().optional().describe('The close date (YYYY-MM-DD)'),
        pipeline: z.string().optional().describe('The pipeline ID'),
        ownerId: z.string().optional().describe('The owner ID'),
        companyId: z.string().optional().describe('The associated company ID')
      })
    }),
    tool(async (args: CreateContactParams) => service.createContact(args), {
      name: 'create_hubspot_contact',
      description: 'Create a new contact in HubSpot',
      schema: z.object({
        firstName: z.string().describe('The first name of the contact'),
        lastName: z.string().describe('The last name of the contact'),
        email: z.string().describe('The email address of the contact'),
        phone: z.string().optional().describe('The phone number of the contact'),
        company: z.string().optional().describe('The company associated with the contact')
      })
    }),
    tool(async () => service.getPipelines(), {
      name: 'get_hubspot_pipelines',
      description: 'Fetch all deal pipelines and their stages from HubSpot',
      schema: z.object({})
    }),
    tool(async () => service.getOwners(), {
      name: 'get_hubspot_owners',
      description: 'Fetch all HubSpot owners (users) and their IDs',
      schema: z.object({})
    }),
    tool(async (args: { keyword: string }) => service.searchCompanies(args.keyword), {
      name: 'search_hubspot_companies',
      description: 'Search companies in HubSpot based on a keyword (e.g., company name)',
      schema: z.object({
        keyword: z.string().describe('The keyword to search for in company names')
      })
    })
  ];

  return {
    tools,
    prompts: {
      toolSelection: HUBSPOT_TOOL_SELECTION_PROMPT,
      responseGeneration: HUBSPOT_RESPONSE_GENERATION_PROMPT
    }
  };
}

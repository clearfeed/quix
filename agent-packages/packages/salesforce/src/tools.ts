import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { DynamicStructuredTool, tool } from '@langchain/core/tools';
import { z } from 'zod';
import { SalesforceConfig, SearchOpportunitiesParams } from './types';
import { SalesforceService } from './index';
import { CreateTaskParams } from './types/index';

const SALESFORCE_TOOL_SELECTION_PROMPT = `
Salesforce is a CRM platform that manages:
- Leads: Potential customers with properties like name, company, status, etc.
- Accounts: Organizations with properties like name, industry, revenue, etc.
- Opportunities: Sales deals with stages, amounts, close dates, etc.
- Contacts: People associated with accounts with properties like name, title, email, etc.
- Cases: Support tickets with priority, status, description, etc.

Consider using Salesforce tools when the user wants to:
- Find specific opportunities, accounts, or contacts by name/ID/properties
- Look up contact details like email, phone, job title
- Check account information like industry, size, revenue
- View opportunity status, amount, stage, close date
- Access case details, support history, resolutions
`;

const SALESFORCE_RESPONSE_GENERATION_PROMPT = `
When formatting Salesforce responses:
- Include record IDs when referencing specific records
- Format important contact details in bold
- Present opportunity values and stages clearly
- Include relevant record properties and custom fields
- Format dates in a human-readable format
`;

export function createSalesforceToolsExport(config: SalesforceConfig): ToolConfig {
  const service = new SalesforceService(config);

  const tools: DynamicStructuredTool<any>[] = [
    tool(
      async (args: SearchOpportunitiesParams) => service.getOpportunityCount(args),
      {
        name: 'get_salesforce_opportunity_count',
        description: 'Get the count of opportunities in Salesforce based on stage.',
        schema: z.object({
          stage: z.string().optional().describe('The stage of the opportunity to get the count for'),
          keyword: z.string().optional().describe('The keyword to search for in Salesforce opportunities'),
          ownerId: z.string().optional().describe('Salesforce user ID of the opportunity owner. If you have a name or email, use the find_user tool to get the user ID first.')
        }),
      }
    ),
    tool(async () => {
      return service.getOpportunityStages();
    },
      {
        name: 'get_salesforce_opportunity_stages',
        description: 'Get the names of the stages of opportunities in Salesforce',
        schema: z.object({}),
      }
    ),
    tool(
      async (args: SearchOpportunitiesParams) => service.searchOpportunities(args),
      {
        name: 'search_salesforce_opportunities',
        description: 'Search for opportunities in Salesforce based on keyword or stage',
        schema: z.object({
          stage: z.string().optional().describe('The stage of the opportunity to search for'),
          keyword: z.string().optional().describe('The keyword to search for in Salesforce opportunities'),
          ownerId: z.string().optional().describe('Salesforce user ID of the opportunity owner. If you have a name or email, use the find_user tool to get the user ID first.')
        }),
      }
    ),
    tool(
      async (args: { opportunityId: string; note: string; title?: string }) =>
        service.addNoteToOpportunity(args.opportunityId, args.note, args.title),
      {
        name: 'add_note_to_opportunity',
        description: 'Add a note to an opportunity in Salesforce',
        schema: z.object({
          opportunityId: z.string().describe('The ID of the opportunity to add a note to'),
          note: z.string().describe('The note to add to the opportunity'),
          title: z.string().optional().describe('Title for the note, can be auto-generated by the agent')
        }),
      }
    ),
    tool(
      async (args: CreateTaskParams) =>
        service.createTask(args),
      {
        name: 'create_task',
        description: 'Create a task in Salesforce',
        schema: z.object({
          opportunityId: z.string().describe('The ID of the opportunity to create a task for'),
          subject: z.string().describe('The subject of the task'),
          description: z.string().optional().describe('The description of the task'),
          status: z.string().optional().describe('The status of the task'),
          priority: z.string().optional().describe('The priority of the task'),
          ownerId: z.string().optional().describe('The ID of the owner of the task')
        }),
      }
    ),
    tool(
      async (args: { userIdentifier: { name?: string; email?: string } }) =>
        service.findUser(args.userIdentifier),
      {
        name: 'find_user',
        description: 'Find a user in Salesforce based on a name or email',
        schema: z.object({
          userIdentifier: z.union([
            z.object({ name: z.string().describe('The name of the user to find') }),
            z.object({ email: z.string().describe('The email of the user to find') })
          ])
        }),
      }
    )
  ];

  return {
    tools,
    prompts: {
      toolSelection: SALESFORCE_TOOL_SELECTION_PROMPT,
      responseGeneration: SALESFORCE_RESPONSE_GENERATION_PROMPT
    }
  };
} 
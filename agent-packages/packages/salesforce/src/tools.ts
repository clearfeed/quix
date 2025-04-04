import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { DynamicStructuredTool, tool } from '@langchain/core/tools';
import { z } from 'zod';
import { SalesforceConfig } from './types';
import { SalesforceService } from './index';
import { DescribeObjectParams, SalesforceObjectName } from './types/index';
import { taskTools } from './task-tools';
import { accountTools } from './account-tools';
import { opportunityTools } from './opportunity-tools';

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
- Create tasks, notes, or other activities against opportunities, accounts, or contacts
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
        })
      }
    ),
    tool(async (args: DescribeObjectParams) => service.describeObject(args), {
      name: 'describe_object',
      description: 'Describe salesforce objects such as accounts, contacts, opportunities, etc.',
      schema: z.object({
        objectName: z.nativeEnum(SalesforceObjectName)
      })
    }),
    tool(
      async (args: { objectId: string; objectType: SalesforceObjectName }) =>
        service.getObjectDetails(args.objectType, args.objectId),
      {
        name: 'get_object_details',
        description: 'Get details of an object in Salesforce',
        schema: z.object({
          objectId: z.string().describe('The ID of the object to get details for'),
          objectType: z.nativeEnum(SalesforceObjectName)
        })
      }
    )
  ];

  tools.push(...taskTools(config));
  tools.push(...accountTools(config));
  tools.push(...opportunityTools(config));
  return {
    tools,
    prompts: {
      toolSelection: SALESFORCE_TOOL_SELECTION_PROMPT,
      responseGeneration: SALESFORCE_RESPONSE_GENERATION_PROMPT
    }
  };
}

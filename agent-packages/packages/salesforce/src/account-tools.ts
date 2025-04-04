import { DynamicStructuredTool, tool } from '@langchain/core/tools';
import { z } from 'zod';
import { SalesforceConfig } from './index';
import { SalesforceObjectName, SearchAccountsParams } from './types/index';
import { SalesforceAccountService } from './services/account';

export const accountTools = (config: SalesforceConfig): DynamicStructuredTool<any>[] => {
  const service = new SalesforceAccountService(config);
  return [
    tool(async (args: SearchAccountsParams) => service.searchAccounts(args.keyword), {
      name: 'salesforce_search_accounts',
      description: 'Search for accounts in Salesforce based on a keyword',
      schema: z.object({
        keyword: z.string().describe('The keyword to search for in Salesforce accounts')
      })
    }),
    tool(async (args: { accountId: string; objectType: SalesforceObjectName }) =>
      service.getAccountObjects(args.accountId, args.objectType),
    {
      name: 'salesforce_get_account_objects',
      description:
        'Get related objects of an account in Salesforce. For example, you can get opportunities, tasks, notes, contacts, and cases related to an account.',
      schema: z.object({
        accountId: z.string().describe('The ID of the account to get objects for'),
        objectType: z.nativeEnum(SalesforceObjectName).describe('The type of object to get')
      })
    })
  ];
};

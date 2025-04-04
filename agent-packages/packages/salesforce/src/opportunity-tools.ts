import { DynamicStructuredTool, tool } from '@langchain/core/tools';
import { z } from 'zod';
import { SearchOpportunitiesParams } from './types';
import { SalesforceConfig } from './types';
import { SalesforceOpportunityService } from './services/opportunity';

export const opportunityTools = (config: SalesforceConfig): DynamicStructuredTool<any>[] => {
  const service = new SalesforceOpportunityService(config);
  return [
    tool(async (args: SearchOpportunitiesParams) => service.searchOpportunities(args), {
      name: 'salesforce_search_opportunities',
      description:
        'Search for opportunities in Salesforce based on keyword, stage, and/or owner ID',
      schema: z.object({
        keyword: z
          .string()
          .optional()
          .describe('The keyword to search for in Salesforce opportunities'),
        stage: z
          .string()
          .optional()
          .describe('The stage to filter opportunities by (e.g., "Closed Won", "Negotiation")'),
        ownerId: z.string().optional().describe('The ID of the opportunity owner to filter by')
      })
    }),
    tool(
      async (args: { opportunityId: string; note: string; title?: string }) =>
        service.addNoteToOpportunity(args.opportunityId, args.note, args.title),
      {
        name: 'salesforce_add_note_to_opportunity',
        description: 'Add a note to a Salesforce opportunity',
        schema: z.object({
          opportunityId: z.string().describe('The ID of the opportunity to add a note to'),
          note: z.string().describe('The content of the note to add'),
          title: z.string().optional().describe('Optional title for the note')
        })
      }
    ),
    tool(async (args: { opportunityId: string }) => service.getOpportunityUrl(args.opportunityId), {
      name: 'salesforce_get_opportunity_url',
      description: 'Get the URL to view an opportunity in Salesforce',
      schema: z.object({
        opportunityId: z.string().describe('The ID of the opportunity to get the URL for')
      })
    }),
    tool(async () => service.getOpportunityStages(), {
      name: 'salesforce_get_opportunity_stages',
      description: 'Get all available opportunity stages in Salesforce',
      schema: z.object({})
    }),
    tool(async (args: SearchOpportunitiesParams) => service.getOpportunityCount(args), {
      name: 'salesforce_get_opportunity_count',
      description: 'Get the count of opportunities matching the search criteria',
      schema: z.object({
        keyword: z
          .string()
          .optional()
          .describe('The keyword to search for in Salesforce opportunities'),
        stage: z
          .string()
          .optional()
          .describe('The stage to filter opportunities by (e.g., "Closed Won", "Negotiation")'),
        ownerId: z.string().optional().describe('The ID of the opportunity owner to filter by')
      })
    })
  ];
};

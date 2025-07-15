import { ToolOperation, tool } from '@clearfeed-ai/quix-common-agent';
import { z } from 'zod';
import { SearchOpportunitiesParams } from './types';
import { SalesforceConfig } from './types';
import { SalesforceOpportunityService } from './services/opportunity';

const opportunitySearchSchema = z.object({
  keyword: z
    .string()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe('The keyword to search for in Salesforce opportunities'),
  stage: z
    .string()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe('The stage to filter opportunities by (e.g., "Closed Won", "Negotiation")'),
  ownerId: z
    .string()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe('The ID of the opportunity owner to filter by')
});

export const opportunityTools = (config: SalesforceConfig) => {
  const service = new SalesforceOpportunityService(config);
  return [
    tool({
      name: 'salesforce_search_opportunities',
      description:
        'Search for opportunities in Salesforce based on keyword, stage, and/or owner ID',
      schema: opportunitySearchSchema,
      operations: [ToolOperation.READ],
      func: async (args: SearchOpportunitiesParams) => service.searchOpportunities(args)
    }),
    tool({
      name: 'salesforce_add_note_to_opportunity',
      description: 'Add a note to a Salesforce opportunity',
      schema: z.object({
        opportunityId: z.string().describe('The ID of the opportunity to add a note to'),
        note: z.string().describe('The content of the note to add'),
        title: z
          .string()
          .nullish()
          .transform((val) => val ?? undefined)
          .describe('Optional title for the note')
      }),
      operations: [ToolOperation.CREATE],
      func: async (args: { opportunityId: string; note: string; title?: string }) =>
        service.addNoteToOpportunity(args.opportunityId, args.note, args.title)
    }),
    tool({
      name: 'salesforce_get_opportunity_url',
      description: 'Get the URL to view an opportunity in Salesforce',
      schema: z.object({
        opportunityId: z.string().describe('The ID of the opportunity to get the URL for')
      }),
      operations: [ToolOperation.READ],
      func: async (args: { opportunityId: string }) => service.getOpportunityUrl(args.opportunityId)
    }),
    tool({
      name: 'salesforce_get_opportunity_stages',
      description: 'Get all available opportunity stages in Salesforce',
      schema: z.object({}),
      operations: [ToolOperation.READ],
      func: async () => service.getOpportunityStages()
    }),
    tool({
      name: 'salesforce_get_opportunity_count',
      description: 'Get the count of opportunities matching the search criteria',
      schema: opportunitySearchSchema,
      operations: [ToolOperation.READ],
      func: async (args: SearchOpportunitiesParams) => service.getOpportunityCount(args)
    })
  ];
};

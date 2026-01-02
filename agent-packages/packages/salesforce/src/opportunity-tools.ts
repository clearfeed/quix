import { tool } from '@langchain/core/tools';
import { ToolOperation, ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { z } from 'zod';
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

export const addNoteToOpportunitySchema = z.object({
  opportunityId: z.string().describe('The ID of the opportunity to add a note to'),
  note: z.string().describe('The content of the note to add'),
  title: z
    .string()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe('Optional title for the note')
});

export const getOpportunityUrlSchema = z.object({
  opportunityId: z.string().describe('The ID of the opportunity to get the URL for')
});

export const getOpportunityStagesSchema = z.object({});

export const opportunityTools = (config: SalesforceConfig): ToolConfig[] => {
  const service = new SalesforceOpportunityService(config);
  return [
    {
      tool: tool(
        async (args: z.infer<typeof opportunitySearchSchema>) => service.searchOpportunities(args),
        {
          name: 'salesforce_search_opportunities',
          description:
            'Search for opportunities in Salesforce based on keyword, stage, and/or owner ID',
          schema: opportunitySearchSchema
        }
      ),
      operations: [ToolOperation.READ]
    },
    {
      tool: tool(
        async (args: z.infer<typeof addNoteToOpportunitySchema>) =>
          service.addNoteToOpportunity(args.opportunityId, args.note, args.title),
        {
          name: 'salesforce_add_note_to_opportunity',
          description: 'Add a note to a Salesforce opportunity',
          schema: addNoteToOpportunitySchema
        }
      ),
      operations: [ToolOperation.CREATE]
    },
    {
      tool: tool(
        async (args: z.infer<typeof getOpportunityUrlSchema>) =>
          service.getOpportunityUrl(args.opportunityId),
        {
          name: 'salesforce_get_opportunity_url',
          description: 'Get the URL to view an opportunity in Salesforce',
          schema: getOpportunityUrlSchema
        }
      ),
      operations: [ToolOperation.READ]
    },
    {
      tool: tool(
        async (args: z.infer<typeof getOpportunityStagesSchema>) => service.getOpportunityStages(),
        {
          name: 'salesforce_get_opportunity_stages',
          description: 'Get all available opportunity stages in Salesforce',
          schema: getOpportunityStagesSchema
        }
      ),
      operations: [ToolOperation.READ]
    },
    {
      tool: tool(
        async (args: z.infer<typeof opportunitySearchSchema>) => service.getOpportunityCount(args),
        {
          name: 'salesforce_get_opportunity_count',
          description: 'Get the count of opportunities matching the search criteria',
          schema: opportunitySearchSchema
        }
      ),
      operations: [ToolOperation.READ]
    }
  ];
};

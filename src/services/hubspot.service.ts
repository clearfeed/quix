import { Client } from '@hubspot/api-client';
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/deals';
import config from '../config';

const hubspotClient = new Client({ accessToken: config.hubspot.accessToken });

async function getDealStageLabel(stageId: string, pipelineId: string): Promise<string> {
  try {
    const pipelines = await hubspotClient.crm.pipelines.pipelinesApi.getAll('deals');
    const pipeline = pipelines.results.find((p: { id: string }) => p.id === pipelineId);
    if (pipeline) {
      const stage = pipeline.stages.find((s: { id: string }) => s.id === stageId);
      return stage?.label || stageId;
    }
    return stageId;
  } catch (error) {
    console.error('Error fetching deal stage:', error);
    return stageId;
  }
}

export async function searchHubspotDeals(keyword: string) {
  try {
    const response = await hubspotClient.crm.deals.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'dealname',
              operator: FilterOperatorEnum.ContainsToken,
              value: keyword,
            },
          ],
        },
      ],
      properties: ['dealname', 'amount', 'dealstage', 'closedate', 'pipeline'],
      limit: 10,
    });

    const deals = await Promise.all(response.results.map(async deal => {
      const stageId = deal.properties.dealstage || '';
      const pipelineId = deal.properties.pipeline || '';
      return {
        id: deal.id,
        name: deal.properties.dealname,
        amount: deal.properties.amount,
        stage: await getDealStageLabel(stageId, pipelineId),
        closeDate: deal.properties.closedate,
        pipeline: pipelineId,
      };
    }));

    return {
      success: true,
      deals,
    };
  } catch (error) {
    console.error('Error searching HubSpot deals:', error);
    return {
      success: false,
      error: 'Failed to search HubSpot deals',
    };
  }
} 
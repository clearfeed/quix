import { BaseConfig, BaseResponse } from '@clearfeed-ai/quix-common-agent';

export interface SalesforceConfig extends BaseConfig {
  instanceUrl: string;
  accessToken: string;
}

export interface Opportunity {
  id: string;
  name: string;
  stage: string;
  amount: number;
  closeDate: string;
  probability: number;
  accountName: string;
  owner: string;
  createdDate: string;
  lastModifiedDate: string;
}

export type SearchOpportunitiesResponse = BaseResponse<{
  opportunities: Opportunity[];
}>;

export type AddNoteToOpportunityResponse = BaseResponse<{
  noteId: string;
}>; 
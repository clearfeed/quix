import { BaseConfig, BaseResponse } from '@clearfeed/quix-common-agent';

export interface HubspotConfig extends BaseConfig {
  apiKey: string;
}

export interface Deal {
  id: string;
  name: string;
  stage: string;
  amount: number;
  closeDate: string;
  pipeline: string;
  owner: string;
  company: string;
  createdAt: string;
  lastModifiedDate: string;
}

export type SearchDealsResponse = BaseResponse<{
  deals: Deal[];
}>; 
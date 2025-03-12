import { BaseConfig, BaseResponse } from '@clearfeed-ai/quix-common-agent';

export interface HubspotConfig extends BaseConfig {
  accessToken: string;
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

export type AddNoteToDealResponse = BaseResponse<{
  noteId: string;
}>; 
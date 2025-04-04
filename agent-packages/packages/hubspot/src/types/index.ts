export interface HubspotConfig {
  accessToken: string;
}

export interface HubspotDeal {
  id: string;
  name: string | null;
  amount: string | null;
  stage: string;
  closeDate: string | null;
  pipeline: string;
}

export interface HubspotResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SearchDealsResponse
  extends HubspotResponse<{
    deals: HubspotDeal[];
  }> {}

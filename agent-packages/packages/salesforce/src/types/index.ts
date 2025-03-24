// Internal types for Salesforce API responses and processing

export interface SalesforceOpportunity {
  Id: string;
  Name: string | null;
  StageName: string;
  Amount: number | null;
  CloseDate: string | null;
  Probability: number | null;
  Account: {
    Name: string | null;
  };
  Owner: {
    Name: string | null;
  };
  CreatedDate: string;
  LastModifiedDate: string;
}

export interface SalesforceTask {
  Subject: string;
  Description?: string;
  Status?: string;
  Priority?: string;
  OwnerId?: string;
  WhatId?: string;
}

export interface SalesforceNote {
  Title: string;
  Body: string;
  ParentId: string;
  OwnerId: string;
}

export interface SalesforceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type CreateTaskParams = {
  opportunityId: string;
  subject: string;
  description?: string;
  status?: string;
  priority?: string;
  ownerId?: string;
}

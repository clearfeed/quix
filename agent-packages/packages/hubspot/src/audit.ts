import {
  ExternalIntegration,
  ExternalRequestAuditDescriptor,
  ExternalRequestAuditEvent,
  ExternalRequestAuditObserver
} from '@clearfeed-ai/quix-common-agent';

/**
 * Synchronize these HubSpot resource values with:
 * - clearfeed/integrations: src/hubspot/types/audit.ts
 * - clearfeed/app-server: audit-log HubSpot resource types
 */
export enum HubspotRequestAuditResourceType {
  ACCOUNT = 'HubSpotAccount',
  ASSOCIATION = 'HubSpotAssociation',
  COMPANY = 'HubSpotCompany',
  CONTACT = 'HubSpotContact',
  CONVERSATION = 'HubSpotConversation',
  DEAL = 'HubSpotDeal',
  EMAIL = 'HubSpotEmail',
  FILE = 'HubSpotFile',
  NOTE = 'HubSpotNote',
  PIPELINE = 'HubSpotPipeline',
  PROPERTY = 'HubSpotProperty',
  TASK = 'HubSpotTask',
  TICKET = 'HubSpotTicket',
  USER = 'HubSpotUser'
}

export type HubspotRequestAuditDescriptor = ExternalRequestAuditDescriptor<
  ExternalIntegration.HUBSPOT,
  HubspotRequestAuditResourceType
>;

export type HubspotRequestAuditEvent = ExternalRequestAuditEvent<
  ExternalIntegration.HUBSPOT,
  HubspotRequestAuditResourceType
>;

export type HubspotRequestAuditObserver = ExternalRequestAuditObserver<HubspotRequestAuditEvent>;

export {
  emitExternalRequestAuditEvent,
  ExternalHttpMethod,
  ExternalIntegration,
  ExternalRequestOperation,
  ExternalRequestOutcome
} from '@clearfeed-ai/quix-common-agent';

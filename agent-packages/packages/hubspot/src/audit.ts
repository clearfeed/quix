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
  ACCOUNT = 'hubspot_account',
  ASSOCIATION = 'hubspot_association',
  COMPANY = 'hubspot_company',
  CONTACT = 'hubspot_contact',
  CONVERSATION = 'hubspot_conversation',
  DEAL = 'hubspot_deal',
  EMAIL = 'hubspot_email',
  FILE = 'hubspot_file',
  NOTE = 'hubspot_note',
  PIPELINE = 'hubspot_pipeline',
  PROPERTY = 'hubspot_property',
  TASK = 'hubspot_task',
  TICKET = 'hubspot_ticket',
  USER = 'hubspot_user'
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
  ExternalRequestAuditOperation,
  ExternalRequestAuditOutcome
} from '@clearfeed-ai/quix-common-agent';

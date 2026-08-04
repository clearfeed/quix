/**
 * Synchronize this transport contract with:
 * - clearfeed/integrations: src/types/audit.ts
 * - clearfeed/app-server: internal external-request audit DTO
 */

export enum ExternalIntegration {
  HUBSPOT = 'hubspot'
}

export enum ExternalHttpMethod {
  DELETE = 'DELETE',
  GET = 'GET',
  PATCH = 'PATCH',
  POST = 'POST',
  PUT = 'PUT'
}

export enum ExternalRequestOperation {
  ACCESS = 'access',
  UPDATE = 'update'
}

export enum ExternalRequestOutcome {
  FAILURE = 'failure',
  SUCCESS = 'success'
}

export interface ExternalRequestAuditDescriptor<
  TIntegration extends ExternalIntegration = ExternalIntegration,
  TResourceType extends string = string
> {
  integration: TIntegration;
  method: ExternalHttpMethod;
  operation: ExternalRequestOperation;
  action: string;
  resourceType: TResourceType;
  resourceIds?: string[];
}

export interface ExternalRequestAuditEvent<
  TIntegration extends ExternalIntegration = ExternalIntegration,
  TResourceType extends string = string
> extends ExternalRequestAuditDescriptor<TIntegration, TResourceType> {
  outcome: ExternalRequestOutcome;
  statusCode?: number;
  retries?: number;
  occurredAt: string;
}

export type ExternalRequestAuditObserver<
  TEvent extends ExternalRequestAuditEvent = ExternalRequestAuditEvent
> = (event: TEvent) => void | Promise<void>;

export async function emitExternalRequestAuditEvent<TEvent extends ExternalRequestAuditEvent>(
  observer: ExternalRequestAuditObserver<TEvent> | undefined,
  event: TEvent
): Promise<void> {
  if (!observer) return;

  try {
    await observer(event);
  } catch {
    // Audit observer failures must not affect the external request attempt.
  }
}

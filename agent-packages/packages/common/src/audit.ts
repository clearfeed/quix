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

/**
 * Describes a single outbound request to an external integration. Packages annotate every API call
 * they make with a descriptor so the request can be attributed and audited consistently.
 */
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

/**
 * A descriptor enriched with the outcome of the attempt. This is the shape handed to observers.
 */
export interface ExternalRequestAuditEvent<
  TIntegration extends ExternalIntegration = ExternalIntegration,
  TResourceType extends string = string
> extends ExternalRequestAuditDescriptor<TIntegration, TResourceType> {
  outcome: ExternalRequestOutcome;
  statusCode?: number;
  retries?: number;
  occurredAt: string;
}

/**
 * Sink for audit events. Provided by the host application; may be synchronous or asynchronous.
 */
export type ExternalRequestAuditObserver<
  TEvent extends ExternalRequestAuditEvent = ExternalRequestAuditEvent
> = (event: TEvent) => void | Promise<void>;

/**
 * Safely dispatches an audit event to an observer. Observer failures are swallowed so that auditing
 * can never affect the external request attempt.
 */
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

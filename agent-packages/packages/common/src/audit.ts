/**
 * Synchronize this transport contract with:
 * - clearfeed/integrations: src/types/audit.ts
 * - clearfeed/app-server: internal external-request audit DTO
 */

export enum ExternalIntegration {
  HUBSPOT = 'hubspot'
}

export enum HttpMethod {
  DELETE = 'DELETE',
  GET = 'GET',
  PATCH = 'PATCH',
  POST = 'POST',
  PUT = 'PUT'
}

export enum RequestOperation {
  ACCESS = 'access',
  UPDATE = 'update'
}

export enum RequestOutcome {
  FAILURE = 'failure',
  SUCCESS = 'success'
}

/**
 * Describes a single outbound request to an external integration. Packages annotate every API call
 * they make with a descriptor so the request can be attributed and audited consistently.
 */
export interface IntegrationRequestAuditDescriptor<
  TIntegration extends ExternalIntegration = ExternalIntegration,
  TResourceType extends string = string
> {
  integration: TIntegration;
  method: HttpMethod;
  operation: RequestOperation;
  action: string;
  resourceType: TResourceType;
  resourceIds?: string[];
}

/**
 * A descriptor enriched with the outcome of the attempt. This is the shape handed to observers.
 */
export interface IntegrationRequestAuditEvent<
  TIntegration extends ExternalIntegration = ExternalIntegration,
  TResourceType extends string = string
> extends IntegrationRequestAuditDescriptor<TIntegration, TResourceType> {
  outcome: RequestOutcome;
  statusCode?: number;
  retries?: number;
  /**
   * Timestamp when the external request reached its final outcome.
   * Named `occurredAt` to capture the API response outcome time rather than
   * when the corresponding audit-log record is created.
   */
  occurredAt: string;
}

/**
 * Sink for audit events. Provided by the host application; may be synchronous or asynchronous.
 */
export type IntegrationRequestAuditObserver<
  TEvent extends IntegrationRequestAuditEvent = IntegrationRequestAuditEvent
> = (event: TEvent) => void | Promise<void>;

/**
 * Safely dispatches an audit event to an observer. Observer failures are swallowed so that auditing
 * can never affect the integration request attempt.
 */
export async function emitIntegrationRequestAuditEvent<TEvent extends IntegrationRequestAuditEvent>(
  observer: IntegrationRequestAuditObserver<TEvent> | undefined,
  event: TEvent
): Promise<void> {
  if (!observer) return;
  try {
    await observer(event);
  } catch {
    // Audit observer failures must not affect the external request attempt.
  }
}

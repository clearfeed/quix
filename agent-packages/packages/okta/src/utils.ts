import type { OktaAuthConfig } from './types';
import type { ToolCallContext } from '@clearfeed-ai/quix-common-agent';
import { OktaService } from './index';

/**
 * Creates a tool handler that resolves user ID.
 * In restricted mode: resolves userId from user email via context (with API lookup and caching).
 * In unrestricted mode: uses the userId from args.
 */
export function createToolHandler<TArgs extends { userId?: string }, TResult>(
  config: OktaAuthConfig,
  service: OktaService,
  handler: (args: TArgs) => Promise<TResult>
): (args: TArgs, runtime: ToolCallContext | undefined) => Promise<TResult> {
  return async (args: TArgs, runtime: ToolCallContext | undefined): Promise<TResult> => {
    // Unrestricted mode: use userId from args
    if (!config.restrictedModeEnabled) {
      return handler(args);
    }

    // Restricted mode: resolve userId from user email
    const userEmail = runtime?.configurable?.userEmail?.trim()?.toLowerCase();
    if (!userEmail) {
      return {
        success: false,
        error:
          'This operation cannot be performed - the current user does not have an email address configured.'
      } as TResult;
    }

    const cached = config.userPropertiesCache
      ? await config.userPropertiesCache.get(userEmail)
      : null;
    const userId = cached ? cached.userId : await service.getUserIdByEmail(userEmail);

    if (!userId) {
      return {
        success: false,
        error: `This user (${userEmail}) does not have a corresponding Okta account.`
      } as TResult;
    }

    if (config.userPropertiesCache && !cached) {
      await config.userPropertiesCache.set(userEmail, { userId });
    }

    return handler({ ...args, userId });
  };
}

export function extractPrimitives(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle primitive types
  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj
      .map((item) => (typeof item !== 'object' || item === null ? item : extractPrimitives(item)))
      .filter((item) => item !== undefined);
  }

  // Handle objects
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      result[key] = value;
    } else if (typeof value !== 'object') {
      result[key] = value;
    } else if (
      Array.isArray(value) &&
      value.every((item) => typeof item !== 'object' || item === null)
    ) {
      result[key] = value;
    } else {
      const extracted = extractPrimitives(value);
      if (extracted !== undefined) {
        result[key] = extracted;
      }
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

export function validateRequiredFields({
  params,
  requiredFields
}: {
  params: Record<string, any>;
  requiredFields: string[];
}) {
  const missingFields = requiredFields.filter((field) => {
    // Handle nested fields with dot notation
    if (field.includes('.')) {
      const parts = field.split('.');
      let current = params;
      for (const part of parts) {
        if (!current || current[part] === undefined) {
          return true;
        }
        current = current[part];
      }
      return false;
    }

    return params[field] === undefined;
  });

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

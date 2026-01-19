import { BAMBOOHR_CONSTANTS } from './constants';
import type { BambooHRToolsConfig } from './types';
import type { ToolCallContext } from '@clearfeed-ai/quix-common-agent';
import { BambooHRService } from './index';

/**
 * Creates a tool handler that resolves employee ID.
 * In restricted mode: resolves from user email via context (with API lookup and caching).
 * In unrestricted mode: uses the employeeId from args.
 */
export function createToolHandler<TArgs extends { employeeId?: number }, TResult>(
  config: BambooHRToolsConfig,
  service: BambooHRService,
  handler: (args: TArgs) => Promise<TResult>
): (args: TArgs, runtime: ToolCallContext | undefined) => Promise<TResult> {
  return async (args: TArgs, runtime: ToolCallContext | undefined): Promise<TResult> => {
    // Unrestricted mode: use employeeId from args
    if (!config.restrictedModeEnabled) {
      return handler(args);
    }

    // Restricted mode: resolve employeeId from user email
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
    const employeeId = cached ? cached.employeeId : await service.getEmployeeIdByEmail(userEmail);

    if (!employeeId) {
      return {
        success: false,
        error: `This user (${userEmail}) does not have a corresponding BambooHR account.`
      } as TResult;
    }

    if (config.userPropertiesCache && !cached) {
      await config.userPropertiesCache.set(userEmail, { employeeId });
    }

    return handler({ ...args, employeeId });
  };
}

/**
 * Generates current year date range for API calls
 */
export function getCurrentYearDateRange(): { start: string; end: string } {
  const currentYear = new Date().getFullYear();
  return {
    start: `${currentYear}-01-01`,
    end: `${currentYear}-12-31`
  };
}

/**
 * Validates if a date string is in YYYY-MM-DD format
 */
export function isValidDateFormat(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;

  const parsedDate = new Date(date);
  return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
}

/**
 * Builds URL with query parameters for BambooHR API
 */
export function buildApiUrl(
  path: string,
  params: Record<string, string | number | boolean> = {}
): string {
  const url = new URL(path, 'https://example.com'); // Base URL is replaced by axios

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  return url.pathname + url.search;
}

/**
 * Gets employee fields string for API requests
 */
export function getEmployeeFields(includeExtended: boolean = false): string {
  const fields = [...BAMBOOHR_CONSTANTS.EMPLOYEE_FIELDS.BASIC];
  if (includeExtended) {
    fields.push(...BAMBOOHR_CONSTANTS.EMPLOYEE_FIELDS.EXTENDED);
  }
  return fields.join(',');
}

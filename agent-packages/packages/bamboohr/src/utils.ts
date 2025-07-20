/**
 * Utility functions for BambooHR integration
 */

import { BAMBOOHR_CONSTANTS } from './constants';

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

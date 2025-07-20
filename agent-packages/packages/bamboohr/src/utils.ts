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

/**
 * Formats time off type ID to human readable name
 */
export function formatTimeOffTypeName(typeId: string): string {
  const typeMap: Record<string, string> = {
    [BAMBOOHR_CONSTANTS.TIME_OFF_TYPES.VACATION]: 'Vacation',
    [BAMBOOHR_CONSTANTS.TIME_OFF_TYPES.SICK]: 'Sick',
    [BAMBOOHR_CONSTANTS.TIME_OFF_TYPES.BEREAVEMENT]: 'Bereavement',
    [BAMBOOHR_CONSTANTS.TIME_OFF_TYPES.COVID_19]: 'COVID-19 Related',
    [BAMBOOHR_CONSTANTS.TIME_OFF_TYPES.COMP_TIME]: 'Comp Time',
    [BAMBOOHR_CONSTANTS.TIME_OFF_TYPES.FMLA]: 'FMLA'
  };

  return typeMap[typeId] || `Type ${typeId}`;
}

/**
 * Validates date range (start <= end)
 */
export function isValidDateRange(start: string, end: string): boolean {
  if (!isValidDateFormat(start) || !isValidDateFormat(end)) {
    return false;
  }

  return new Date(start) <= new Date(end);
}

import { z } from 'zod';
import { BaseConfig, UserPropertiesCache } from '@clearfeed-ai/quix-common-agent';

export interface BambooHRConfig extends BaseConfig {
  apiKey: string;
  subdomain: string;
}

export type BambooHRToolsConfig = BambooHRConfig & {
  restrictedModeEnabled?: boolean;
  userPropertiesCache?: UserPropertiesCache<{ employeeId: number }>;
};

export interface BambooHREmployee {
  id: number;
  displayName: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  jobTitle: string;
  workPhone: string;
  mobilePhone: string;
  workEmail: string;
  department: string;
  location: string;
  division: string;
  supervisor: string;
  photoUploaded: boolean;
  photoUrl: string;
}

export interface BambooHRTimeOffType {
  id: string;
  name: string;
  icon: string;
}

export interface BambooHRTimeOffBalance {
  timeOffType: string;
  name: string;
  units: string;
  balance: string;
  end: string;
  policyType: string;
  usedYearToDate: string;
}

export interface BambooHRTimeOffRequest {
  id: string;
  employeeId: number;
  status: {
    lastChanged: string;
    lastChangedByUserId: string;
    status: string;
  };
  name: string;
  start: string;
  end: string;
  created: string;
  type: BambooHRTimeOffType;
  amount: {
    unit: string;
    amount: string;
  };
  actions: {
    view: boolean;
    edit: boolean;
    cancel: boolean;
    approve: boolean;
    deny: boolean;
    bypass: boolean;
  };
  dates: Record<string, string>;
  notes?: {
    employee?: string;
    manager?: string;
  };
}

export interface BambooHRTimeOffTypeDetails {
  id: string;
  name: string;
  units: string;
  color: string | null;
  icon: string;
}

// Date validation regex pattern
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const SCHEMAS = {
  listEmployeesSchema: z.object({
    limit: z
      .number()
      .min(1)
      .max(1000)
      .default(1000)
      .describe('Maximum number of employees to return (default: 1000, max: 1000)')
  }),

  getEmployeeSchema: z.object({
    employeeId: z.number().int().positive().describe('The employee ID to get details for')
  }),

  getTimeOffBalanceSchema: z.object({
    employeeId: z.number().int().positive().describe('The employee ID to get time off balance for'),
    endDate: z
      .string()
      .regex(DATE_REGEX, 'End date must be in YYYY-MM-DD format')
      .nullish()
      .transform((val) => val ?? undefined)
      .describe(
        'End date for balance calculation (YYYY-MM-DD format, defaults to current year end)'
      )
  }),

  getTimeOffRequestsSchema: z.object({
    employeeId: z
      .number()
      .int()
      .positive()
      .describe('The employee ID to get time off requests for'),
    startDate: z
      .string()
      .regex(DATE_REGEX, 'Start date must be in YYYY-MM-DD format')
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Start date filter (YYYY-MM-DD format, defaults to current year start)'),
    endDate: z
      .string()
      .regex(DATE_REGEX, 'End date must be in YYYY-MM-DD format')
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('End date filter (YYYY-MM-DD format, defaults to current year end)'),
    status: z
      .enum(['approved', 'denied', 'requested', 'canceled'])
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Filter by request status'),
    limit: z
      .number()
      .min(1)
      .max(100)
      .default(20)
      .describe('Maximum number of requests to return (default: 20, max: 100)')
  }),

  createTimeOffRequestSchema: z.object({
    employeeId: z.number().int().positive().describe('The employee ID requesting time off'),
    timeOffTypeId: z
      .string()
      .describe('The time off type ID (get it using get_bamboohr_time_off_types)'),
    start: z
      .string()
      .regex(DATE_REGEX, 'Start date must be in YYYY-MM-DD format')
      .describe('Start date in YYYY-MM-DD format'),
    end: z
      .string()
      .regex(DATE_REGEX, 'End date must be in YYYY-MM-DD format')
      .describe('End date in YYYY-MM-DD format'),
    amount: z
      .number()
      .min(1, 'Amount must be at least 1')
      .describe('Amount of time off in hours or days'),
    status: z.enum(['approved', 'requested', 'denied']).describe('Status of the time off request'),
    notes: z
      .string()
      .max(500, 'Notes cannot exceed 500 characters')
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Optional notes for the request')
  })
};

// Inferred types from Zod schemas
export type ListEmployeesParams = z.infer<typeof SCHEMAS.listEmployeesSchema>;
export type GetEmployeeParams = z.infer<typeof SCHEMAS.getEmployeeSchema>;
export type GetTimeOffBalanceParams = z.infer<typeof SCHEMAS.getTimeOffBalanceSchema>;
export type GetTimeOffRequestsParams = z.infer<typeof SCHEMAS.getTimeOffRequestsSchema>;
export type CreateTimeOffRequestParams = z.infer<typeof SCHEMAS.createTimeOffRequestSchema>;

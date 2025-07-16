import { z } from 'zod';

export const SCHEMAS = {
  // Create Employee Record
  createEmployeeSchema: z.object({
    first_name: z.string().describe('First name of the employee'),
    last_name: z.string().describe('Last name of the employee'),
    email: z.string().email().describe('Email address of the employee'),
    password: z.string().describe('Password for the employee account'),
    password_confirmation: z.string().describe('Password confirmation'),
    create_for_account: z.string().describe('Account ID to create the employee for')
  }),

  // Reserve Asset
  reserveAssetSchema: z.object({
    asset_name: z.string().describe('Name or description of the asset to reserve'),
    group_name: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Name of the asset group (e.g., "Hardware", "Assets")')
  }),

  // Assign Asset to User
  assignAssetToUserSchema: z.object({
    asset_name: z.string().describe('Name or description of the asset to assign'),
    employee_email: z.string().email().describe('Email of the employee to assign the asset to'),
    group_name: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Name of the asset group (e.g., "Hardware", "Assets")')
  }),

  // Mark Asset as Returned
  markAssetReturnedSchema: z.object({
    employee_email: z.string().email().describe('Email of the employee returning the asset'),
    asset_name: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe(
        'Name of the specific asset to return (optional - will return all assets if not specified)'
      ),
    group_name: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Name of the asset group (e.g., "Hardware", "Assets")')
  }),

  // Assign Software License
  assignSoftwareLicenseSchema: z.object({
    license_name: z
      .string()
      .describe('Name of the software license to assign (e.g., "Figma", "Adobe Creative Suite")'),
    employee_email: z.string().email().describe('Email of the employee to assign the license to'),
    group_name: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Name of the license group (e.g., "Licenses", "Software")')
  }),

  // Reclaim/Deallocate Software License
  reclaimSoftwareLicenseSchema: z.object({
    license_name: z.string().describe('Name of the software license to reclaim'),
    employee_email: z
      .string()
      .email()
      .describe('Email of the employee to reclaim the license from'),
    group_name: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Name of the license group (e.g., "Licenses", "Software")')
  }),

  // Check Asset Availability
  checkAssetAvailabilitySchema: z.object({
    asset_type: z
      .string()
      .describe('Type of asset to check (e.g., "laptop", "monitor", "MacBook")'),
    group_name: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Name of the asset group (e.g., "Hardware", "Assets")')
  }),

  // List Groups
  listGroupsSchema: z.object({
    limit: z.number().nullish().default(50).describe('Number of groups to return')
  }),

  // Search Objects
  searchObjectsSchema: z.object({
    group_id: z.number().describe('ID of the group to search in'),
    search: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Search term for objects'),
    status: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Filter by status (e.g., "Available", "Assigned", "Reserved")'),
    assigned_to: z
      .number()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Filter by assigned user ID')
  }),

  // List Users
  listUsersSchema: z.object({
    limit: z.number().nullish().default(50).describe('Number of users to return')
  })
};

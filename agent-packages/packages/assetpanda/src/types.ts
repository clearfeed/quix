import { BaseConfig, BaseResponse } from '@clearfeed-ai/quix-common-agent';
import { z } from 'zod';

export interface AssetPandaConfig extends BaseConfig {
  apiToken: string;
}

export interface AssetPandaSettings {
  settings: {
    list_items_per_page: number;
    can_apply_plan_option: boolean;
    currency: {
      symbol: string;
      name: string;
    };
    bought_records: number;
    bought_users: number;
    user_field_display_type: string;
    date_format: string;
    time_format: string;
    social_integration: boolean;
    scanning: boolean;
    depreciation_period: number;
    depreciation_allow_mid_schedule: boolean;
    display_barcode: boolean;
    historical_calendar: boolean;
    groups: AssetPandaGroup[];
    tools: string[];
    token_expires_in: number;
    appreciation_period: number;
  };
  submenu_entities: string[];
  company_support: {
    name: string;
    phone: string;
    email: string;
  };
  depreciation_form_fields: {
    name: string;
    key: string;
    type: string;
    is_required: boolean;
  }[];
  appreciation_form_fields: {
    name: string;
    key: string;
    type: string;
    is_required: boolean;
  }[];
  user_access_rules: {
    [key: string]: unknown;
  };
  user_details: {
    id: number;
    email: string;
    created_at: string;
    updated_at: string;
    first_name: string;
    last_name: string;
    phone: string;
    account_id: number;
    is_active: boolean;
    is_admin: boolean;
    timezone: string;
    is_password_temporary: boolean;
    after_action_perform_display: string;
    default_values: unknown[];
    allow_to_create_audit: boolean;
    allow_perform_audit_on_mobile: boolean;
    unread_notifications_count: number;
  };
  records: {
    used_records_percent: string;
    used_records: number;
    max_records: number;
  };
  [key: string]: unknown;
}

export interface AssetPandaUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  account_id: number;
  is_admin: boolean;
  is_active: boolean;
  [key: string]: unknown;
}

export interface AssetPandaGroup {
  id: number;
  name: string;
  key?: string;
  icon?: string;
  is_submenu?: boolean;
  type?: string;
  description?: string;
  [key: string]: unknown;
}

export interface AssetPandaObject {
  id: string;
  display_name: string;
  secondary_name?: string;
  display_with_secondary?: string;
  field_values?: string[];
  data?: {
    field_1?: string;
    field_4?: string;
    field_11?: {
      id: string;
      value: string;
    };
    [key: string]: unknown;
  };
  action_objects?: any[];
  object_depreciation?: boolean;
  object_appreciation?: boolean;
  share_url?: string;
  created_at?: string;
  updated_at?: string;
  is_editable?: boolean;
  is_deletable?: boolean;
  object_version_ids?: string;
  has_audit_history?: boolean;
  is_locked?: boolean;
  is_archived?: boolean;
  entity?: {
    id: number;
    key: string;
  };
  [key: string]: unknown;
}

export interface AssetPandaSearchResponse {
  objects: AssetPandaObject[];
  total: number;
  [key: string]: unknown;
}

export interface CreateUserRequest {
  device: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
    create_for_account: string;
  };
}

export interface CreateObjectRequest {
  [key: string]: unknown;
}

export interface SearchObjectsRequest {
  search?: string;
  status?: string;
  assigned_to?: number;
  [key: string]: unknown;
}

export interface UpdateObjectRequest {
  field_11?: string; // Status field
  field_52?: string; // Assigned to employee
  [key: string]: unknown;
}

export interface GetSettingsResponse extends BaseResponse<AssetPandaSettings> {}
export interface ListUsersResponse extends BaseResponse<AssetPandaUser[]> {}
export interface CreateUserResponse extends BaseResponse<AssetPandaUser> {}
export interface GetUserResponse extends BaseResponse<AssetPandaUser> {}

export interface ListGroupsResponse extends BaseResponse<AssetPandaGroup[]> {}
export interface GetGroupResponse extends BaseResponse<AssetPandaGroup> {}

export interface SearchObjectsResponse extends BaseResponse<AssetPandaSearchResponse> {}
export interface CreateObjectResponse extends BaseResponse<AssetPandaObject> {}
export interface UpdateObjectResponse extends BaseResponse<AssetPandaObject> {}
export interface GetObjectResponse extends BaseResponse<AssetPandaObject> {}

export interface CreateEmployeeResponse extends BaseResponse<AssetPandaUser> {}
export interface ReserveAssetResponse extends BaseResponse<AssetPandaObject> {}
export interface AssignAssetResponse extends BaseResponse<AssetPandaObject> {}
export interface MarkAssetReturnedResponse extends BaseResponse<AssetPandaObject> {}
export interface AssignLicenseResponse extends BaseResponse<AssetPandaObject> {}
export interface ReclaimLicenseResponse extends BaseResponse<AssetPandaObject> {}

// Zod schemas for validation
export const SCHEMAS = {
  getSettingsSchema: z.object({
    settings: z.object({
      list_items_per_page: z.number(),
      can_apply_plan_option: z.boolean(),
      currency: z.object({
        symbol: z.string(),
        name: z.string()
      }),
      bought_records: z.number(),
      bought_users: z.number(),
      user_field_display_type: z.string(),
      date_format: z.string(),
      time_format: z.string(),
      social_integration: z.boolean(),
      scanning: z.boolean(),
      depreciation_period: z.number(),
      depreciation_allow_mid_schedule: z.boolean(),
      display_barcode: z.boolean(),
      historical_calendar: z.boolean(),
      groups: z.array(
        z.object({
          id: z.number(),
          name: z.string(),
          key: z.string(),
          icon: z.string(),
          is_submenu: z.boolean()
        })
      ),
      tools: z.array(z.string()),
      token_expires_in: z.number(),
      appreciation_period: z.number()
    }),
    submenu_entities: z.array(z.string()),
    company_support: z.object({
      name: z.string(),
      phone: z.string(),
      email: z.string()
    }),
    depreciation_form_fields: z.array(
      z.object({
        name: z.string(),
        key: z.string(),
        type: z.string(),
        is_required: z.boolean()
      })
    ),
    appreciation_form_fields: z.array(
      z.object({
        name: z.string(),
        key: z.string(),
        type: z.string(),
        is_required: z.boolean()
      })
    ),
    user_access_rules: z.record(z.unknown()),
    user_details: z.object({
      id: z.number(),
      email: z.string(),
      created_at: z.string(),
      updated_at: z.string(),
      first_name: z.string(),
      last_name: z.string(),
      phone: z.string(),
      account_id: z.number(),
      is_active: z.boolean(),
      is_admin: z.boolean(),
      timezone: z.string(),
      is_password_temporary: z.boolean(),
      after_action_perform_display: z.string(),
      default_values: z.array(z.unknown()),
      allow_to_create_audit: z.boolean(),
      allow_perform_audit_on_mobile: z.boolean(),
      unread_notifications_count: z.number()
    }),
    records: z.object({
      used_records_percent: z.string(),
      used_records: z.number(),
      max_records: z.number()
    })
  }),

  // For /users endpoint (API user, not employee object)
  createUserSchema: z.object({
    first_name: z.string().describe('First name of the user'),
    last_name: z.string().describe('Last name of the user'),
    email: z.string().email().describe('Email address of the user'),
    password: z.string().describe('Password for the user'),
    password_confirmation: z.string().describe('Password confirmation'),
    create_for_account: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Account ID to create the user for (optional)'),
    device: z
      .string()
      .nullish()
      .transform((val) => val ?? 'web')
      .describe('Device type')
  }),

  // For employee object in Employees group
  createEmployeeSchema: z.object({
    name: z.string().describe('Full name of the employee'),
    email: z.string().email().describe('Email address of the employee'),
    employee_id: z.string().describe('Employee ID'),
    status: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Status (optional)')
  }),

  createObjectSchema: z.object({
    group_name: z
      .string()
      .describe(
        'Name of the group to create the object in (e.g., "Assets", "Employees", "Software Licenses")'
      ),
    fields: z
      .record(z.unknown())
      .describe('Dynamic fields for the object (e.g., field_1: "value", field_2: "value")')
  }),

  reserveAssetSchema: z.object({
    asset_name: z.string().describe('Name or description of the asset to reserve'),
    group_name: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Name of the asset group (e.g., "Hardware", "Assets")')
  }),

  assignAssetToUserSchema: z.object({
    asset_name: z.string().describe('Name or description of the asset to assign'),
    employee_email: z.string().email().describe('Email of the employee to assign the asset to'),
    group_name: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Name of the asset group (e.g., "Hardware", "Assets")')
  }),

  markAssetReturnedSchema: z.object({
    employee_email: z.string().email().describe('Email of the employee returning the asset'),
    asset_name: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Name of the specific asset to return (optional)'),
    group_name: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Name of the asset group (e.g., "Hardware", "Assets")')
  }),

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

  listGroupsSchema: z.object({
    limit: z.number().nullish().default(50).describe('Number of groups to return')
  }),

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

  listUsersSchema: z.object({
    limit: z.number().nullish().default(50).describe('Number of users to return')
  })
};

// Type inference from schemas
export type AssetPandaCreateUserRequest = z.infer<typeof SCHEMAS.createUserSchema>;
export type AssetPandaCreateEmployeeRequest = z.infer<typeof SCHEMAS.createEmployeeSchema>;

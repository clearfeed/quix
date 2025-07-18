import { BaseConfig, BaseResponse } from '@clearfeed-ai/quix-common-agent';
import { z } from 'zod';
import { SCHEMAS } from './schema';

export interface AssetPandaConfig extends BaseConfig {
  apiToken: string;
}

export type AssetPandaCreateUserRequest = z.infer<typeof SCHEMAS.createUserSchema>;
export type AssetPandaCreateEmployeeRequest = z.infer<typeof SCHEMAS.createEmployeeSchema>;

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

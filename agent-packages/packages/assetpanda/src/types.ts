import { BaseConfig, BaseResponse } from '@clearfeed-ai/quix-common-agent';

export interface AssetPandaConfig extends BaseConfig {
  apiToken: string;
}

// AssetPanda User/Employee interface
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

// AssetPanda Group interface
export interface AssetPandaGroup {
  id: number;
  name: string;
  type?: string;
  description?: string;
  [key: string]: unknown;
}

// AssetPanda Object (Asset/License) interface
export interface AssetPandaObject {
  id: number;
  name: string;
  status?: string;
  assigned_to?: number | null;
  assigned_users?: number[];
  available_seats?: number;
  total_seats?: number;
  group_id: number;
  [key: string]: unknown;
}

// AssetPanda Search Response interface
export interface AssetPandaSearchResponse {
  objects: AssetPandaObject[];
  total: number;
  [key: string]: unknown;
}

// Create User Request interface
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

// Search Objects Request interface
export interface SearchObjectsRequest {
  search?: string;
  status?: string;
  assigned_to?: number;
  [key: string]: unknown;
}

// Update Object Request interface
export interface UpdateObjectRequest {
  status_field_id?: string;
  assigned_to?: number | null;
  assigned_users?: number[];
  available_seats?: number;
  [key: string]: unknown;
}

// Response type interfaces
export interface ListUsersResponse extends BaseResponse<AssetPandaUser[]> {}
export interface CreateUserResponse extends BaseResponse<AssetPandaUser> {}
export interface GetUserResponse extends BaseResponse<AssetPandaUser> {}

export interface ListGroupsResponse extends BaseResponse<AssetPandaGroup[]> {}
export interface GetGroupResponse extends BaseResponse<AssetPandaGroup> {}

export interface SearchObjectsResponse extends BaseResponse<AssetPandaSearchResponse> {}
export interface UpdateObjectResponse extends BaseResponse<AssetPandaObject> {}
export interface GetObjectResponse extends BaseResponse<AssetPandaObject> {}

// Tool-specific response interfaces
export interface CreateEmployeeResponse extends BaseResponse<AssetPandaUser> {}
export interface ReserveAssetResponse extends BaseResponse<AssetPandaObject> {}
export interface AssignAssetResponse extends BaseResponse<AssetPandaObject> {}
export interface MarkAssetReturnedResponse extends BaseResponse<AssetPandaObject> {}
export interface AssignLicenseResponse extends BaseResponse<AssetPandaObject> {}
export interface ReclaimLicenseResponse extends BaseResponse<AssetPandaObject> {}

import { BaseConfig, BaseResponse } from '@clearfeed-ai/quix-common-agent';

export interface JumpCloudConfig extends BaseConfig {
  apiKey: string;
}

// JumpCloud User interface
export interface JumpCloudUser {
  id: string;
  username: string;
  email: string;
  firstname?: string;
  lastname?: string;
  displayname?: string;
  activated?: boolean;
  created?: string;
  lastUpdated?: string;
  organization?: string;
  department?: string;
  costCenter?: string;
  employeeType?: string;
  description?: string;
  location?: string;
  addresses?: Array<{
    type: string;
    streetAddress?: string;
    locality?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  }>;
  phoneNumbers?: Array<{
    type: string;
    number: string;
  }>;
  // Additional fields that may be returned by the API
  [key: string]: unknown;
}

// JumpCloud Group interface
export interface JumpCloudGroup {
  id: string;
  name: string;
  type?: string;
  created?: string;
  lastUpdated?: string;
  memberQueryType?: string;
  memberQuery?: unknown;
  memberQueryExemptions?: unknown[];
  memberSuggestionsNotify?: boolean;
  membershipAutomated?: boolean;
  // Additional fields that may be returned by the API
  [key: string]: unknown;
}

// JumpCloud Application interface
export interface JumpCloudApplication {
  id: string;
  name: string;
  displayName?: string;
  displayLabel?: string;
  ssoUrl?: string;
  created?: string;
  lastUpdated?: string;
  active?: boolean;
  config?: {
    [key: string]: unknown;
  };
  // Additional fields that may be returned by the API
  [key: string]: unknown;
}

// Response type interfaces
export interface ListUsersResponse extends BaseResponse<JumpCloudUser[]> {}
export interface CreateUserResponse extends BaseResponse<JumpCloudUser> {}
export interface GetUserResponse extends BaseResponse<JumpCloudUser> {}
export interface UpdateUserResponse extends BaseResponse<JumpCloudUser> {}
export interface DeleteUserResponse extends BaseResponse<string> {}

export interface ListGroupsResponse extends BaseResponse<JumpCloudGroup[]> {}
export interface CreateGroupResponse extends BaseResponse<JumpCloudGroup> {}
export interface AssignUserToGroupResponse extends BaseResponse<string> {}
export interface UnassignUserFromGroupResponse extends BaseResponse<string> {}
export interface ListGroupUsersResponse extends BaseResponse<JumpCloudUser[]> {}
export interface DeleteGroupResponse extends BaseResponse<string> {}

export interface ListApplicationsResponse extends BaseResponse<JumpCloudApplication[]> {}
export interface AssignUserToApplicationResponse extends BaseResponse<JumpCloudApplication> {}
export interface UnassignUserFromApplicationResponse extends BaseResponse<string> {}
export interface AssignGroupToApplicationResponse extends BaseResponse<JumpCloudApplication> {}
export interface UnassignGroupFromApplicationResponse extends BaseResponse<string> {}
export interface DeleteApplicationResponse extends BaseResponse<string> {}
export interface DeactivateApplicationResponse extends BaseResponse<string> {}

import { BaseConfig, BaseResponse } from '@clearfeed-ai/quix-common-agent';

export interface JumpCloudConfig extends BaseConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface ListUsersResponse extends BaseResponse<any[]> {}
export interface CreateUserResponse extends BaseResponse<any> {}
export interface GetUserResponse extends BaseResponse<any> {}
export interface UpdateUserResponse extends BaseResponse<any> {}
export interface DeleteUserResponse extends BaseResponse<string> {}

export interface ListGroupsResponse extends BaseResponse<any[]> {}
export interface CreateGroupResponse extends BaseResponse<any> {}
export interface AssignUserToGroupResponse extends BaseResponse<string> {}
export interface UnassignUserFromGroupResponse extends BaseResponse<string> {}
export interface ListGroupUsersResponse extends BaseResponse<any[]> {}
export interface DeleteGroupResponse extends BaseResponse<string> {}

export interface ListApplicationsResponse extends BaseResponse<any[]> {}
export interface AssignUserToApplicationResponse extends BaseResponse<any> {}
export interface UnassignUserFromApplicationResponse extends BaseResponse<string> {}
export interface AssignGroupToApplicationResponse extends BaseResponse<any> {}
export interface UnassignGroupFromApplicationResponse extends BaseResponse<string> {}
export interface DeleteApplicationResponse extends BaseResponse<string> {}
export interface DeactivateApplicationResponse extends BaseResponse<string> {}

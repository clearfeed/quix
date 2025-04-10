import { BaseConfig, BaseResponse } from '@clearfeed-ai/quix-common-agent';

export interface OktaConfig extends BaseConfig {
  orgUrl: string;
  token: string;
}

export interface ListUsersResponse extends BaseResponse {
  data?: any;
}

export interface CreateUserResponse extends BaseResponse {
  data?: any;
}

export interface GetUserResponse extends BaseResponse {
  data?: any;
}

export interface UpdateUserResponse extends BaseResponse {
  data?: any;
}

export interface DeleteUserResponse extends BaseResponse {
  data?: string;
}

export interface ListGroupsResponse extends BaseResponse {
  data?: any;
}

export interface CreateGroupResponse extends BaseResponse {
  data?: any;
}

export interface AssignUserToGroupResponse extends BaseResponse {
  data?: string;
}

export interface ListApplicationsResponse extends BaseResponse {
  data?: any;
}

export interface AssignUserToApplicationResponse extends BaseResponse {
  data?: any;
}

export interface AssignGroupToApplicationResponse extends BaseResponse {
  data?: any;
}

export interface DeleteApplicationResponse extends BaseResponse {
  data?: string;
}

export interface DeactivateApplicationResponse extends BaseResponse {
  data?: string;
}

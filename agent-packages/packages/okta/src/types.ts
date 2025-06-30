import { BaseConfig, BaseResponse } from '@clearfeed-ai/quix-common-agent';
import {
  Application,
  ApplicationGroupAssignment,
  AppUser,
  Group,
  User,
  UserActivationToken
} from '@okta/okta-sdk-nodejs';

export interface OktaConfig extends BaseConfig {
  orgUrl: string;
}

export interface OktaTokenConfig extends OktaConfig {
  token: string;
}

export interface OktaPrivateKeyConfig extends OktaConfig {
  authorizationMode: 'PrivateKey';
  clientId: string;
  scopes: string[];
  privateKey: string;
  privateKeyId: string;
}

export type OktaAuthConfig = OktaTokenConfig | OktaPrivateKeyConfig;

export interface ListUsersResponse extends BaseResponse<User[]> {}

export interface CreateUserResponse extends BaseResponse<User> {}

export interface GetUserResponse extends BaseResponse<User> {}

export interface UpdateUserResponse extends BaseResponse<User> {}

export interface SuspendUserResponse extends BaseResponse<string> {}

export interface UnsuspendUserResponse extends BaseResponse<string> {}

export interface ActivateUserResponse extends BaseResponse<UserActivationToken> {}

export interface DeactivateUserResponse extends BaseResponse<string> {}

export interface UnlockUserResponse extends BaseResponse<string> {}

export interface ResetUserPasswordResponse extends BaseResponse<string> {}

export interface ExpireUserPasswordResponse extends BaseResponse<string> {}

export interface ResetUserFactorsResponse extends BaseResponse<string> {}

export interface DeleteUserResponse extends BaseResponse<string> {}

export interface ListGroupsResponse extends BaseResponse<Group[]> {}

export interface CreateGroupResponse extends BaseResponse<Group> {}

export interface AssignUserToGroupResponse extends BaseResponse<string> {}

export interface UnassignUserFromGroupResponse extends BaseResponse<string> {}

export interface ListGroupUsersResponse extends BaseResponse<User[]> {}

export interface DeleteGroupResponse extends BaseResponse<string> {}

export interface ListApplicationsResponse extends BaseResponse<Application[]> {}

export interface AssignUserToApplicationResponse extends BaseResponse<AppUser> {}

export interface UnassignUserFromApplicationResponse extends BaseResponse<string> {}

export interface AssignGroupToApplicationResponse
  extends BaseResponse<ApplicationGroupAssignment> {}

export interface UnassignGroupFromApplicationResponse extends BaseResponse<string> {}

export interface DeleteApplicationResponse extends BaseResponse<string> {}

export interface DeactivateApplicationResponse extends BaseResponse<string> {}

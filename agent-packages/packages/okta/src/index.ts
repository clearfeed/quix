import { Client, User } from '@okta/okta-sdk-nodejs';
import { BaseService } from '@clearfeed-ai/quix-common-agent';
import {
  OktaAuthConfig,
  ListUsersResponse,
  CreateUserResponse,
  GetUserResponse,
  UpdateUserResponse,
  DeleteUserResponse,
  ListGroupsResponse,
  CreateGroupResponse,
  AssignUserToGroupResponse,
  ListApplicationsResponse,
  AssignUserToApplicationResponse,
  AssignGroupToApplicationResponse,
  DeleteApplicationResponse,
  DeactivateApplicationResponse,
  SuspendUserResponse,
  UnsuspendUserResponse,
  ActivateUserResponse,
  DeactivateUserResponse,
  UnlockUserResponse,
  ResetUserPasswordResponse,
  ExpireUserPasswordResponse,
  ResetUserFactorsResponse,
  UnassignUserFromGroupResponse,
  DeleteGroupResponse,
  ListGroupUsersResponse,
  UnassignUserFromApplicationResponse,
  UnassignGroupFromApplicationResponse,
  ListUserGroupsResponse,
  ListDevicesResponse,
  ListUserDevicesResponse,
  GetDeviceResponse,
  ListDeviceUsersResponse
} from './types';
import { extractPrimitives } from './utils';
import { SCHEMAS } from './tools';
import { z } from 'zod';
export * from './types';
export * from './tools';

export class OktaService implements BaseService<OktaAuthConfig> {
  private client: Client;

  constructor(private config: OktaAuthConfig) {
    if ('privateKey' in config) {
      this.client = new Client({
        orgUrl: config.orgUrl,
        authorizationMode: 'PrivateKey',
        clientId: config.clientId,
        scopes: config.scopes,
        privateKey: config.privateKey,
        keyId: config.privateKeyId
      });
    } else {
      this.client = new Client({
        orgUrl: config.orgUrl,
        token: config.token
      });
    }
  }

  // === USER METHODS ===

  async listUsers({ limit, query }: z.infer<typeof SCHEMAS.listUsers>): Promise<ListUsersResponse> {
    try {
      const queryParams: any = {};
      if (limit) queryParams.limit = limit;
      if (query) queryParams.q = query;

      const users = await this.client.userApi.listUsers(queryParams);
      const data = [];
      for await (const user of users) {
        const simplified = extractPrimitives(user);
        if (simplified) {
          data.push(simplified);
        }
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error listing users:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list users'
      };
    }
  }

  async createUser(params: z.infer<typeof SCHEMAS.createUserSchema>): Promise<CreateUserResponse> {
    try {
      const user = await this.client.userApi.createUser({
        body: {
          profile: params.profile,
          credentials: params.credentials
        }
      });

      return {
        success: true,
        data: extractPrimitives(user)
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user'
      };
    }
  }

  async getUser({ userId }: z.infer<typeof SCHEMAS.getUserSchema>): Promise<GetUserResponse> {
    try {
      const user = await this.client.userApi.getUser({ userId });
      return {
        success: true,
        data: extractPrimitives(user)
      };
    } catch (error) {
      console.error('Error getting user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user'
      };
    }
  }

  async updateUser({
    userId,
    profile
  }: z.infer<typeof SCHEMAS.updateUserSchema>): Promise<UpdateUserResponse> {
    try {
      const user = await this.client.userApi.updateUser({
        userId,
        user: { profile }
      });
      return {
        success: true,
        data: extractPrimitives(user)
      };
    } catch (error) {
      console.error('Error updating user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user'
      };
    }
  }

  async suspendUser({
    userId
  }: z.infer<typeof SCHEMAS.suspendUserSchema>): Promise<SuspendUserResponse> {
    try {
      await this.client.userApi.suspendUser({ userId });

      return {
        success: true,
        data: `User ${userId} has been suspended`
      };
    } catch (error) {
      console.error('Error suspending user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to suspend user'
      };
    }
  }

  async unsuspendUser({
    userId
  }: z.infer<typeof SCHEMAS.unsuspendUserSchema>): Promise<UnsuspendUserResponse> {
    try {
      await this.client.userApi.unsuspendUser({ userId });

      return {
        success: true,
        data: `User ${userId} has been unsuspended`
      };
    } catch (error) {
      console.error('Error unsuspending user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unsuspend user'
      };
    }
  }

  async activateUser({
    userId,
    sendEmail
  }: z.infer<typeof SCHEMAS.activateUserSchema>): Promise<ActivateUserResponse> {
    try {
      const user = await this.client.userApi.activateUser({ userId, sendEmail });
      return {
        success: true,
        data: extractPrimitives(user)
      };
    } catch (error) {
      console.error('Error activating user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to activate user'
      };
    }
  }

  async deactivateUser({
    userId
  }: z.infer<typeof SCHEMAS.deactivateUserSchema>): Promise<DeactivateUserResponse> {
    try {
      await this.client.userApi.deactivateUser({ userId });
      return {
        success: true,
        data: `User ${userId} has been deactivated`
      };
    } catch (error) {
      console.error('Error deactivating user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to deactivate user'
      };
    }
  }

  async unlockUser({
    userId
  }: z.infer<typeof SCHEMAS.unlockUserSchema>): Promise<UnlockUserResponse> {
    try {
      await this.client.userApi.unlockUser({ userId });
      return {
        success: true,
        data: `User ${userId} has been unlocked`
      };
    } catch (error) {
      console.error('Error unlocking user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unlock user'
      };
    }
  }

  async resetUserPassword({
    userId,
    sendEmail
  }: z.infer<typeof SCHEMAS.resetUserPasswordSchema>): Promise<ResetUserPasswordResponse> {
    try {
      await this.client.userApi.generateResetPasswordToken({ userId, sendEmail });
      return {
        success: true,
        data: `User ${userId} has had their password reset`
      };
    } catch (error) {
      console.error('Error resetting user password:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset user password'
      };
    }
  }

  async expireUserPassword({
    userId
  }: z.infer<typeof SCHEMAS.expireUserPasswordSchema>): Promise<ExpireUserPasswordResponse> {
    try {
      await this.client.userApi.expirePassword({ userId });
      return {
        success: true,
        data: `User ${userId} has had their password expired`
      };
    } catch (error) {
      console.error('Error expiring user password:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to expire user password'
      };
    }
  }

  async resetUserFactors({
    userId
  }: z.infer<typeof SCHEMAS.resetUserFactorsSchema>): Promise<ResetUserFactorsResponse> {
    try {
      await this.client.userApi.resetFactors({ userId });
      return {
        success: true,
        data: `User ${userId} has had their factors reset`
      };
    } catch (error) {
      console.error('Error resetting user factors:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset user factors'
      };
    }
  }

  async deleteUser({
    userId
  }: z.infer<typeof SCHEMAS.deleteUserSchema>): Promise<DeleteUserResponse> {
    try {
      const user = await this.getUser({ userId });

      if (user.data?.status !== 'DEPROVISIONED') {
        return {
          success: false,
          data: `User is currently '${user.data?.status?.toLowerCase()}'.`
        };
      }
      await this.client.userApi.deleteUser({ userId });
      return {
        success: true,
        data: `User ${userId} has been deleted`
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete user'
      };
    }
  }

  // === GROUP METHODS ===

  async listGroups({
    limit,
    search
  }: z.infer<typeof SCHEMAS.listGroupsSchema>): Promise<ListGroupsResponse> {
    try {
      const queryParams: any = {};
      if (limit) queryParams.limit = limit;
      if (search) queryParams.search = search;

      const groups = await this.client.groupApi.listGroups(queryParams);
      const data = [];
      for await (const group of groups) {
        const simplified = extractPrimitives(group);
        if (simplified) {
          data.push(simplified);
        }
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error listing groups:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list groups'
      };
    }
  }

  async createGroup(
    params: z.infer<typeof SCHEMAS.createGroupSchema>
  ): Promise<CreateGroupResponse> {
    try {
      const group = await this.client.groupApi.createGroup({
        group: { profile: params.profile }
      });
      return {
        success: true,
        data: extractPrimitives(group)
      };
    } catch (error) {
      console.error('Error creating group:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create group'
      };
    }
  }

  async assignUserToGroup({
    groupId,
    userId
  }: z.infer<typeof SCHEMAS.assignUserToGroupSchema>): Promise<AssignUserToGroupResponse> {
    try {
      await this.client.groupApi.assignUserToGroup({ groupId, userId });
      return {
        success: true,
        data: `User ${userId} has been assigned to group ${groupId}`
      };
    } catch (error) {
      console.error('Error assigning user to group:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign user to group'
      };
    }
  }

  async unassignUserFromGroup({
    groupId,
    userId
  }: z.infer<typeof SCHEMAS.unassignUserFromGroupSchema>): Promise<UnassignUserFromGroupResponse> {
    try {
      await this.client.groupApi.unassignUserFromGroup({ groupId, userId });
      return {
        success: true,
        data: `User ${userId} has been unassigned from group ${groupId}`
      };
    } catch (error) {
      console.error('Error unassigning user from group:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unassign user from group'
      };
    }
  }

  async listGroupUsers({
    groupId
  }: z.infer<typeof SCHEMAS.listGroupUsersSchema>): Promise<ListGroupUsersResponse> {
    try {
      const users = await this.client.groupApi.listGroupUsers({ groupId });

      const data: User[] = [];

      for await (const user of users) {
        const simplified = extractPrimitives(user);
        if (simplified) {
          data.push(simplified);
        }
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error listing group users:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list group users'
      };
    }
  }

  async deleteGroup({
    groupId
  }: z.infer<typeof SCHEMAS.deleteGroupSchema>): Promise<DeleteGroupResponse> {
    try {
      await this.client.groupApi.deleteGroup({ groupId });
      return {
        success: true,
        data: `Group ${groupId} has been deleted`
      };
    } catch (error) {
      console.error('Error deleting group:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete group'
      };
    }
  }

  // === APPLICATION METHODS ===

  async listApplications({
    limit,
    query
  }: z.infer<typeof SCHEMAS.listApplicationsSchema>): Promise<ListApplicationsResponse> {
    try {
      const queryParams: any = {};
      if (limit) queryParams.limit = limit;
      if (query) queryParams.q = query;

      const applications = await this.client.applicationApi.listApplications(queryParams);
      const data = [];
      for await (const app of applications) {
        const simplified = extractPrimitives(app);
        if (simplified) {
          data.push(simplified);
        }
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error listing applications:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list applications'
      };
    }
  }

  async assignUserToApplication({
    appId,
    userId,
    profile
  }: z.infer<
    typeof SCHEMAS.assignUserToApplicationSchema
  >): Promise<AssignUserToApplicationResponse> {
    try {
      const appUser = await this.client.applicationApi.assignUserToApplication({
        appId,
        appUser: {
          id: userId,
          profile
        }
      });
      return {
        success: true,
        data: extractPrimitives(appUser)
      };
    } catch (error) {
      console.error('Error assigning user to application:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign user to application'
      };
    }
  }

  async unassignUserFromApplication({
    appId,
    userId
  }: z.infer<
    typeof SCHEMAS.unassignUserFromApplicationSchema
  >): Promise<UnassignUserFromApplicationResponse> {
    try {
      await this.client.applicationApi.unassignUserFromApplication({ appId, userId });
      return {
        success: true,
        data: `User ${userId} has been unassigned from application ${appId}`
      };
    } catch (error) {
      console.error('Error unassigning user from application:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unassign user from application'
      };
    }
  }

  async assignGroupToApplication({
    appId,
    groupId
  }: z.infer<
    typeof SCHEMAS.assignGroupToApplicationSchema
  >): Promise<AssignGroupToApplicationResponse> {
    try {
      const assignment = await this.client.applicationApi.assignGroupToApplication({
        appId,
        groupId,
        applicationGroupAssignment: {}
      });
      return {
        success: true,
        data: extractPrimitives(assignment)
      };
    } catch (error) {
      console.error('Error assigning group to application:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign group to application'
      };
    }
  }

  async unassignGroupFromApplication({
    appId,
    groupId
  }: z.infer<
    typeof SCHEMAS.unassignGroupFromApplicationSchema
  >): Promise<UnassignGroupFromApplicationResponse> {
    try {
      await this.client.applicationApi.unassignApplicationFromGroup({ appId, groupId });
      return {
        success: true,
        data: `Group ${groupId} has been unassigned from application ${appId}`
      };
    } catch (error) {
      console.error('Error unassigning group from application:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unassign group from application'
      };
    }
  }

  async deleteApplication({
    appId
  }: z.infer<typeof SCHEMAS.deleteApplicationSchema>): Promise<DeleteApplicationResponse> {
    try {
      await this.client.applicationApi.deleteApplication({ appId });
      return {
        success: true,
        data: `Application ${appId} has been deleted`
      };
    } catch (error) {
      console.error('Error deleting application:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete application'
      };
    }
  }

  async deactivateApplication({
    appId
  }: z.infer<typeof SCHEMAS.deactivateApplicationSchema>): Promise<DeactivateApplicationResponse> {
    try {
      await this.client.applicationApi.deactivateApplication({ appId });
      return {
        success: true,
        data: `Application ${appId} has been deactivated`
      };
    } catch (error) {
      console.error('Error deactivating application:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to deactivate application'
      };
    }
  }

  async listUserGroups({
    userId
  }: z.infer<typeof SCHEMAS.listUserGroupsSchema>): Promise<ListUserGroupsResponse> {
    try {
      const groups = await this.client.userApi.listUserGroups({ userId });
      const data = [];
      for await (const group of groups) {
        const simplified = extractPrimitives(group);
        if (simplified) {
          data.push(simplified);
        }
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error listing user groups:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list user groups'
      };
    }
  }

  async listDevices({
    limit,
    query
  }: z.infer<typeof SCHEMAS.listDevicesSchema>): Promise<ListDevicesResponse> {
    try {
      const queryParams: any = {};
      if (limit) queryParams.limit = limit;
      if (query) queryParams.q = query;

      const devices = await this.client.deviceApi.listDevices(queryParams);
      const data = [];
      for await (const device of devices) {
        const simplified = extractPrimitives(device);
        if (simplified) {
          data.push(simplified);
        }
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error listing devices:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list devices'
      };
    }
  }

  async listUserDevices({
    userId
  }: z.infer<typeof SCHEMAS.listUserDevicesSchema>): Promise<ListUserDevicesResponse> {
    try {
      const url = `${this.client.baseUrl}/api/v1/users/${userId}/devices`;
      const request = {
        method: 'get',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      };
      const response = await this.client.http.http(url, request);
      const devices = response.body ?? [];

      const data = [];

      for await (const device of devices) {
        const simplified = extractPrimitives(device);
        if (simplified) {
          data.push(simplified);
        }
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error listing user devices:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list user devices'
      };
    }
  }

  async getDevice({
    deviceId
  }: z.infer<typeof SCHEMAS.getDeviceSchema>): Promise<GetDeviceResponse> {
    try {
      const device = await this.client.deviceApi.getDevice({ deviceId });
      return {
        success: true,
        data: extractPrimitives(device)
      };
    } catch (error) {
      console.error('Error getting device:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get device'
      };
    }
  }

  async listDeviceUsers({
    deviceId
  }: z.infer<typeof SCHEMAS.listDeviceUsersSchema>): Promise<ListDeviceUsersResponse> {
    try {
      const url = `${this.client.baseUrl}/api/v1/devices/${deviceId}/users`;
      const request = {
        method: 'get',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      };
      const response = await this.client.http.http(url, request);
      const users = response.body ?? [];

      const data = [];

      for await (const user of users) {
        const simplified = extractPrimitives(user);
        if (simplified) {
          data.push(simplified);
        }
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error listing device users:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list device users'
      };
    }
  }
}

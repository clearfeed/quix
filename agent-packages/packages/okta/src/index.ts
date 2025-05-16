import { Client } from '@okta/okta-sdk-nodejs';
import { BaseService } from '@clearfeed-ai/quix-common-agent';
import {
  OktaConfig,
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
  DeactivateApplicationResponse
} from './types';
import { extractPrimitives } from './utils';
import { SCHEMAS } from './tools';
import { z } from 'zod';
export * from './types';
export * from './tools';

export class OktaService implements BaseService<OktaConfig> {
  private client: Client;

  constructor(private config: OktaConfig) {
    this.client = new Client({
      orgUrl: config.orgUrl,
      token: config.token
    });
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

  async deleteUser({
    userId
  }: z.infer<typeof SCHEMAS.deleteUserSchema>): Promise<DeleteUserResponse> {
    try {
      // First deactivate
      await this.client.userApi.deactivateUser({ userId });
      // Then delete
      await this.client.userApi.deleteUser({ userId });
      return {
        success: true,
        data: `User ${userId} has been deactivated and deleted`
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
}

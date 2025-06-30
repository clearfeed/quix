import axios, { AxiosInstance } from 'axios';
import { BaseService } from '@clearfeed-ai/quix-common-agent';
import {
  JumpCloudConfig,
  ListUsersResponse,
  CreateUserResponse,
  GetUserResponse,
  UpdateUserResponse,
  DeleteUserResponse,
  ListGroupsResponse,
  CreateGroupResponse,
  AssignUserToGroupResponse,
  UnassignUserFromGroupResponse,
  ListGroupUsersResponse,
  DeleteGroupResponse
} from './types';
import { extractPrimitives, extractErrorMessage } from './utils';
import { SCHEMAS } from './tools';
import { z } from 'zod';
export * from './types';
export * from './tools';

export class JumpCloudService implements BaseService<JumpCloudConfig> {
  private client: AxiosInstance;

  constructor(private config: JumpCloudConfig) {
    const validation = this.validateConfig(config);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://console.jumpcloud.com/api',
      headers: {
        'x-api-key': config.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  validateConfig(
    config?: Record<string, any>
  ): { isValid: boolean; error?: string } & Record<string, any> {
    const cfg = config || this.config;

    if (!cfg.apiKey) {
      return { isValid: false, error: 'JumpCloud API key is required' };
    }
    if (cfg.baseUrl && !cfg.baseUrl.startsWith('https://')) {
      return { isValid: false, error: 'JumpCloud base URL must be a valid HTTPS URL' };
    }

    return { isValid: true };
  }

  async listUsers(params: z.infer<typeof SCHEMAS.listUsers>): Promise<ListUsersResponse> {
    try {
      const response = await this.client.get('/systemusers', { params });
      const data = (Array.isArray(response.data) ? response.data : response.data?.results) || [];
      return { success: true, data: data.map(extractPrimitives) };
    } catch (error) {
      console.error('Error listing JumpCloud users:', error);
      return {
        success: false,
        error: extractErrorMessage(error)
      };
    }
  }

  async createUser(args: z.infer<typeof SCHEMAS.createUserSchema>): Promise<CreateUserResponse> {
    try {
      const response = await this.client.post('/systemusers', args);
      return { success: true, data: extractPrimitives(response.data) };
    } catch (error) {
      console.error('Error creating JumpCloud user:', error);
      return {
        success: false,
        error: extractErrorMessage(error)
      };
    }
  }

  async getUser(args: z.infer<typeof SCHEMAS.getUserSchema>): Promise<GetUserResponse> {
    try {
      const response = await this.client.get(`/systemusers/${args.userId}`);
      return { success: true, data: extractPrimitives(response.data) };
    } catch (error) {
      console.error('Error getting JumpCloud user:', error);
      return {
        success: false,
        error: extractErrorMessage(error)
      };
    }
  }

  async updateUser(args: z.infer<typeof SCHEMAS.updateUserSchema>): Promise<UpdateUserResponse> {
    try {
      const response = await this.client.put(`/systemusers/${args.userId}`, args.payload);
      return { success: true, data: extractPrimitives(response.data) };
    } catch (error) {
      console.error('Error updating JumpCloud user:', error);
      return {
        success: false,
        error: extractErrorMessage(error)
      };
    }
  }

  async deleteUser(args: z.infer<typeof SCHEMAS.deleteUserSchema>): Promise<DeleteUserResponse> {
    try {
      await this.client.delete(`/systemusers/${args.userId}`);
      return { success: true, data: `User ${args.userId} deleted` };
    } catch (error) {
      console.error('Error deleting JumpCloud user:', error);
      return {
        success: false,
        error: extractErrorMessage(error)
      };
    }
  }

  async listGroups(params: z.infer<typeof SCHEMAS.listGroupsSchema>): Promise<ListGroupsResponse> {
    try {
      const response = await this.client.get('/v2/usergroups', { params });
      return { success: true, data: (response.data || []).map(extractPrimitives) };
    } catch (error) {
      console.error('Error listing JumpCloud groups:', error);
      return {
        success: false,
        error: extractErrorMessage(error)
      };
    }
  }

  async createGroup(args: z.infer<typeof SCHEMAS.createGroupSchema>): Promise<CreateGroupResponse> {
    try {
      const response = await this.client.post('/v2/usergroups', args);
      return { success: true, data: extractPrimitives(response.data) };
    } catch (error) {
      console.error('Error creating JumpCloud group:', error);
      return {
        success: false,
        error: extractErrorMessage(error)
      };
    }
  }

  async assignUserToGroup(
    args: z.infer<typeof SCHEMAS.assignUserToGroupSchema>
  ): Promise<AssignUserToGroupResponse> {
    try {
      await this.client.post(`/v2/usergroups/${args.groupId}/members`, {
        op: 'add',
        type: 'user',
        id: args.userId
      });
      return { success: true, data: `User ${args.userId} added to group ${args.groupId}` };
    } catch (error) {
      console.error('Error assigning user to JumpCloud group:', error);
      return {
        success: false,
        error: extractErrorMessage(error)
      };
    }
  }

  async unassignUserFromGroup(
    args: z.infer<typeof SCHEMAS.unassignUserFromGroupSchema>
  ): Promise<UnassignUserFromGroupResponse> {
    try {
      await this.client.post(`/v2/usergroups/${args.groupId}/members`, {
        op: 'remove',
        type: 'user',
        id: args.userId
      });
      return { success: true, data: `User ${args.userId} removed from group ${args.groupId}` };
    } catch (error) {
      console.error('Error removing user from JumpCloud group:', error);
      return {
        success: false,
        error: extractErrorMessage(error)
      };
    }
  }

  async listGroupUsers(
    args: z.infer<typeof SCHEMAS.listGroupUsersSchema>
  ): Promise<ListGroupUsersResponse> {
    try {
      const response = await this.client.get(`/v2/usergroups/${args.groupId}/members`);
      return { success: true, data: (response.data || []).map(extractPrimitives) };
    } catch (error) {
      console.error('Error listing JumpCloud group users:', error);
      return {
        success: false,
        error: extractErrorMessage(error)
      };
    }
  }

  async deleteGroup(args: z.infer<typeof SCHEMAS.deleteGroupSchema>): Promise<DeleteGroupResponse> {
    try {
      await this.client.delete(`/v2/usergroups/${args.groupId}`);
      return { success: true, data: `Group ${args.groupId} deleted` };
    } catch (error) {
      console.error('Error deleting JumpCloud group:', error);
      return {
        success: false,
        error: extractErrorMessage(error)
      };
    }
  }
}

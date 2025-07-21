import axios, { AxiosInstance } from 'axios';
import { BaseService } from '@clearfeed-ai/quix-common-agent';
import {
  AssetPandaConfig,
  AssetPandaGroup,
  AssetPandaField,
  CreateUserRequest,
  UpdateObjectRequest,
  ListUsersResponse,
  CreateUserResponse,
  ListGroupsResponse,
  SearchObjectsResponse,
  UpdateObjectResponse,
  AssignAssetResponse,
  MarkAssetReturnedResponse,
  GetSettingsResponse,
  GetGroupFieldsResponse,
  GetGroupStatusesResponse,
  SCHEMAS
} from './types';
import { z } from 'zod';

export * from './types';
export * from './tools';

export class AssetPandaService implements BaseService<AssetPandaConfig> {
  private client: AxiosInstance;
  private cachedSettings: any = null;
  private cachedGroups: AssetPandaGroup[] | undefined;
  private cachedGroupFields: Map<number, AssetPandaField[]> = new Map();

  constructor(private config: AssetPandaConfig) {
    this.client = axios.create({
      baseURL: 'https://api.assetpanda.com/v3',
      headers: {
        Authorization: `Bearer ${this.config.apiToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  private extractPrimitives<T>(obj: T): T {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.extractPrimitives(value);
      }
      return result;
    }
    return obj;
  }

  private extractErrorMessage(error: any): string {
    if (error.response?.data?.message) return error.response.data.message;
    if (error.response?.data?.error) return error.response.data.error;
    if (error.message) return error.message;
    return 'Unknown error occurred';
  }

  async getSettings(): Promise<GetSettingsResponse> {
    try {
      const response = await this.client.get('/settings');
      this.cachedSettings = this.extractPrimitives(response.data);
      return { success: true, data: this.cachedSettings };
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }

  async getCurrentUser(): Promise<CreateUserResponse> {
    try {
      const response = await this.client.get('/users/me');
      return { success: true, data: this.extractPrimitives(response.data) };
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }

  private async getAccountId() {
    try {
      if (!this.cachedSettings) {
        const settingsResponse = await this.getSettings();
        if (settingsResponse.success && settingsResponse.data) {
          this.cachedSettings = settingsResponse.data;
        }
      }
      if (this.cachedSettings?.user_details?.account_id) {
        return this.cachedSettings.user_details.account_id.toString();
      }
      const userResponse = await this.getCurrentUser();
      if (userResponse.success && userResponse.data && userResponse.data.account_id) {
        return userResponse.data.account_id.toString();
      }
      throw new Error('Failed to get AssetPanda account ID');
    } catch (error) {
      throw new Error('Failed to get AssetPanda account ID');
    }
  }

  async listUsers(params: z.infer<typeof SCHEMAS.listUsersSchema>): Promise<ListUsersResponse> {
    try {
      const response = await this.client.get('/users', { params });
      const data = Array.isArray(response.data) ? response.data : [];
      return { success: true, data: data.map((user) => this.extractPrimitives(user)) };
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }

  async createUser(args: z.infer<typeof SCHEMAS.createUserSchema>): Promise<CreateUserResponse> {
    try {
      const accountId = args.create_for_account || (await this.getAccountId());
      const payload: CreateUserRequest = {
        user: {
          first_name: args.first_name,
          last_name: args.last_name,
          email: args.email,
          password: args.password,
          password_confirmation: args.password_confirmation,
          create_for_account: String(accountId)
        },
        device: args.device || 'web'
      };
      const response = await this.client.post('/users', payload);
      return { success: true, data: this.extractPrimitives(response.data) };
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }

  async listGroups(): Promise<ListGroupsResponse> {
    if (this.cachedGroups) {
      return { success: true, data: this.cachedGroups };
    }

    try {
      const response = await this.client.get('/groups');
      const data = response.data?.groups || [];
      this.cachedGroups = data;
      return { success: true, data: this.cachedGroups };
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }

  async getGroupFields(groupId: number): Promise<GetGroupFieldsResponse> {
    if (this.cachedGroupFields.has(groupId)) {
      return { success: true, data: this.cachedGroupFields.get(groupId)! };
    }

    try {
      const response = await this.client.get(`/groups/${groupId}/fields`);
      const data = response.data?.fields || [];
      this.cachedGroupFields.set(groupId, data);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }

  async getGroupStatuses(groupId: number): Promise<GetGroupStatusesResponse> {
    try {
      const response = await this.client.get(`/groups/${groupId}/statuses`);
      const data = response.data?.statuses || [];
      return { success: true, data };
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }

  async listObjects(
    args: z.infer<typeof SCHEMAS.listObjectsSchema>
  ): Promise<SearchObjectsResponse> {
    try {
      const params = new URLSearchParams();
      params.append('limit', args.limit.toString());
      params.append('offset', args.offset.toString());

      const url = `/groups/${args.group_id}/objects/search?${params.toString()}`;
      const response = await this.client.post(url, {});
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }

  async updateObject(
    groupId: number,
    objectId: string,
    payload: UpdateObjectRequest
  ): Promise<UpdateObjectResponse> {
    try {
      const response = await this.client.patch(`/groups/${groupId}/objects/${objectId}`, payload);
      return { success: true, data: this.extractPrimitives(response.data) };
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }

  // --- EMPLOYEE MANAGEMENT ---
  async createEmployee(
    args: z.infer<typeof SCHEMAS.createEmployeeSchema>
  ): Promise<CreateUserResponse> {
    try {
      const accountId = await this.getAccountId();
      const payload: CreateUserRequest = {
        device: 'web',
        user: {
          first_name: args.first_name,
          last_name: args.last_name,
          email: args.email,
          password: args.password,
          password_confirmation: args.password,
          create_for_account: accountId
        }
      };
      const response = await this.client.post('/users', payload);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }

  // --- ASSET MANAGEMENT ---

  async assignAssetToUser(
    args: z.infer<typeof SCHEMAS.assignAssetToUserSchema>
  ): Promise<AssignAssetResponse> {
    try {
      const payload: UpdateObjectRequest = {
        [args.status_field_key]: args.status_id.toString(),
        [args.employee_field_key]: args.employee_id
      };
      return this.updateObject(args.group_id, args.object_id, payload);
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }

  async markAssetReturned(
    args: z.infer<typeof SCHEMAS.markAssetReturnedSchema>
  ): Promise<MarkAssetReturnedResponse> {
    try {
      const payload: UpdateObjectRequest = {
        [args.status_field_key]: args.status_id.toString(),
        [args.employee_field_key]: ''
      };
      return this.updateObject(args.group_id, args.object_id, payload);
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }

  // --- ASSET AVAILABILITY ---
  async checkAssetAvailability(
    args: z.infer<typeof SCHEMAS.checkAssetAvailabilitySchema>
  ): Promise<SearchObjectsResponse> {
    try {
      const params = new URLSearchParams();
      params.append('limit', args.limit.toString());
      params.append('offset', args.offset.toString());

      const url = `/groups/${args.group_id}/objects/search?${params.toString()}`;
      const response = await this.client.post(url, { search: args.search_term });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }
}

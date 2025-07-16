import axios, { AxiosInstance } from 'axios';
import { BaseService } from '@clearfeed-ai/quix-common-agent';
import {
  AssetPandaConfig,
  AssetPandaUser,
  AssetPandaGroup,
  AssetPandaObject,
  CreateUserRequest,
  SearchObjectsRequest,
  UpdateObjectRequest,
  ListUsersResponse,
  CreateUserResponse,
  ListGroupsResponse,
  SearchObjectsResponse,
  UpdateObjectResponse,
  CreateEmployeeResponse,
  ReserveAssetResponse,
  AssignAssetResponse,
  MarkAssetReturnedResponse,
  AssignLicenseResponse,
  ReclaimLicenseResponse
} from './types';
import { SCHEMAS } from './schema';
import { z } from 'zod';

export * from './types';
export * from './tools';

export class AssetPandaService implements BaseService<AssetPandaConfig> {
  private client: AxiosInstance;

  constructor(private config: AssetPandaConfig) {
    const validation = this.validateConfig(config);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    this.client = axios.create({
      baseURL: 'https://api.assetpanda.com/v3',
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  validateConfig(
    config?: Record<string, any>
  ): { isValid: boolean; error?: string } & Record<string, any> {
    const cfg = config || this.config;

    if (!cfg.apiToken) {
      return { isValid: false, error: 'AssetPanda API token is required' };
    }

    return { isValid: true };
  }

  // Helper method to extract primitives from API responses
  private extractPrimitives<T>(obj: T): T {
    if (obj === null || obj === undefined) {
      return obj;
    }
    if (typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.extractPrimitives(value);
      }
      return result;
    }
    return obj;
  }

  // Helper method to extract error messages
  private extractErrorMessage(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.message) {
      return error.message;
    }
    return 'Unknown error occurred';
  }

  // List all users
  async listUsers(params: z.infer<typeof SCHEMAS.listUsersSchema>): Promise<ListUsersResponse> {
    try {
      const response = await this.client.get('/users', { params });
      const data = Array.isArray(response.data) ? response.data : [];
      return { success: true, data: data.map((user) => this.extractPrimitives(user)) };
    } catch (error) {
      console.error('Error listing AssetPanda users:', error);
      return {
        success: false,
        error: this.extractErrorMessage(error)
      };
    }
  }

  // Create a new user/employee
  async createUser(
    args: z.infer<typeof SCHEMAS.createEmployeeSchema>
  ): Promise<CreateUserResponse> {
    try {
      const payload: CreateUserRequest = {
        device: 'web',
        user: {
          first_name: args.first_name,
          last_name: args.last_name,
          email: args.email,
          password: args.password,
          password_confirmation: args.password_confirmation,
          create_for_account: args.create_for_account
        }
      };

      const response = await this.client.post('/users', payload);
      return { success: true, data: this.extractPrimitives(response.data) };
    } catch (error) {
      console.error('Error creating AssetPanda user:', error);
      return {
        success: false,
        error: this.extractErrorMessage(error)
      };
    }
  }

  // List all groups
  async listGroups(params: z.infer<typeof SCHEMAS.listGroupsSchema>): Promise<ListGroupsResponse> {
    try {
      const response = await this.client.get('/groups', { params });
      const data = Array.isArray(response.data) ? response.data : [];
      return { success: true, data: data.map((group) => this.extractPrimitives(group)) };
    } catch (error) {
      console.error('Error listing AssetPanda groups:', error);
      return {
        success: false,
        error: this.extractErrorMessage(error)
      };
    }
  }

  // Search objects in a group
  async searchObjects(
    args: z.infer<typeof SCHEMAS.searchObjectsSchema>
  ): Promise<SearchObjectsResponse> {
    try {
      const payload: SearchObjectsRequest = {};
      if (args.search) payload.search = args.search;
      if (args.status) payload.status = args.status;
      if (args.assigned_to) payload.assigned_to = args.assigned_to;

      const response = await this.client.post(`/groups/${args.group_id}/objects/search`, payload);
      return { success: true, data: this.extractPrimitives(response.data) };
    } catch (error) {
      console.error('Error searching AssetPanda objects:', error);
      return {
        success: false,
        error: this.extractErrorMessage(error)
      };
    }
  }

  // Update an object
  async updateObject(
    groupId: number,
    objectId: number,
    payload: UpdateObjectRequest
  ): Promise<UpdateObjectResponse> {
    try {
      const response = await this.client.patch(`/groups/${groupId}/objects/${objectId}`, payload);
      return { success: true, data: this.extractPrimitives(response.data) };
    } catch (error) {
      console.error('Error updating AssetPanda object:', error);
      return {
        success: false,
        error: this.extractErrorMessage(error)
      };
    }
  }

  // Find user by email
  private async findUserByEmail(email: string): Promise<AssetPandaUser | null> {
    try {
      const response = await this.listUsers({ limit: 100 });
      if (!response.success || !response.data) {
        return null;
      }
      return response.data.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  // Find group by name
  private async findGroupByName(name: string): Promise<AssetPandaGroup | null> {
    try {
      const response = await this.listGroups({ limit: 100 });
      if (!response.success || !response.data) {
        return null;
      }
      return (
        response.data.find((group) => group.name.toLowerCase().includes(name.toLowerCase())) || null
      );
    } catch (error) {
      console.error('Error finding group by name:', error);
      return null;
    }
  }

  // Find asset by name in a group
  private async findAssetByName(
    assetName: string,
    groupId: number
  ): Promise<AssetPandaObject | null> {
    try {
      const response = await this.searchObjects({
        group_id: groupId,
        search: assetName
      });
      if (!response.success || !response.data || !response.data.objects) {
        return null;
      }
      return (
        response.data.objects.find((obj) =>
          obj.name.toLowerCase().includes(assetName.toLowerCase())
        ) || null
      );
    } catch (error) {
      console.error('Error finding asset by name:', error);
      return null;
    }
  }

  // Create Employee Record (v1 scope)
  async createEmployee(
    args: z.infer<typeof SCHEMAS.createEmployeeSchema>
  ): Promise<CreateEmployeeResponse> {
    try {
      // First check if employee already exists
      const existingUser = await this.findUserByEmail(args.email);
      if (existingUser) {
        return {
          success: true,
          data: existingUser,
          message: 'Employee already exists'
        };
      }

      // Create new employee
      return await this.createUser(args);
    } catch (error) {
      console.error('Error creating employee:', error);
      return {
        success: false,
        error: this.extractErrorMessage(error)
      };
    }
  }

  // Reserve Asset (v1 scope)
  async reserveAsset(
    args: z.infer<typeof SCHEMAS.reserveAssetSchema>
  ): Promise<ReserveAssetResponse> {
    try {
      // Find the asset group
      const group = await this.findGroupByName(args.group_name || 'Assets');
      if (!group) {
        return {
          success: false,
          error: `Asset group not found: ${args.group_name || 'Assets'}`
        };
      }

      // Find the asset
      const asset = await this.findAssetByName(args.asset_name, group.id);
      if (!asset) {
        return {
          success: false,
          error: `Asset not found: ${args.asset_name}`
        };
      }

      // Reserve the asset by updating its status
      const updatePayload: UpdateObjectRequest = {
        status_field_id: 'Reserved'
      };

      return await this.updateObject(group.id, asset.id, updatePayload);
    } catch (error) {
      console.error('Error reserving asset:', error);
      return {
        success: false,
        error: this.extractErrorMessage(error)
      };
    }
  }

  // Assign Asset to User (v1 scope)
  async assignAssetToUser(
    args: z.infer<typeof SCHEMAS.assignAssetToUserSchema>
  ): Promise<AssignAssetResponse> {
    try {
      // Find or create the employee
      let employee = await this.findUserByEmail(args.employee_email);
      if (!employee) {
        return {
          success: false,
          error: `Employee not found: ${args.employee_email}. Please create the employee first.`
        };
      }

      // Find the asset group
      const group = await this.findGroupByName(args.group_name || 'Assets');
      if (!group) {
        return {
          success: false,
          error: `Asset group not found: ${args.group_name || 'Assets'}`
        };
      }

      // Find the asset
      const asset = await this.findAssetByName(args.asset_name, group.id);
      if (!asset) {
        return {
          success: false,
          error: `Asset not found: ${args.asset_name}`
        };
      }

      // Assign the asset to the employee
      const updatePayload: UpdateObjectRequest = {
        assigned_to: employee.id,
        status_field_id: 'Assigned'
      };

      return await this.updateObject(group.id, asset.id, updatePayload);
    } catch (error) {
      console.error('Error assigning asset to user:', error);
      return {
        success: false,
        error: this.extractErrorMessage(error)
      };
    }
  }

  // Mark Asset as Returned (v1 scope)
  async markAssetReturned(
    args: z.infer<typeof SCHEMAS.markAssetReturnedSchema>
  ): Promise<MarkAssetReturnedResponse> {
    try {
      // Find the employee
      const employee = await this.findUserByEmail(args.employee_email);
      if (!employee) {
        return {
          success: false,
          error: `Employee not found: ${args.employee_email}`
        };
      }

      // Find the asset group
      const group = await this.findGroupByName(args.group_name || 'Assets');
      if (!group) {
        return {
          success: false,
          error: `Asset group not found: ${args.group_name || 'Assets'}`
        };
      }

      // Find assets assigned to the employee
      const response = await this.searchObjects({
        group_id: group.id,
        assigned_to: employee.id
      });

      if (!response.success || !response.data || !response.data.objects) {
        return {
          success: false,
          error: 'No assets found assigned to this employee'
        };
      }

      // Filter by specific asset name if provided
      let assetsToReturn = response.data.objects;
      if (args.asset_name) {
        assetsToReturn = assetsToReturn.filter((asset) =>
          asset.name.toLowerCase().includes(args.asset_name!.toLowerCase())
        );
      }

      if (assetsToReturn.length === 0) {
        return {
          success: false,
          error: `No assets found to return for employee: ${args.employee_email}`
        };
      }

      // Return all matching assets
      const results = [];
      for (const asset of assetsToReturn) {
        const updatePayload: UpdateObjectRequest = {
          assigned_to: null,
          status_field_id: 'Available'
        };
        const result = await this.updateObject(group.id, asset.id, updatePayload);
        results.push(result);
      }

      // Return the first result (or create a summary)
      return results[0];
    } catch (error) {
      console.error('Error marking asset as returned:', error);
      return {
        success: false,
        error: this.extractErrorMessage(error)
      };
    }
  }

  // Assign Software License (v1 scope)
  async assignSoftwareLicense(
    args: z.infer<typeof SCHEMAS.assignSoftwareLicenseSchema>
  ): Promise<AssignLicenseResponse> {
    try {
      // Find or create the employee
      let employee = await this.findUserByEmail(args.employee_email);
      if (!employee) {
        return {
          success: false,
          error: `Employee not found: ${args.employee_email}. Please create the employee first.`
        };
      }

      // Find the license group
      const group = await this.findGroupByName(args.group_name || 'Licenses');
      if (!group) {
        return {
          success: false,
          error: `License group not found: ${args.group_name || 'Licenses'}`
        };
      }

      // Find the license
      const license = await this.findAssetByName(args.license_name, group.id);
      if (!license) {
        return {
          success: false,
          error: `License not found: ${args.license_name}`
        };
      }

      // Check if seats are available
      const currentSeats = license.available_seats || 0;
      if (currentSeats <= 0) {
        return {
          success: false,
          error: `No available seats for license: ${args.license_name}`
        };
      }

      // Assign the license to the employee
      const currentAssignedUsers = license.assigned_users || [];
      const updatePayload: UpdateObjectRequest = {
        assigned_users: [...currentAssignedUsers, employee.id],
        available_seats: currentSeats - 1
      };

      return await this.updateObject(group.id, license.id, updatePayload);
    } catch (error) {
      console.error('Error assigning software license:', error);
      return {
        success: false,
        error: this.extractErrorMessage(error)
      };
    }
  }

  // Reclaim/Deallocate Software License (v1 scope)
  async reclaimSoftwareLicense(
    args: z.infer<typeof SCHEMAS.reclaimSoftwareLicenseSchema>
  ): Promise<ReclaimLicenseResponse> {
    try {
      // Find the employee
      const employee = await this.findUserByEmail(args.employee_email);
      if (!employee) {
        return {
          success: false,
          error: `Employee not found: ${args.employee_email}`
        };
      }

      // Find the license group
      const group = await this.findGroupByName(args.group_name || 'Licenses');
      if (!group) {
        return {
          success: false,
          error: `License group not found: ${args.group_name || 'Licenses'}`
        };
      }

      // Find the license
      const license = await this.findAssetByName(args.license_name, group.id);
      if (!license) {
        return {
          success: false,
          error: `License not found: ${args.license_name}`
        };
      }

      // Check if employee is assigned to this license
      const currentAssignedUsers = license.assigned_users || [];
      if (!currentAssignedUsers.includes(employee.id)) {
        return {
          success: false,
          error: `Employee ${args.employee_email} is not assigned to license ${args.license_name}`
        };
      }

      // Remove employee from license and increase available seats
      const updatePayload: UpdateObjectRequest = {
        assigned_users: currentAssignedUsers.filter((id) => id !== employee.id),
        available_seats: (license.available_seats || 0) + 1
      };

      return await this.updateObject(group.id, license.id, updatePayload);
    } catch (error) {
      console.error('Error reclaiming software license:', error);
      return {
        success: false,
        error: this.extractErrorMessage(error)
      };
    }
  }
}

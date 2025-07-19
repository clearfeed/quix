// AssetPanda Static Group & Field Mappings (based on all objects)
// Assets: field_1 (Asset Name/ID), field_15 (Type), field_11 (Status), field_4 (Model), field_6 (Manufacturer), field_8 (SKU), field_10 (Serial), field_2 (Purchase Date), field_9 (Price), field_40 (Warranty), field_41 (Warranty Expiry), field_18 (Custom Date), field_12 (Created/Updated), field_239 ("no")
// Employees: field_1 (Name), field_2 (Email), field_4 (Employee ID), field_6 (Status)
// Software Licenses: field_1 (Name), field_4 (Key), field_3 (Vendor), field_10 (Type), field_9 (Price), field_5 (Seats), field_56 (?), field_31 (Assigned Users), field_54 (Status), field_55 (Expiry)
// All enums: { id, value }
// Minimal/test objects may have only field_1, field_12, field_239

import axios, { AxiosInstance } from 'axios';
import { BaseService } from '@clearfeed-ai/quix-common-agent';
import {
  AssetPandaConfig,
  AssetPandaObject,
  CreateUserRequest,
  CreateObjectRequest,
  SearchObjectsRequest,
  UpdateObjectRequest,
  ListUsersResponse,
  CreateUserResponse,
  ListGroupsResponse,
  SearchObjectsResponse,
  UpdateObjectResponse,
  CreateObjectResponse,
  ReserveAssetResponse,
  AssignAssetResponse,
  MarkAssetReturnedResponse,
  AssignLicenseResponse,
  ReclaimLicenseResponse,
  GetSettingsResponse
} from './types';
import { SCHEMAS } from './schema';
import { z } from 'zod';

export * from './types';
export * from './tools';

// Static group names
const GROUPS = {
  ASSETS: 'Assets',
  EMPLOYEES: 'Employees',
  SOFTWARE_LICENSES: 'Software Licenses'
};

// Static field keys
const FIELDS = {
  ASSET: {
    NAME: 'field_1',
    TYPE: 'field_15',
    STATUS: 'field_11',
    MODEL: 'field_4',
    MANUFACTURER: 'field_6',
    SKU: 'field_8',
    SERIAL: 'field_10',
    PURCHASE_DATE: 'field_2',
    PRICE: 'field_9',
    WARRANTY: 'field_40',
    WARRANTY_EXPIRY: 'field_41',
    CUSTOM_DATE: 'field_18',
    CREATED: 'field_12',
    FLAG: 'field_239'
  },
  EMPLOYEE: {
    NAME: 'field_1',
    EMAIL: 'field_2',
    EMPLOYEE_ID: 'field_4',
    STATUS: 'field_6'
  },
  LICENSE: {
    NAME: 'field_1',
    KEY: 'field_4',
    VENDOR: 'field_3',
    TYPE: 'field_10',
    PRICE: 'field_9',
    SEATS: 'field_5',
    UNKNOWN: 'field_56',
    ASSIGNED_USERS: 'field_31',
    STATUS: 'field_54',
    EXPIRY: 'field_55'
  }
};

export class AssetPandaService implements BaseService<AssetPandaConfig> {
  private client: AxiosInstance;
  private cachedSettings: any = null;
  private cachedGroupIds: Map<string, number> = new Map();

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

  private async getGroupId(groupName: string): Promise<number> {
    if (this.cachedGroupIds.has(groupName)) {
      return this.cachedGroupIds.get(groupName)!;
    }

    try {
      const response = await this.listGroups({ limit: 100 });
      if (response.success && response.data) {
        for (const group of response.data) {
          if (group.name === groupName) {
            this.cachedGroupIds.set(groupName, group.id);
            return group.id;
          }
        }
      }
      throw new Error(`Group not found: ${groupName}`);
    } catch (error) {
      throw new Error(
        `Failed to get group ID for ${groupName}: ${this.extractErrorMessage(error)}`
      );
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

  async listGroups(params: z.infer<typeof SCHEMAS.listGroupsSchema>): Promise<ListGroupsResponse> {
    try {
      const response = await this.client.get('/groups', { params });
      const data = response.data?.groups || [];
      return { success: true, data: data.map((group: any) => this.extractPrimitives(group)) };
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }

  async createObject(
    args: z.infer<typeof SCHEMAS.createObjectSchema>
  ): Promise<CreateObjectResponse> {
    try {
      const groupId = await this.getGroupId(args.group_name);
      const payload: CreateObjectRequest = args.fields;
      const response = await this.client.post(`/groups/${groupId}/objects`, payload);
      return { success: true, data: this.extractPrimitives(response.data) };
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }

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
  async createEmployee(args: Record<string, any>): Promise<CreateObjectResponse> {
    try {
      const fields: Record<string, any> = {
        [FIELDS.EMPLOYEE.NAME]: args.name,
        [FIELDS.EMPLOYEE.EMAIL]: args.email,
        [FIELDS.EMPLOYEE.EMPLOYEE_ID]: args.employee_id
      };
      // Status is optional
      if (args.status) fields[FIELDS.EMPLOYEE.STATUS] = args.status;
      return this.createObject({ group_name: GROUPS.EMPLOYEES, fields });
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }

  // --- ASSET MANAGEMENT ---
  async reserveAsset(
    args: z.infer<typeof SCHEMAS.reserveAssetSchema>
  ): Promise<ReserveAssetResponse> {
    try {
      const groupId = await this.getGroupId(GROUPS.ASSETS);
      if (!args.asset_name) return { success: false, error: 'Asset name is required' };
      const asset = await this.findObjectByName(groupId, args.asset_name);
      if (!asset) return { success: false, error: 'Asset not found' };
      const statusEnum = asset.data?.[FIELDS.ASSET.STATUS];
      let reservedId: string | undefined = undefined;
      if (
        statusEnum &&
        typeof statusEnum === 'object' &&
        statusEnum !== null &&
        'id' in statusEnum &&
        'value' in statusEnum &&
        (statusEnum as any).value !== 'Reserved'
      ) {
        reservedId = (statusEnum as any).id;
      }
      const payload: UpdateObjectRequest = {
        [FIELDS.ASSET.STATUS]: reservedId
          ? { id: reservedId, value: 'Reserved' }
          : { value: 'Reserved' }
      };
      return this.updateObject(groupId, String(asset.id), payload);
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }

  async assignAssetToUser(
    args: z.infer<typeof SCHEMAS.assignAssetToUserSchema>
  ): Promise<AssignAssetResponse> {
    try {
      const groupId = await this.getGroupId(GROUPS.ASSETS);
      if (!args.asset_name) return { success: false, error: 'Asset name is required' };
      const asset = await this.findObjectByName(groupId, args.asset_name);
      if (!asset) return { success: false, error: 'Asset not found' };
      const employee = await this.findEmployeeByEmail(args.employee_email);
      if (!employee) return { success: false, error: 'Employee not found' };
      const statusEnum = asset.data?.[FIELDS.ASSET.STATUS];
      let assignedId: string | undefined = undefined;
      if (
        statusEnum &&
        typeof statusEnum === 'object' &&
        statusEnum !== null &&
        'id' in statusEnum &&
        'value' in statusEnum &&
        (statusEnum as any).value !== 'Assigned to Employee'
      ) {
        assignedId = (statusEnum as any).id;
      }
      const payload: UpdateObjectRequest = {
        [FIELDS.ASSET.STATUS]: assignedId
          ? { id: assignedId, value: 'Assigned to Employee' }
          : { value: 'Assigned to Employee' }
      };
      return this.updateObject(groupId, String(asset.id), payload);
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }

  async markAssetReturned(
    args: z.infer<typeof SCHEMAS.markAssetReturnedSchema>
  ): Promise<MarkAssetReturnedResponse> {
    try {
      const groupId = await this.getGroupId(GROUPS.ASSETS);
      if (!args.asset_name) return { success: false, error: 'Asset name is required' };
      const asset = await this.findObjectByName(groupId, args.asset_name);
      if (!asset) return { success: false, error: 'Asset not found' };
      const statusEnum = asset.data?.[FIELDS.ASSET.STATUS];
      let availableId: string | undefined = undefined;
      if (
        statusEnum &&
        typeof statusEnum === 'object' &&
        statusEnum !== null &&
        'id' in statusEnum &&
        'value' in statusEnum &&
        (statusEnum as any).value !== 'Available'
      ) {
        availableId = (statusEnum as any).id;
      }
      const payload: UpdateObjectRequest = {
        [FIELDS.ASSET.STATUS]: availableId
          ? { id: availableId, value: 'Available' }
          : { value: 'Available' }
      };
      return this.updateObject(groupId, String(asset.id), payload);
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }

  // --- LICENSE MANAGEMENT ---
  async assignSoftwareLicense(
    args: z.infer<typeof SCHEMAS.assignSoftwareLicenseSchema>
  ): Promise<AssignLicenseResponse> {
    try {
      const groupId = await this.getGroupId(GROUPS.SOFTWARE_LICENSES);
      const license = await this.findObjectByName(groupId, args.license_name);
      if (!license) return { success: false, error: 'License not found' };
      const employee = await this.findEmployeeByEmail(args.employee_email);
      if (!employee) return { success: false, error: 'Employee not found' };
      const current = (license.data && license.data[FIELDS.LICENSE.ASSIGNED_USERS]) || {};
      let nextIdx = current ? Object.keys(current).length : 0;
      const newAssign = {
        ...current,
        [nextIdx]: { id: String(employee.id), value: employee.data?.[FIELDS.EMPLOYEE.NAME] || '' }
      };
      const payload: UpdateObjectRequest = { [FIELDS.LICENSE.ASSIGNED_USERS]: newAssign };
      return this.updateObject(groupId, String(license.id), payload);
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }

  async reclaimSoftwareLicense(
    args: z.infer<typeof SCHEMAS.reclaimSoftwareLicenseSchema>
  ): Promise<ReclaimLicenseResponse> {
    try {
      const groupId = await this.getGroupId(GROUPS.SOFTWARE_LICENSES);
      const license = await this.findObjectByName(groupId, args.license_name);
      if (!license) return { success: false, error: 'License not found' };
      const employee = await this.findEmployeeByEmail(args.employee_email);
      if (!employee) return { success: false, error: 'Employee not found' };
      const current = (license.data && license.data[FIELDS.LICENSE.ASSIGNED_USERS]) || {};
      let newAssign: Record<string, any> = {};
      for (const [k, v] of Object.entries(current)) {
        if ((v as any).id !== String(employee.id)) newAssign[k] = v;
      }
      const payload: UpdateObjectRequest = { [FIELDS.LICENSE.ASSIGNED_USERS]: newAssign };
      return this.updateObject(groupId, String(license.id), payload);
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }

  // --- ASSET AVAILABILITY ---
  async checkAssetAvailability(
    args: z.infer<typeof SCHEMAS.checkAssetAvailabilitySchema>
  ): Promise<SearchObjectsResponse> {
    try {
      const groupName = args.group_name || 'Assets';
      const groupId = await this.getGroupId(groupName);
      return await this.searchObjects({ group_id: groupId, search: args.asset_type });
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }

  // --- UTILS ---
  private async findObjectByName(groupId: number, name: string): Promise<AssetPandaObject | null> {
    const response = await this.searchObjects({ group_id: groupId, search: name });
    if (response.success && response.data && response.data.objects) {
      const objects = response.data.objects as Record<string, any>;
      for (const obj of Object.values(objects)) {
        if (
          (obj.display_name && obj.display_name.toLowerCase().includes(name.toLowerCase())) ||
          (obj.data?.[FIELDS.ASSET.NAME] &&
            typeof obj.data[FIELDS.ASSET.NAME] === 'string' &&
            obj.data[FIELDS.ASSET.NAME].toLowerCase().includes(name.toLowerCase()))
        ) {
          return obj;
        }
      }
    }
    return null;
  }

  private async findEmployeeByEmail(email: string): Promise<AssetPandaObject | null> {
    const groupId = await this.getGroupId(GROUPS.EMPLOYEES);
    const response = await this.searchObjects({ group_id: groupId, search: email });
    if (response.success && response.data && response.data.objects) {
      const objects = response.data.objects as Record<string, any>;
      for (const obj of Object.values(objects)) {
        if (
          obj.data?.[FIELDS.EMPLOYEE.EMAIL] &&
          obj.data[FIELDS.EMPLOYEE.EMAIL].toLowerCase() === email.toLowerCase()
        ) {
          return obj;
        }
      }
    }
    return null;
  }
}

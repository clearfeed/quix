import axios, { AxiosInstance } from 'axios';
import { BaseResponse, BaseService } from '@clearfeed-ai/quix-common-agent';
import {
  BambooHRConfig,
  BambooHREmployee,
  BambooHRTimeOffBalance,
  BambooHRTimeOffRequest,
  BambooHRTimeOffTypeDetails,
  ListEmployeesParams,
  GetEmployeeParams,
  GetTimeOffBalanceParams,
  GetTimeOffRequestsParams,
  CreateTimeOffRequestParams
} from './types';
import { BAMBOOHR_CONSTANTS } from './constants';
import { getCurrentYearDateRange, buildApiUrl, getEmployeeFields } from './utils';

export class BambooHRService implements BaseService<BambooHRConfig> {
  private client: AxiosInstance;

  constructor(private config: BambooHRConfig) {
    const validation = this.validateConfig(config);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    this.client = axios.create({
      baseURL: `${BAMBOOHR_CONSTANTS.API.BASE_URL}/${config.subdomain}/${BAMBOOHR_CONSTANTS.API.VERSION}`,
      auth: {
        username: config.apiKey,
        password: BAMBOOHR_CONSTANTS.API.BASIC_AUTH_PASSWORD
      },
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
  }

  validateConfig(
    config?: Record<string, any>
  ): { isValid: boolean; error?: string } & Record<string, any> {
    const cfg = config || this.config;
    if (!cfg.apiKey) {
      return { isValid: false, error: 'BambooHR API key is required' };
    }
    if (!cfg.subdomain) {
      return { isValid: false, error: 'BambooHR subdomain is required' };
    }
    return { isValid: true };
  }

  private extractErrorMessage(error: any): string {
    // Handle axios timeout errors
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again later.';
    }

    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return 'Unable to connect to BambooHR API. Please check your internet connection.';
    }

    // Handle HTTP status codes
    if (error.response?.status) {
      switch (error.response.status) {
        case 401:
          return 'Invalid API key or insufficient permissions';
        case 403:
          return 'Access forbidden. Check your account permissions.';
        case 404:
          return 'Requested resource not found';
        case 429:
          return 'Rate limit exceeded. Please try again later.';
        case 500:
          return 'BambooHR server error. Please try again later.';
        default:
          break;
      }
    }

    // Extract error message from response
    if (error.response?.data?.message) return error.response.data.message;
    if (error.response?.data?.error) return error.response.data.error;
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      return error.response.data.errors.join(', ');
    }

    // Fallback to generic error message
    if (error.message) return error.message;
    return 'Unknown error occurred';
  }

  async listEmployees(
    params: ListEmployeesParams = { limit: 1000 }
  ): Promise<BaseResponse<{ fields: any[]; employees: BambooHREmployee[] }>> {
    try {
      const queryParams: Record<string, any> = {};
      if (params.limit !== undefined) {
        queryParams.limit = params.limit;
      }
      const url = buildApiUrl('/employees/directory', queryParams);
      const response = await this.client.get(url);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }

  async getEmployeeIdByEmail(email: string): Promise<number | null> {
    const url = buildApiUrl('/employees/search', {
      field: 'workEmail',
      value: email.trim().toLowerCase()
    });
    const response = await this.client.get(url);
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      return response.data[0].id ?? null;
    }
    return null;
  }

  async getEmployee(params: GetEmployeeParams): Promise<BaseResponse<BambooHREmployee>> {
    try {
      const fields = getEmployeeFields();
      const url = buildApiUrl(`/employees/${params.employeeId.toString()}`, { fields });
      const response = await this.client.get(url);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }

  async getEmployeeTimeOffBalance(
    params: GetTimeOffBalanceParams
  ): Promise<BaseResponse<BambooHRTimeOffBalance[]>> {
    try {
      const end = params.endDate || getCurrentYearDateRange().end;
      const url = buildApiUrl(`/employees/${params.employeeId.toString()}/time_off/calculator`, {
        end
      });
      const response = await this.client.get(url);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }

  async getTimeOffRequests(
    params: GetTimeOffRequestsParams
  ): Promise<BaseResponse<BambooHRTimeOffRequest[]>> {
    try {
      // For specific employee, default to current year if dates not provided
      const dateRange = getCurrentYearDateRange();
      const start = params.startDate || dateRange.start;
      const end = params.endDate || dateRange.end;

      const queryParams: Record<string, string> = {
        action: 'view',
        start,
        end,
        employeeId: params.employeeId.toString()
      };

      if (params.status) {
        queryParams.status = params.status;
      }

      const url = buildApiUrl('/time_off/requests', queryParams);
      const response = await this.client.get(url);

      // Apply limit if specified (BambooHR API doesn't have native limit, so we slice)
      let data = response.data;
      if (params.limit && Array.isArray(data)) {
        data = data.slice(0, params.limit);
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }

  async getTimeOffTypes(): Promise<BaseResponse<BambooHRTimeOffTypeDetails[]>> {
    try {
      const response = await this.client.get('/meta/time_off/types');
      return { success: true, data: response.data.timeOffTypes || [] };
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }

  async createTimeOffRequest(
    params: CreateTimeOffRequestParams
  ): Promise<BaseResponse<{ message: string; requestId?: string }>> {
    try {
      const requestData = {
        start: params.start,
        end: params.end,
        timeOffTypeId: params.timeOffTypeId,
        amount: params.amount,
        ...(params.notes && { notes: params.notes })
      };

      const response = await this.client.put(
        `/employees/${params.employeeId.toString()}/time_off/request`,
        requestData
      );
      return {
        success: true,
        data: {
          message: 'Time off request created successfully',
          requestId: response.data?.id
        }
      };
    } catch (error) {
      return { success: false, error: this.extractErrorMessage(error) };
    }
  }
}

export * from './types';
export * from './constants';
export * from './utils';
export { createBambooHRToolsExport } from './tools';

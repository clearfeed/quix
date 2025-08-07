import axios, { AxiosInstance } from 'axios';
import { BaseService } from '@clearfeed-ai/quix-common-agent';
import {
  KandjiConfig,
  ListDevicesResponse,
  GetDeviceResponse,
  DeviceActionResponse,
  ListBlueprintsResponse,
  ListDevicesParams,
  GetDeviceParams,
  LockDeviceParams,
  ShutdownDeviceParams,
  RestartDeviceParams,
  ReinstallAgentParams,
  ResetDeviceParams,
  UnlockUserAccountParams,
  SendBlankPushParams,
  SetDeviceNameParams
} from './types';

export * from './types';
export * from './tools';

export class KandjiService implements BaseService<KandjiConfig> {
  private client: AxiosInstance;

  constructor(private config: KandjiConfig) {
    this.client = axios.create({
      baseURL: `${this.config.baseUrl}/api/v1`,
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  private handleRequestError(error: any, action: string): { success: false; error: string } {
    console.error(`Error ${action} in Kandji service:`, error);
    const message =
      (error as any).response?.data?.message || (error as Error).message || `Failed to ${action}`;
    return { success: false, error: message };
  }

  async listDevices(params: ListDevicesParams = {}): Promise<ListDevicesResponse> {
    try {
      const queryParams: Record<string, any> = {};
      if (params.limit) queryParams.limit = params.limit;
      if (params.offset) queryParams.offset = params.offset;
      if (params.search) queryParams.search = params.search;

      const response = await this.client.get('/devices', { params: queryParams });
      const data = Array.isArray(response.data) ? response.data : [];
      return { success: true, data };
    } catch (error: unknown) {
      return this.handleRequestError(error, 'list devices');
    }
  }

  async getDevice(params: GetDeviceParams): Promise<GetDeviceResponse> {
    try {
      const response = await this.client.get(`/devices/${params.deviceId}`);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return this.handleRequestError(error, 'get device');
    }
  }

  async lockDevice(params: LockDeviceParams): Promise<DeviceActionResponse> {
    try {
      await this.client.post(`/devices/${params.deviceId}/action/lock`);
      return { success: true, data: `Device ${params.deviceId} lock command sent` };
    } catch (error: unknown) {
      return this.handleRequestError(error, 'lock device');
    }
  }

  async shutdownDevice(params: ShutdownDeviceParams): Promise<DeviceActionResponse> {
    try {
      await this.client.post(`/devices/${params.deviceId}/action/shutdown`);
      return { success: true, data: `Device ${params.deviceId} shutdown command sent` };
    } catch (error: unknown) {
      return this.handleRequestError(error, 'shutdown device');
    }
  }

  async restartDevice(params: RestartDeviceParams): Promise<DeviceActionResponse> {
    try {
      await this.client.post(`/devices/${params.deviceId}/action/restart`);
      return { success: true, data: `Device ${params.deviceId} restart command sent` };
    } catch (error: unknown) {
      return this.handleRequestError(error, 'restart device');
    }
  }

  async reinstallAgent(params: ReinstallAgentParams): Promise<DeviceActionResponse> {
    try {
      await this.client.post(`/devices/${params.deviceId}/action/reinstallagent`);
      return { success: true, data: `Device ${params.deviceId} reinstall agent command sent` };
    } catch (error: unknown) {
      return this.handleRequestError(error, 'reinstall agent');
    }
  }

  async resetDevice(params: ResetDeviceParams): Promise<DeviceActionResponse> {
    try {
      await this.client.post(`/devices/${params.deviceId}/action/erase`);
      return { success: true, data: `Device ${params.deviceId} reset/erase command sent` };
    } catch (error: unknown) {
      return this.handleRequestError(error, 'reset device');
    }
  }

  async unlockUserAccount(params: UnlockUserAccountParams): Promise<DeviceActionResponse> {
    try {
      await this.client.post(`/devices/${params.deviceId}/action/unlockaccount`);
      return { success: true, data: `Device ${params.deviceId} unlock user account command sent` };
    } catch (error: unknown) {
      return this.handleRequestError(error, 'unlock user account');
    }
  }

  async sendBlankPush(params: SendBlankPushParams): Promise<DeviceActionResponse> {
    try {
      await this.client.post(`/devices/${params.deviceId}/action/updateinventory`);
      return { success: true, data: `Device ${params.deviceId} update inventory command sent` };
    } catch (error: unknown) {
      return this.handleRequestError(error, 'send update inventory command');
    }
  }

  async setDeviceName(params: SetDeviceNameParams): Promise<DeviceActionResponse> {
    try {
      await this.client.post(`/devices/${params.deviceId}/action/setname`, {
        DeviceName: params.deviceName
      });
      return { success: true, data: `Device ${params.deviceId} name set to ${params.deviceName}` };
    } catch (error: unknown) {
      return this.handleRequestError(error, 'set device name');
    }
  }

  async listBlueprints(): Promise<ListBlueprintsResponse> {
    try {
      const response = await this.client.get('/blueprints');
      const data = response.data?.results || [];
      return { success: true, data };
    } catch (error: unknown) {
      return this.handleRequestError(error, 'list blueprints');
    }
  }
}

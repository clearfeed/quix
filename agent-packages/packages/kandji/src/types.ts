import { BaseConfig, BaseResponse } from '@clearfeed-ai/quix-common-agent';

export interface KandjiConfig extends BaseConfig {
  apiKey: string;
  baseUrl: string;
}

export interface KandjiDevice {
  device_id: string;
  device_name: string;
  model: string;
  serial_number: string;
  platform: string;
  os_version: string;
  supplemental_build_version?: string;
  supplemental_os_version_extra?: string;
  last_check_in: string;
  user: string;
  asset_tag: string;
  blueprint_id: string;
  mdm_enabled: boolean;
  agent_installed: boolean;
  is_missing: boolean;
  is_removed: boolean;
  agent_version: string;
  first_enrollment: string;
  last_enrollment: string;
  blueprint_name: string;
  lost_mode_status: string;
  tags: string[];
}

export interface KandjiBlueprint {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  params: Record<string, unknown>;
  computers_count: number;
  enrollment_code: {
    code: string;
    is_active: boolean;
  };
  type: string;
}

export interface ListDevicesResponse extends BaseResponse<KandjiDevice[]> {}
export interface GetDeviceResponse extends BaseResponse<KandjiDevice> {}
export interface DeviceActionResponse extends BaseResponse<string> {}
export interface ListBlueprintsResponse extends BaseResponse<KandjiBlueprint[]> {}

export type ListDevicesParams = {
  limit?: number;
  offset?: number;
  search?: string;
};

export type GetDeviceParams = {
  deviceId: string;
};

export type DeviceActionParams = {
  deviceId: string;
};

export type LockDeviceParams = DeviceActionParams;
export type ShutdownDeviceParams = DeviceActionParams;
export type RestartDeviceParams = DeviceActionParams;
export type ReinstallAgentParams = DeviceActionParams;
export type ResetDeviceParams = DeviceActionParams;
export type UnlockUserAccountParams = DeviceActionParams;
export type SendBlankPushParams = DeviceActionParams;

export type SetDeviceNameParams = {
  deviceId: string;
  deviceName: string;
};

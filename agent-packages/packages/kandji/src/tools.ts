import { ToolConfig, ToolOperation, tool } from '@clearfeed-ai/quix-common-agent';
import { KandjiService } from './index';
import { KandjiConfig } from './types';
import { z } from 'zod';

const KANDJI_TOOL_SELECTION_PROMPT = `
Kandji is an Apple Device Management (MDM) platform that manages:
- Mac, iPhone, iPad, and Apple TV devices
- Device security policies and configurations
- Software installation and updates
- Device actions and remote management

Use Kandji tools when the user wants to:
- View device information (name, model, OS version, serial number, blueprint)
- Perform device management actions (lock, shutdown, restart, reset)
- Manage Kandji agent or device settings
`;

const KANDJI_RESPONSE_PROMPT = `When formatting Kandji responses, include important device details like device name, model, OS version, and last check-in time. For device actions, confirm the action was sent and mention that the device needs to be online and MDM-managed to execute the command.`;

export const SCHEMAS = {
  listDevices: z.object({
    limit: z.number().default(50).describe('Number of devices to return (max 300)'),
    offset: z
      .number()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Offset for pagination'),
    search: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Search query for device names')
  }),

  getDevice: z.object({
    deviceId: z.string().describe('Kandji device ID')
  }),

  lockDevice: z.object({
    deviceId: z.string().describe('Kandji device ID to lock')
  }),

  shutdownDevice: z.object({
    deviceId: z.string().describe('Kandji device ID to shutdown (macOS only)')
  }),

  restartDevice: z.object({
    deviceId: z.string().describe('Kandji device ID to restart (macOS only)')
  }),

  reinstallAgent: z.object({
    deviceId: z.string().describe('Kandji device ID to reinstall the agent on')
  }),

  resetDevice: z.object({
    deviceId: z
      .string()
      .describe('Kandji device ID to reset/erase (WARNING: This will wipe the device)')
  }),

  unlockUserAccount: z.object({
    deviceId: z.string().describe('Kandji device ID to unlock the user account on')
  }),

  sendBlankPush: z.object({
    deviceId: z.string().describe('Kandji device ID to send a blank push notification to')
  }),

  setDeviceName: z.object({
    deviceId: z.string().describe('Kandji device ID'),
    deviceName: z.string().describe('New device name to set')
  })
};

export function createKandjiToolsExport(config: KandjiConfig): ToolConfig {
  const service = new KandjiService(config);

  const tools = [
    tool({
      name: 'list_kandji_devices',
      description:
        'List devices managed by Kandji with their details including name, model, OS version, serial number, and blueprint',
      schema: SCHEMAS.listDevices,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.listDevices>) => {
        const response = await service.listDevices(args);
        if (!response.success) {
          throw new Error(response.error);
        }
        return response.data;
      }
    }),

    tool({
      name: 'get_kandji_device',
      description: 'Get detailed information about a specific Kandji device',
      schema: SCHEMAS.getDevice,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.getDevice>) => {
        const response = await service.getDevice(args);
        if (!response.success) {
          throw new Error(response.error);
        }
        return response.data;
      }
    }),

    tool({
      name: 'lock_kandji_device',
      description:
        'Lock a Kandji-managed device. iOS devices require passcode to unlock, macOS devices require generated PIN',
      schema: SCHEMAS.lockDevice,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.lockDevice>) => {
        const response = await service.lockDevice(args);
        if (!response.success) {
          throw new Error(response.error);
        }
        return response.data;
      }
    }),

    tool({
      name: 'shutdown_kandji_device',
      description: 'Shutdown a Kandji-managed macOS device (macOS only)',
      schema: SCHEMAS.shutdownDevice,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.shutdownDevice>) => {
        const response = await service.shutdownDevice(args);
        if (!response.success) {
          throw new Error(response.error);
        }
        return response.data;
      }
    }),

    tool({
      name: 'restart_kandji_device',
      description: 'Restart a Kandji-managed macOS device (macOS only)',
      schema: SCHEMAS.restartDevice,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.restartDevice>) => {
        const response = await service.restartDevice(args);
        if (!response.success) {
          throw new Error(response.error);
        }
        return response.data;
      }
    }),

    tool({
      name: 'reinstall_kandji_agent',
      description: 'Reinstall the Kandji agent on a managed device',
      schema: SCHEMAS.reinstallAgent,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.reinstallAgent>) => {
        const response = await service.reinstallAgent(args);
        if (!response.success) {
          throw new Error(response.error);
        }
        return response.data;
      }
    }),

    tool({
      name: 'reset_kandji_device',
      description:
        'Reset/erase a Kandji-managed device - WARNING: This will completely wipe the device',
      schema: SCHEMAS.resetDevice,
      operations: [ToolOperation.DELETE],
      func: async (args: z.infer<typeof SCHEMAS.resetDevice>) => {
        const response = await service.resetDevice(args);
        if (!response.success) {
          throw new Error(response.error);
        }
        return response.data;
      }
    }),

    tool({
      name: 'unlock_kandji_user_account',
      description: 'Unlock the local user account on a Kandji-managed device',
      schema: SCHEMAS.unlockUserAccount,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.unlockUserAccount>) => {
        const response = await service.unlockUserAccount(args);
        if (!response.success) {
          throw new Error(response.error);
        }
        return response.data;
      }
    }),

    tool({
      name: 'send_blank_push_kandji',
      description:
        'Send an update inventory command to a Kandji-managed device to trigger check-in and refresh device information',
      schema: SCHEMAS.sendBlankPush,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.sendBlankPush>) => {
        const response = await service.sendBlankPush(args);
        if (!response.success) {
          throw new Error(response.error);
        }
        return response.data;
      }
    }),

    tool({
      name: 'set_kandji_device_name',
      description: 'Set the name of a Kandji-managed device',
      schema: SCHEMAS.setDeviceName,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.setDeviceName>) => {
        const response = await service.setDeviceName(args);
        if (!response.success) {
          throw new Error(response.error);
        }
        return response.data;
      }
    })
  ];

  return {
    tools,
    prompts: {
      toolSelection: KANDJI_TOOL_SELECTION_PROMPT,
      responseGeneration: KANDJI_RESPONSE_PROMPT
    }
  };
}

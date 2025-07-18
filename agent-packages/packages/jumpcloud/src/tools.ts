import { ToolConfig, ToolOperation, tool } from '@clearfeed-ai/quix-common-agent';
import { JumpCloudService } from './index';
import { JumpCloudConfig } from './types';
import { z } from 'zod';

const JC_TOOL_SELECTION_PROMPT = `
JumpCloud is an identity management platform that manages:
- Users
- Groups
- Devices and systems
- Applications and access policies

Use JumpCloud tools when the user wants to manage identities, access, or device assignments.`;

const JC_RESPONSE_PROMPT = `When formatting JumpCloud responses be sure to mention object ids and important attributes. For device information, include device name, OS, and last contact time when available.`;

export const SCHEMAS = {
  listUsers: z.object({
    limit: z.number().nullish().default(20).describe('Number of users to return'),
    query: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Search query for users')
  }),
  createUserSchema: z.object({
    username: z.string().describe('Username for the user'),
    email: z.string().email().describe('Email address'),
    firstname: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('First name'),
    lastname: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Last name')
  }),
  getUserSchema: z.object({
    userId: z.string().describe('ID of the user to fetch')
  }),
  updateUserSchema: z.object({
    userId: z.string().describe('ID of the user to update'),
    payload: z
      .object({
        email: z
          .string()
          .email()
          .nullish()
          .transform((val) => val ?? undefined)
          .describe('Email address'),
        firstname: z
          .string()
          .nullish()
          .transform((val) => val ?? undefined)
          .describe('First name'),
        lastname: z
          .string()
          .nullish()
          .transform((val) => val ?? undefined)
          .describe('Last name')
      })
      .describe('User fields to update - only firstname, lastname, and email are allowed')
  }),
  deleteUserSchema: z.object({
    userId: z.string().describe('ID of the user to delete')
  }),
  listGroupsSchema: z.object({
    limit: z.number().nullish().default(20).describe('Number of groups to return'),
    query: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Search query for groups')
  }),
  createGroupSchema: z.object({
    name: z.string().describe('Name of the group'),
    description: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Group description')
  }),
  assignUserToGroupSchema: z.object({
    groupId: z.string().describe('Group ID'),
    userId: z.string().describe('User ID')
  }),
  unassignUserFromGroupSchema: z.object({
    groupId: z.string().describe('Group ID'),
    userId: z.string().describe('User ID')
  }),
  listGroupUsersSchema: z.object({
    groupId: z.string().describe('ID of the group')
  }),
  deleteGroupSchema: z.object({
    groupId: z.string().describe('ID of the group to delete')
  }),
  listUserDevicesSchema: z.object({
    userId: z.string().describe('ID of the user to list devices for')
  }),
  listDevicesSchema: z.object({
    limit: z.number().default(20).describe('Number of devices to return'),
    query: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Search query for devices')
  })
};

export function createJumpCloudToolsExport(config: JumpCloudConfig): ToolConfig {
  const service = new JumpCloudService(config);

  const tools = [
    tool({
      name: 'list_jumpcloud_users',
      description: 'List users in JumpCloud',
      schema: SCHEMAS.listUsers,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.listUsers>) => service.listUsers(args)
    }),
    tool({
      name: 'create_jumpcloud_user',
      description: 'Create a user in JumpCloud',
      schema: SCHEMAS.createUserSchema,
      operations: [ToolOperation.CREATE],
      func: async (args: z.infer<typeof SCHEMAS.createUserSchema>) => service.createUser(args)
    }),
    tool({
      name: 'get_jumpcloud_user',
      description: 'Get a specific user from JumpCloud',
      schema: SCHEMAS.getUserSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.getUserSchema>) => service.getUser(args)
    }),
    tool({
      name: 'update_jumpcloud_user',
      description: 'Update a user in JumpCloud',
      schema: SCHEMAS.updateUserSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.updateUserSchema>) => service.updateUser(args)
    }),
    tool({
      name: 'delete_jumpcloud_user',
      description: 'Delete a user in JumpCloud',
      schema: SCHEMAS.deleteUserSchema,
      operations: [ToolOperation.DELETE],
      func: async (args: z.infer<typeof SCHEMAS.deleteUserSchema>) => service.deleteUser(args)
    }),
    tool({
      name: 'list_jumpcloud_groups',
      description: 'List groups in JumpCloud',
      schema: SCHEMAS.listGroupsSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.listGroupsSchema>) => service.listGroups(args)
    }),
    tool({
      name: 'create_jumpcloud_group',
      description: 'Create a group in JumpCloud',
      schema: SCHEMAS.createGroupSchema,
      operations: [ToolOperation.CREATE],
      func: async (args: z.infer<typeof SCHEMAS.createGroupSchema>) => service.createGroup(args)
    }),
    tool({
      name: 'assign_user_to_jumpcloud_group',
      description: 'Assign a user to a JumpCloud group',
      schema: SCHEMAS.assignUserToGroupSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.assignUserToGroupSchema>) =>
        service.assignUserToGroup(args)
    }),
    tool({
      name: 'unassign_user_from_jumpcloud_group',
      description: 'Remove a user from a JumpCloud group',
      schema: SCHEMAS.unassignUserFromGroupSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.unassignUserFromGroupSchema>) =>
        service.unassignUserFromGroup(args)
    }),
    tool({
      name: 'list_jumpcloud_group_users',
      description: 'List users in a JumpCloud group',
      schema: SCHEMAS.listGroupUsersSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.listGroupUsersSchema>) =>
        service.listGroupUsers(args)
    }),
    tool({
      name: 'delete_jumpcloud_group',
      description: 'Delete a JumpCloud group',
      schema: SCHEMAS.deleteGroupSchema,
      operations: [ToolOperation.DELETE],
      func: async (args: z.infer<typeof SCHEMAS.deleteGroupSchema>) => service.deleteGroup(args)
    }),
    tool({
      name: 'list_jumpcloud_user_devices',
      description: 'List devices assigned to a specific user in JumpCloud',
      schema: SCHEMAS.listUserDevicesSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.listUserDevicesSchema>) =>
        service.listUserDevices(args)
    }),
    tool({
      name: 'list_jumpcloud_devices',
      description: 'List all devices in JumpCloud with optional search and limit',
      schema: SCHEMAS.listDevicesSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.listDevicesSchema>) => service.listDevices(args)
    })
  ];

  return {
    tools,
    prompts: {
      toolSelection: JC_TOOL_SELECTION_PROMPT,
      responseGeneration: JC_RESPONSE_PROMPT
    }
  };
}

import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { JumpCloudService } from './index';
import { JumpCloudConfig } from './types';
import { DynamicStructuredTool, tool } from '@langchain/core/tools';
import { z } from 'zod';

const JC_TOOL_SELECTION_PROMPT = `
JumpCloud is an identity management platform that manages:
- Users
- Groups
- Applications and access policies

Use JumpCloud tools when the user wants to manage identities or access.`;

const JC_RESPONSE_PROMPT = `When formatting JumpCloud responses be sure to mention object ids and important attributes.`;

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
  })
};

export function createJumpCloudToolsExport(config: JumpCloudConfig): ToolConfig {
  const service = new JumpCloudService(config);

  const tools = [
    tool(async (args: z.infer<typeof SCHEMAS.listUsers>) => service.listUsers(args), {
      name: 'list_jumpcloud_users',
      description: 'List users in JumpCloud',
      schema: SCHEMAS.listUsers
    }),
    tool(async (args: z.infer<typeof SCHEMAS.createUserSchema>) => service.createUser(args), {
      name: 'create_jumpcloud_user',
      description: 'Create a user in JumpCloud',
      schema: SCHEMAS.createUserSchema
    }),
    tool(async (args: z.infer<typeof SCHEMAS.getUserSchema>) => service.getUser(args), {
      name: 'get_jumpcloud_user',
      description: 'Get a specific user from JumpCloud',
      schema: SCHEMAS.getUserSchema
    }),
    tool(async (args: z.infer<typeof SCHEMAS.updateUserSchema>) => service.updateUser(args), {
      name: 'update_jumpcloud_user',
      description: 'Update a user in JumpCloud',
      schema: SCHEMAS.updateUserSchema
    }),
    tool(async (args: z.infer<typeof SCHEMAS.deleteUserSchema>) => service.deleteUser(args), {
      name: 'delete_jumpcloud_user',
      description: 'Delete a user in JumpCloud',
      schema: SCHEMAS.deleteUserSchema
    }),
    tool(async (args: z.infer<typeof SCHEMAS.listGroupsSchema>) => service.listGroups(args), {
      name: 'list_jumpcloud_groups',
      description: 'List groups in JumpCloud',
      schema: SCHEMAS.listGroupsSchema
    }),
    tool(async (args: z.infer<typeof SCHEMAS.createGroupSchema>) => service.createGroup(args), {
      name: 'create_jumpcloud_group',
      description: 'Create a group in JumpCloud',
      schema: SCHEMAS.createGroupSchema
    }),
    tool(
      async (args: z.infer<typeof SCHEMAS.assignUserToGroupSchema>) =>
        service.assignUserToGroup(args),
      {
        name: 'assign_user_to_jumpcloud_group',
        description: 'Assign a user to a JumpCloud group',
        schema: SCHEMAS.assignUserToGroupSchema
      }
    ),
    tool(
      async (args: z.infer<typeof SCHEMAS.unassignUserFromGroupSchema>) =>
        service.unassignUserFromGroup(args),
      {
        name: 'unassign_user_from_jumpcloud_group',
        description: 'Remove a user from a JumpCloud group',
        schema: SCHEMAS.unassignUserFromGroupSchema
      }
    ),
    tool(
      async (args: z.infer<typeof SCHEMAS.listGroupUsersSchema>) => service.listGroupUsers(args),
      {
        name: 'list_jumpcloud_group_users',
        description: 'List users in a JumpCloud group',
        schema: SCHEMAS.listGroupUsersSchema
      }
    ),
    tool(async (args: z.infer<typeof SCHEMAS.deleteGroupSchema>) => service.deleteGroup(args), {
      name: 'delete_jumpcloud_group',
      description: 'Delete a JumpCloud group',
      schema: SCHEMAS.deleteGroupSchema
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

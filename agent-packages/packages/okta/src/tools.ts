import { ToolConfig, ToolOperation, tool } from '@clearfeed-ai/quix-common-agent';
import { OktaService } from './index';
import { OktaAuthConfig } from './types';
import { SCHEMAS } from './schemas/input';
import { z } from 'zod';

const OKTA_TOOL_SELECTION_PROMPT = `
Okta is an Identity and Access Management platform that manages:
- Users: People with properties like firstName, lastName, email, etc.
- Groups: Collections of users for role-based access control
- Applications: Software services with identity configurations
- Devices: Hardware and software devices used for authentication
- Access Policies: Rules for authentication and authorization

Consider using Okta tools when the user wants to:
- Find specific users by name, email, or ID
- Look up user profile details like name, email, status
- Create or update user accounts
- Manage group memberships and assignments
- View application configurations and assignments
- Manage user access to applications
- Assign groups to applications
- List user groups and group memberships
- Manage devices and device assignments
- View device information and associated users
`;

const OKTA_RESPONSE_GENERATION_PROMPT = `
When formatting Okta responses:
- Include user/group IDs when referencing specific records
- Format important user details in bold
- Present status information clearly
- Include relevant profile properties
- Format dates in a human-readable format
`;

export function createOktaToolsExport(config: OktaAuthConfig): ToolConfig {
  const service = new OktaService(config);

  const tools = [
    tool({
      name: 'list_okta_users',
      description: 'List users in Okta, optionally filtered by a search query',
      schema: SCHEMAS.listUsers,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.listUsers>) => service.listUsers(args)
    }),
    tool({
      name: 'create_okta_user',
      description: 'Create a new user in Okta',
      schema: SCHEMAS.createUserSchema,
      operations: [ToolOperation.CREATE],
      func: async (args: z.infer<typeof SCHEMAS.createUserSchema>) => service.createUser(args)
    }),
    tool({
      name: 'get_okta_user',
      description: 'Get details of a specific user in Okta',
      schema: SCHEMAS.getUserSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.getUserSchema>) => service.getUser(args)
    }),
    tool({
      name: 'update_okta_user',
      description: 'Update an existing user in Okta',
      schema: SCHEMAS.updateUserSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.updateUserSchema>) => service.updateUser(args)
    }),
    tool({
      name: 'suspend_okta_user',
      description: 'Suspend a user in Okta',
      schema: SCHEMAS.suspendUserSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.suspendUserSchema>) => service.suspendUser(args)
    }),
    tool({
      name: 'unsuspend_okta_user',
      description: 'Reactivate a suspended user in Okta',
      schema: SCHEMAS.unsuspendUserSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.unsuspendUserSchema>) => service.unsuspendUser(args)
    }),
    tool({
      name: 'activate_okta_user',
      description: 'Activate a user in Okta, optionally activate without sending an email',
      schema: SCHEMAS.activateUserSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.activateUserSchema>) => service.activateUser(args)
    }),
    tool({
      name: 'deactivate_okta_user',
      description:
        'Deactivate a user in Okta. Only run this tool if specifically requested to deactivate by the user.',
      schema: SCHEMAS.deactivateUserSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.deactivateUserSchema>) =>
        service.deactivateUser(args)
    }),
    tool({
      name: 'unlock_okta_user',
      description: 'Unlock a locked-out user in Okta',
      schema: SCHEMAS.unlockUserSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.unlockUserSchema>) => service.unlockUser(args)
    }),
    tool({
      name: 'reset_okta_user_password',
      description: 'Send password reset email with one-time token to a user in Okta',
      schema: SCHEMAS.resetUserPasswordSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.resetUserPasswordSchema>) =>
        service.resetUserPassword(args)
    }),
    tool({
      name: 'expire_okta_user_password',
      description: "Expire a user's password in Okta, requiring them to reset it on next login",
      schema: SCHEMAS.expireUserPasswordSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.expireUserPasswordSchema>) =>
        service.expireUserPassword(args)
    }),
    tool({
      name: 'reset_okta_user_factors',
      description: 'Reset enrolled MFA factors for a user in Okta',
      schema: SCHEMAS.resetUserFactorsSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.resetUserFactorsSchema>) =>
        service.resetUserFactors(args)
    }),
    tool({
      name: 'delete_okta_user',
      description: 'Delete a user in Okta. This will fail if user is not deactivated.',
      schema: SCHEMAS.deleteUserSchema,
      operations: [ToolOperation.DELETE],
      func: async (args: z.infer<typeof SCHEMAS.deleteUserSchema>) => service.deleteUser(args)
    }),
    tool({
      name: 'list_okta_groups',
      description: 'List groups in Okta, optionally filtered by a search expression',
      schema: SCHEMAS.listGroupsSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.listGroupsSchema>) => service.listGroups(args)
    }),
    tool({
      name: 'create_okta_group',
      description: 'Create a new group in Okta',
      schema: SCHEMAS.createGroupSchema,
      operations: [ToolOperation.CREATE],
      func: async (args: z.infer<typeof SCHEMAS.createGroupSchema>) => service.createGroup(args)
    }),
    tool({
      name: 'assign_user_to_okta_group',
      description: 'Assign a user to a group in Okta',
      schema: SCHEMAS.assignUserToGroupSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.assignUserToGroupSchema>) =>
        service.assignUserToGroup(args)
    }),
    tool({
      name: 'unassign_user_from_okta_group',
      description: 'Unassign a user from a group in Okta',
      schema: SCHEMAS.unassignUserFromGroupSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.unassignUserFromGroupSchema>) =>
        service.unassignUserFromGroup(args)
    }),
    tool({
      name: 'list_okta_group_users',
      description: 'List users in a specific Okta group',
      schema: SCHEMAS.listGroupUsersSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.listGroupUsersSchema>) =>
        service.listGroupUsers(args)
    }),
    tool({
      name: 'delete_okta_group',
      description: 'Delete a group in Okta',
      schema: SCHEMAS.deleteGroupSchema,
      operations: [ToolOperation.DELETE],
      func: async (args: z.infer<typeof SCHEMAS.deleteGroupSchema>) => service.deleteGroup(args)
    }),
    tool({
      name: 'list_okta_applications',
      description: 'List applications in Okta, optionally filtered by a search query',
      schema: SCHEMAS.listApplicationsSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.listApplicationsSchema>) =>
        service.listApplications(args)
    }),
    tool({
      name: 'assign_user_to_okta_application',
      description: 'Assign a user to an application in Okta',
      schema: SCHEMAS.assignUserToApplicationSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.assignUserToApplicationSchema>) =>
        service.assignUserToApplication(args)
    }),
    tool({
      name: 'unassign_user_from_okta_application',
      description: 'Unassign a user from an application in Okta',
      schema: SCHEMAS.unassignUserFromApplicationSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.unassignUserFromApplicationSchema>) =>
        service.unassignUserFromApplication(args)
    }),
    tool({
      name: 'assign_group_to_okta_application',
      description: 'Assign a group to an application in Okta',
      schema: SCHEMAS.assignGroupToApplicationSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.assignGroupToApplicationSchema>) =>
        service.assignGroupToApplication(args)
    }),
    tool({
      name: 'unassign_group_from_okta_application',
      description: 'Unassign a group from an application in Okta',
      schema: SCHEMAS.unassignGroupFromApplicationSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.unassignGroupFromApplicationSchema>) =>
        service.unassignGroupFromApplication(args)
    }),
    tool({
      name: 'delete_okta_application',
      description: 'Delete an application in Okta',
      schema: SCHEMAS.deleteApplicationSchema,
      operations: [ToolOperation.DELETE],
      func: async (args: z.infer<typeof SCHEMAS.deleteApplicationSchema>) =>
        service.deleteApplication(args)
    }),
    tool({
      name: 'deactivate_okta_application',
      description: 'Deactivate an application in Okta',
      schema: SCHEMAS.deactivateApplicationSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.deactivateApplicationSchema>) =>
        service.deactivateApplication(args)
    }),
    tool({
      name: 'list_okta_user_groups',
      description: 'List groups for a specific user in Okta',
      schema: SCHEMAS.listUserGroupsSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.listUserGroupsSchema>) =>
        service.listUserGroups(args)
    }),
    tool({
      name: 'list_okta_devices',
      description: 'List devices in Okta, optionally filtered by a search query',
      schema: SCHEMAS.listDevicesSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.listDevicesSchema>) => service.listDevices(args)
    }),
    tool({
      name: 'list_okta_user_devices',
      description: 'List devices for a specific user in Okta',
      schema: SCHEMAS.listUserDevicesSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.listUserDevicesSchema>) =>
        service.listUserDevices(args)
    }),
    tool({
      name: 'get_okta_device',
      description: 'Get details of a specific device in Okta',
      schema: SCHEMAS.getDeviceSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.getDeviceSchema>) => service.getDevice(args)
    }),
    tool({
      name: 'list_okta_device_users',
      description: 'List users for a specific device in Okta',
      schema: SCHEMAS.listDeviceUsersSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.listDeviceUsersSchema>) =>
        service.listDeviceUsers(args)
    })
  ];

  return {
    tools,
    prompts: {
      toolSelection: OKTA_TOOL_SELECTION_PROMPT,
      responseGeneration: OKTA_RESPONSE_GENERATION_PROMPT
    }
  };
}

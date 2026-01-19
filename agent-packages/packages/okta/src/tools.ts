import { tool } from '@langchain/core/tools';
import { ToolConfig, ToolOperation, Toolkit } from '@clearfeed-ai/quix-common-agent';
import { OktaService } from './index';
import { OktaAuthConfig } from './types';
import { z } from 'zod';
import { createToolHandler } from './utils';

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

export const SCHEMAS = {
  listUsers: z.object({
    limit: z.number().default(20).describe('Number of results to return (default 20)'),
    search: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe(
        'Search expression with filtering for user properties. Supports any user profile attribute (including custom attributes), status, created, activated, statusChanged, lastUpdated, id, and type.id. Operators: eq, sw, co, gt, ge, lt, le. Logical operators: and, or. Available statuses: STAGED, PROVISIONED, ACTIVE, RECOVERY, PASSWORD_EXPIRED, LOCKED_OUT, SUSPENDED, DEPROVISIONED - use whatever is required. Examples: "profile.department eq \\"Engineering\\"", "profile.firstName sw \\"John\\"", "status eq \\"ACTIVE\\"", "profile.department eq \\"Engineering\\" and status eq \\"ACTIVE\\"".'
      )
  }),
  createUserSchema: z.object({
    profile: z.object({
      firstName: z.string().describe('First name of the user'),
      lastName: z.string().describe('Last name of the user'),
      email: z.string().email().describe('Email address of the user'),
      login: z.string().email().describe('Login (usually email) of the user')
    }),
    credentials: z
      .object({
        password: z
          .object({
            value: z.string().describe('Password for the user')
          })
          .nullish()
          .transform((val) => val ?? undefined)
      })
      .nullish()
      .transform((val) => val ?? undefined)
  }),
  getUserSchema: z.object({
    userId: z.string().describe('User ID or login to retrieve')
  }),
  updateUserSchema: z.object({
    userId: z.string().describe('ID of the user to update'),
    profile: z.object({
      firstName: z
        .string()
        .nullish()
        .transform((val) => val ?? undefined)
        .describe('Updated first name'),
      lastName: z
        .string()
        .nullish()
        .transform((val) => val ?? undefined)
        .describe('Updated last name'),
      email: z
        .string()
        .email()
        .nullish()
        .transform((val) => val ?? undefined)
        .describe('Updated email address'),
      login: z
        .string()
        .email()
        .nullish()
        .transform((val) => val ?? undefined)
        .describe('Updated login (usually email)')
    })
  }),
  deleteUserSchema: z.object({
    userId: z.string().describe('ID of the user to delete')
  }),
  suspendUserSchema: z.object({
    userId: z.string().describe('ID of the user to suspend')
  }),
  unsuspendUserSchema: z.object({
    userId: z.string().describe('ID of the user to unsuspend')
  }),
  activateUserSchema: z.object({
    userId: z.string().describe('ID of the user to activate'),
    sendEmail: z.boolean().default(true).describe('Whether to send activation email')
  }),
  deactivateUserSchema: z.object({
    userId: z.string().describe('ID of the user to deactivate')
  }),
  unlockUserSchema: z.object({
    userId: z.string().describe('ID of the user to unlock')
  }),
  resetUserPasswordSchema: z.object({
    userId: z.string().describe('ID of the user to reset password for'),
    sendEmail: z.boolean().default(true).describe('Whether to send password reset email')
  }),
  expireUserPasswordSchema: z.object({
    userId: z.string().describe('ID of the user to expire password for')
  }),
  resetUserFactorsSchema: z.object({
    userId: z.string().describe('ID of the user to reset MFA for')
  }),
  listGroupsSchema: z.object({
    limit: z.number().default(20).describe('Number of results to return (default 20)'),
    search: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Search expression for groups')
  }),
  createGroupSchema: z.object({
    profile: z.object({
      name: z.string().describe('Name of the group'),
      description: z
        .string()
        .nullish()
        .transform((val) => val ?? undefined)
        .describe('Description of the group')
    })
  }),
  assignUserToGroupSchema: z.object({
    groupId: z.string().describe('ID of the group'),
    userId: z.string().describe('ID of the user to assign')
  }),
  unassignUserFromGroupSchema: z.object({
    groupId: z.string().describe('ID of the group'),
    userId: z.string().describe('ID of the user to unassign')
  }),
  listGroupUsersSchema: z.object({
    groupId: z.string().describe('ID of the group to list users for')
  }),
  deleteGroupSchema: z.object({
    groupId: z.string().describe('ID of the group to delete')
  }),
  listApplicationsSchema: z.object({
    limit: z.number().default(20).describe('Number of results to return (default 20)'),
    query: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Searches for apps with name or label properties')
  }),
  assignUserToApplicationSchema: z.object({
    appId: z.string().describe('ID of the application'),
    userId: z.string().describe('ID of the user to assign'),
    profile: z
      .record(z.string(), z.unknown())
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Application-specific profile information')
  }),
  unassignUserFromApplicationSchema: z.object({
    appId: z.string().describe('ID of the application'),
    userId: z.string().describe('ID of the user to unassign')
  }),
  assignGroupToApplicationSchema: z.object({
    appId: z.string().describe('ID of the application'),
    groupId: z.string().describe('ID of the group to assign')
  }),
  unassignGroupFromApplicationSchema: z.object({
    appId: z.string().describe('ID of the application'),
    groupId: z.string().describe('ID of the group to unassign')
  }),
  deleteApplicationSchema: z.object({
    appId: z.string().describe('ID of the application to delete')
  }),
  deactivateApplicationSchema: z.object({
    appId: z.string().describe('ID of the application to deactivate')
  }),
  listUserGroupsSchema: z.object({
    userId: z.string().describe('ID of the user to list groups for')
  }),
  listDevicesSchema: z.object({
    limit: z.number().default(20).describe('Number of results to return (default 20)'),
    query: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Search expression for devices')
  }),
  listUserDevicesSchema: z.object({
    userId: z.string().describe('ID of the user to list devices for')
  }),
  getDeviceSchema: z.object({
    deviceId: z.string().describe('ID of the device to retrieve')
  }),
  listDeviceUsersSchema: z.object({
    deviceId: z.string().describe('ID of the device to list users for')
  })
};

export function createOktaToolsExport(config: OktaAuthConfig): Toolkit {
  const service = new OktaService(config);
  const restrictedModeEnabled = config.restrictedModeEnabled === true;

  const toolConfigs: ToolConfig[] = [
    {
      tool: tool(createToolHandler(config, service, service.getUser), {
        name: 'get_okta_user',
        description: 'Get details of a specific user in Okta',
        schema: restrictedModeEnabled
          ? SCHEMAS.getUserSchema.omit({ userId: true })
          : SCHEMAS.getUserSchema
      }),
      operations: [ToolOperation.READ]
    },
    {
      tool: tool(createToolHandler(config, service, service.updateUser), {
        name: 'update_okta_user',
        description: 'Update an existing user in Okta',
        schema: restrictedModeEnabled
          ? SCHEMAS.updateUserSchema.omit({ userId: true })
          : SCHEMAS.updateUserSchema
      }),
      operations: [ToolOperation.UPDATE]
    },
    {
      tool: tool(createToolHandler(config, service, service.suspendUser), {
        name: 'suspend_okta_user',
        description: 'Suspend a user in Okta',
        schema: restrictedModeEnabled
          ? SCHEMAS.suspendUserSchema.omit({ userId: true })
          : SCHEMAS.suspendUserSchema
      }),
      operations: [ToolOperation.UPDATE]
    },
    {
      tool: tool(createToolHandler(config, service, service.unsuspendUser), {
        name: 'unsuspend_okta_user',
        description: 'Reactivate a suspended user in Okta',
        schema: restrictedModeEnabled
          ? SCHEMAS.unsuspendUserSchema.omit({ userId: true })
          : SCHEMAS.unsuspendUserSchema
      }),
      operations: [ToolOperation.UPDATE]
    },
    {
      tool: tool(createToolHandler(config, service, service.activateUser), {
        name: 'activate_okta_user',
        description: 'Activate a user in Okta, optionally activate without sending an email',
        schema: restrictedModeEnabled
          ? SCHEMAS.activateUserSchema.omit({ userId: true })
          : SCHEMAS.activateUserSchema
      }),
      operations: [ToolOperation.UPDATE]
    },
    {
      tool: tool(createToolHandler(config, service, service.deactivateUser), {
        name: 'deactivate_okta_user',
        description:
          'Deactivate a user in Okta. Only run this tool if specifically requested to deactivate by the user.',
        schema: restrictedModeEnabled
          ? SCHEMAS.deactivateUserSchema.omit({ userId: true })
          : SCHEMAS.deactivateUserSchema
      }),
      operations: [ToolOperation.UPDATE]
    },
    {
      tool: tool(createToolHandler(config, service, service.unlockUser), {
        name: 'unlock_okta_user',
        description: 'Unlock a locked-out user in Okta',
        schema: restrictedModeEnabled
          ? SCHEMAS.unlockUserSchema.omit({ userId: true })
          : SCHEMAS.unlockUserSchema
      }),
      operations: [ToolOperation.UPDATE]
    },
    {
      tool: tool(createToolHandler(config, service, service.resetUserPassword), {
        name: 'reset_okta_user_password',
        description: 'Send password reset email with one-time token to a user in Okta',
        schema: restrictedModeEnabled
          ? SCHEMAS.resetUserPasswordSchema.omit({ userId: true })
          : SCHEMAS.resetUserPasswordSchema
      }),
      operations: [ToolOperation.UPDATE]
    },
    {
      tool: tool(createToolHandler(config, service, service.expireUserPassword), {
        name: 'expire_okta_user_password',
        description: "Expire a user's password in Okta, requiring them to reset it on next login",
        schema: restrictedModeEnabled
          ? SCHEMAS.expireUserPasswordSchema.omit({ userId: true })
          : SCHEMAS.expireUserPasswordSchema
      }),
      operations: [ToolOperation.UPDATE]
    },
    {
      tool: tool(createToolHandler(config, service, service.resetUserFactors), {
        name: 'reset_okta_user_factors',
        description: 'Reset enrolled MFA factors for a user in Okta',
        schema: restrictedModeEnabled
          ? SCHEMAS.resetUserFactorsSchema.omit({ userId: true })
          : SCHEMAS.resetUserFactorsSchema
      }),
      operations: [ToolOperation.UPDATE]
    },
    {
      tool: tool(createToolHandler(config, service, service.deleteUser), {
        name: 'delete_okta_user',
        description: 'Delete a user in Okta. This will fail if user is not deactivated.',
        schema: restrictedModeEnabled
          ? SCHEMAS.deleteUserSchema.omit({ userId: true })
          : SCHEMAS.deleteUserSchema
      }),
      operations: [ToolOperation.DELETE]
    },
    {
      tool: tool(createToolHandler(config, service, service.assignUserToGroup), {
        name: 'assign_user_to_okta_group',
        description: 'Assign a user to a group in Okta',
        schema: restrictedModeEnabled
          ? SCHEMAS.assignUserToGroupSchema.omit({ userId: true })
          : SCHEMAS.assignUserToGroupSchema
      }),
      operations: [ToolOperation.UPDATE]
    },
    {
      tool: tool(createToolHandler(config, service, service.unassignUserFromGroup), {
        name: 'unassign_user_from_okta_group',
        description: 'Unassign a user from a group in Okta',
        schema: restrictedModeEnabled
          ? SCHEMAS.unassignUserFromGroupSchema.omit({ userId: true })
          : SCHEMAS.unassignUserFromGroupSchema
      }),
      operations: [ToolOperation.UPDATE]
    },
    {
      tool: tool(createToolHandler(config, service, service.assignUserToApplication), {
        name: 'assign_user_to_okta_application',
        description: 'Assign a user to an application in Okta',
        schema: restrictedModeEnabled
          ? SCHEMAS.assignUserToApplicationSchema.omit({ userId: true })
          : SCHEMAS.assignUserToApplicationSchema
      }),
      operations: [ToolOperation.UPDATE]
    },
    {
      tool: tool(createToolHandler(config, service, service.unassignUserFromApplication), {
        name: 'unassign_user_from_okta_application',
        description: 'Unassign a user from an application in Okta',
        schema: restrictedModeEnabled
          ? SCHEMAS.unassignUserFromApplicationSchema.omit({ userId: true })
          : SCHEMAS.unassignUserFromApplicationSchema
      }),
      operations: [ToolOperation.UPDATE]
    },
    {
      tool: tool(createToolHandler(config, service, service.listUserGroups), {
        name: 'list_okta_user_groups',
        description: 'List groups for a specific user in Okta',
        schema: restrictedModeEnabled
          ? SCHEMAS.listUserGroupsSchema.omit({ userId: true })
          : SCHEMAS.listUserGroupsSchema
      }),
      operations: [ToolOperation.READ]
    },
    {
      tool: tool(createToolHandler(config, service, service.listUserDevices), {
        name: 'list_okta_user_devices',
        description: 'List devices for a specific user in Okta',
        schema: restrictedModeEnabled
          ? SCHEMAS.listUserDevicesSchema.omit({ userId: true })
          : SCHEMAS.listUserDevicesSchema
      }),
      operations: [ToolOperation.READ]
    },
    {
      tool: tool(service.listDevices, {
        name: 'list_okta_devices',
        description: 'List devices in Okta, optionally filtered by a search query',
        schema: SCHEMAS.listDevicesSchema
      }),
      operations: [ToolOperation.READ]
    },
    {
      tool: tool(service.getDevice, {
        name: 'get_okta_device',
        description: 'Get details of a specific device in Okta',
        schema: SCHEMAS.getDeviceSchema
      }),
      operations: [ToolOperation.READ]
    },
    {
      tool: tool(service.listApplications, {
        name: 'list_okta_applications',
        description: 'List applications in Okta, optionally filtered by a search query',
        schema: SCHEMAS.listApplicationsSchema
      }),
      operations: [ToolOperation.READ]
    }
  ];

  // Add list_users only in unrestricted mode (exposes all users)
  if (!restrictedModeEnabled) {
    toolConfigs.push(
      {
        tool: tool(service.listUsers, {
          name: 'list_okta_users',
          description:
            'List users in Okta using the search or filter parameter to filter by any user properties, including profile attributes, status, and dates. Always use dates in extended format (e.g., 2013-06-01T00:00:00.000Z).',
          schema: SCHEMAS.listUsers
        }),
        operations: [ToolOperation.READ]
      },
      {
        tool: tool(service.createUser, {
          name: 'create_okta_user',
          description: 'Create a new user in Okta',
          schema: SCHEMAS.createUserSchema
        }),
        operations: [ToolOperation.CREATE]
      },
      {
        tool: tool(service.createGroup, {
          name: 'create_okta_group',
          description: 'Create a new group in Okta',
          schema: SCHEMAS.createGroupSchema
        }),
        operations: [ToolOperation.CREATE]
      },
      {
        tool: tool(service.assignGroupToApplication, {
          name: 'assign_group_to_okta_application',
          description: 'Assign a group to an application in Okta',
          schema: SCHEMAS.assignGroupToApplicationSchema
        }),
        operations: [ToolOperation.UPDATE]
      },
      {
        tool: tool(service.unassignGroupFromApplication, {
          name: 'unassign_group_from_okta_application',
          description: 'Unassign a group from an application in Okta',
          schema: SCHEMAS.unassignGroupFromApplicationSchema
        }),
        operations: [ToolOperation.UPDATE]
      },
      {
        tool: tool(service.deleteApplication, {
          name: 'delete_okta_application',
          description: 'Delete an application in Okta',
          schema: SCHEMAS.deleteApplicationSchema
        }),
        operations: [ToolOperation.DELETE]
      },
      {
        tool: tool(service.deactivateApplication, {
          name: 'deactivate_okta_application',
          description: 'Deactivate an application in Okta',
          schema: SCHEMAS.deactivateApplicationSchema
        }),
        operations: [ToolOperation.UPDATE]
      },

      {
        tool: tool(service.deleteGroup, {
          name: 'delete_okta_group',
          description: 'Delete a group in Okta',
          schema: SCHEMAS.deleteGroupSchema
        }),
        operations: [ToolOperation.DELETE]
      },
      {
        tool: tool(service.listGroups, {
          name: 'list_okta_groups',
          description: 'List groups in Okta, optionally filtered by a search expression',
          schema: SCHEMAS.listGroupsSchema
        }),
        operations: [ToolOperation.READ]
      },
      {
        tool: tool(service.listGroupUsers, {
          name: 'list_okta_group_users',
          description: 'List users in a specific Okta group',
          schema: SCHEMAS.listGroupUsersSchema
        }),
        operations: [ToolOperation.READ]
      },
      {
        tool: tool(service.listDeviceUsers, {
          name: 'list_okta_device_users',
          description: 'List users for a specific device in Okta',
          schema: SCHEMAS.listDeviceUsersSchema
        }),
        operations: [ToolOperation.READ]
      }
    );
  }

  return {
    toolConfigs,
    prompts: {
      toolSelection: OKTA_TOOL_SELECTION_PROMPT,
      responseGeneration: OKTA_RESPONSE_GENERATION_PROMPT
    }
  };
}

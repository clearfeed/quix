import { z } from 'zod';

export const SCHEMAS = {
  listUsers: z.object({
    limit: z.number().default(20).describe('Number of results to return (default 20)'),
    query: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined)
      .describe('Search a user by firstName, lastName, or email')
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
      .record(z.unknown())
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

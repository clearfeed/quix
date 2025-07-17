import { z } from 'zod';
import {
  userSchema,
  groupSchema,
  applicationSchema,
  deviceSchema,
  applicationUserAssignmentSchema,
  applicationGroupAssignmentSchema
} from '../types';

export const createUserResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: userSchema
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const getUserResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: userSchema
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const updateUserResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: userSchema
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const activateUserResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: userSchema
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const suspendUserResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.string()
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const unsuspendUserResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.string()
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const listUsersResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.array(userSchema)
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const createGroupResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: groupSchema
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const listGroupsResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.array(groupSchema)
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const getUserGroupsResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.array(groupSchema)
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const listApplicationsResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.array(applicationSchema)
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const assignUserToApplicationResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: applicationUserAssignmentSchema
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const assignGroupToApplicationResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: applicationGroupAssignmentSchema
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const listDevicesResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.array(deviceSchema)
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const getDeviceResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: deviceSchema
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const listDevicesForUserResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.array(deviceSchema)
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const listUsersForDeviceResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.array(userSchema)
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const deactivateUserResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.string()
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const unlockUserResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.string()
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const resetUserPasswordResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.string()
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const expireUserPasswordResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.string()
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const resetUserFactorsResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.string()
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const deleteUserResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.string()
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const assignUserToGroupResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.string()
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const unassignUserFromGroupResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.string()
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const listGroupUsersResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.array(userSchema)
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const deleteGroupResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.string()
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const unassignUserFromApplicationResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.string()
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const unassignGroupFromApplicationResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.string()
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const deleteApplicationResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.string()
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const deactivateApplicationResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.string()
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const listUserGroupsResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.array(groupSchema)
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const listUserDevicesResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.array(deviceSchema)
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export const listDeviceUsersResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.array(userSchema)
  }),
  z.object({
    success: z.literal(false),
    error: z.string()
  })
]);

export type CreateUserResponse = z.infer<typeof createUserResponseSchema>;
export type GetUserResponse = z.infer<typeof getUserResponseSchema>;
export type UpdateUserResponse = z.infer<typeof updateUserResponseSchema>;
export type ActivateUserResponse = z.infer<typeof activateUserResponseSchema>;
export type SuspendUserResponse = z.infer<typeof suspendUserResponseSchema>;
export type UnsuspendUserResponse = z.infer<typeof unsuspendUserResponseSchema>;
export type ListUsersResponse = z.infer<typeof listUsersResponseSchema>;
export type CreateGroupResponse = z.infer<typeof createGroupResponseSchema>;
export type ListGroupsResponse = z.infer<typeof listGroupsResponseSchema>;
export type GetUserGroupsResponse = z.infer<typeof getUserGroupsResponseSchema>;
export type ListApplicationsResponse = z.infer<typeof listApplicationsResponseSchema>;
export type AssignUserToApplicationResponse = z.infer<typeof assignUserToApplicationResponseSchema>;
export type AssignGroupToApplicationResponse = z.infer<
  typeof assignGroupToApplicationResponseSchema
>;
export type ListDevicesResponse = z.infer<typeof listDevicesResponseSchema>;
export type GetDeviceResponse = z.infer<typeof getDeviceResponseSchema>;
export type ListDevicesForUserResponse = z.infer<typeof listDevicesForUserResponseSchema>;
export type ListUsersForDeviceResponse = z.infer<typeof listUsersForDeviceResponseSchema>;
export type DeactivateUserResponse = z.infer<typeof deactivateUserResponseSchema>;
export type UnlockUserResponse = z.infer<typeof unlockUserResponseSchema>;
export type ResetUserPasswordResponse = z.infer<typeof resetUserPasswordResponseSchema>;
export type ExpireUserPasswordResponse = z.infer<typeof expireUserPasswordResponseSchema>;
export type ResetUserFactorsResponse = z.infer<typeof resetUserFactorsResponseSchema>;
export type DeleteUserResponse = z.infer<typeof deleteUserResponseSchema>;
export type AssignUserToGroupResponse = z.infer<typeof assignUserToGroupResponseSchema>;
export type UnassignUserFromGroupResponse = z.infer<typeof unassignUserFromGroupResponseSchema>;
export type ListGroupUsersResponse = z.infer<typeof listGroupUsersResponseSchema>;
export type DeleteGroupResponse = z.infer<typeof deleteGroupResponseSchema>;
export type UnassignUserFromApplicationResponse = z.infer<
  typeof unassignUserFromApplicationResponseSchema
>;
export type UnassignGroupFromApplicationResponse = z.infer<
  typeof unassignGroupFromApplicationResponseSchema
>;
export type DeleteApplicationResponse = z.infer<typeof deleteApplicationResponseSchema>;
export type DeactivateApplicationResponse = z.infer<typeof deactivateApplicationResponseSchema>;
export type ListUserGroupsResponse = z.infer<typeof listUserGroupsResponseSchema>;
export type ListUserDevicesResponse = z.infer<typeof listUserDevicesResponseSchema>;
export type ListDeviceUsersResponse = z.infer<typeof listDeviceUsersResponseSchema>;

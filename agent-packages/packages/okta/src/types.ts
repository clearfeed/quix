import { BaseConfig } from '@clearfeed-ai/quix-common-agent';
import { z } from 'zod';

export type OktaTokenAuthConfig = {
  orgUrl: string;
  token: string;
};

export type OktaPrivateKeyAuthConfig = {
  orgUrl: string;
  authorizationMode: 'PrivateKey';
  clientId: string;
  scopes: string[];
  privateKey: string;
  privateKeyId: string;
};

export type OktaAuthConfig = BaseConfig & (OktaTokenAuthConfig | OktaPrivateKeyAuthConfig);

export const userProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  login: z.string(),
  displayName: z.string().optional(),
  nickName: z.string().optional(),
  profileUrl: z.string().optional(),
  secondEmail: z.string().optional(),
  mobilePhone: z.string().optional(),
  primaryPhone: z.string().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  countryCode: z.string().optional(),
  postalAddress: z.string().optional(),
  preferredLanguage: z.string().optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
  userType: z.string().optional(),
  employeeNumber: z.string().optional(),
  costCenter: z.string().optional(),
  organization: z.string().optional(),
  division: z.string().optional(),
  department: z.string().optional(),
  managerId: z.string().optional(),
  manager: z.string().optional(),
  title: z.string().optional(),
  honorificPrefix: z.string().optional(),
  honorificSuffix: z.string().optional(),
  middleName: z.string().optional()
});

export const userSchema = z.object({
  id: z.string(),
  status: z.string(),
  created: z.string(),
  activated: z.string().optional(),
  statusChanged: z.string().optional(),
  lastLogin: z.string().optional(),
  lastUpdated: z.string(),
  passwordChanged: z.string().optional(),
  type: z
    .object({
      id: z.string()
    })
    .optional(),
  profile: userProfileSchema,
  credentials: z
    .object({
      password: z
        .object({
          value: z.string().optional()
        })
        .optional(),
      recovery_question: z
        .object({
          question: z.string().optional(),
          answer: z.string().optional()
        })
        .optional(),
      provider: z
        .object({
          type: z.string(),
          name: z.string().optional()
        })
        .optional()
    })
    .optional(),
  _links: z.record(z.unknown()).optional()
});

export const groupProfileSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  samAccountName: z.string().optional(),
  dn: z.string().optional(),
  windowsDomainQualifiedName: z.string().optional(),
  externalId: z.string().optional()
});

export const groupSchema = z.object({
  id: z.string(),
  created: z.string(),
  lastUpdated: z.string(),
  lastMembershipUpdated: z.string().optional(),
  objectClass: z.array(z.string()).optional(),
  type: z.string(),
  profile: groupProfileSchema,
  _links: z.record(z.unknown()).optional()
});

export const applicationSettingsSchema = z.object({
  app: z.record(z.unknown()).optional(),
  notifications: z
    .object({
      vpn: z
        .object({
          network: z
            .object({
              connection: z.string().optional()
            })
            .optional(),
          message: z.string().optional()
        })
        .optional()
    })
    .optional(),
  signOn: z.record(z.unknown()).optional()
});

export const applicationSchema = z.object({
  id: z.string(),
  name: z.string(),
  label: z.string().optional(),
  status: z.string(),
  accessibility: z
    .object({
      selfService: z.boolean().optional(),
      errorRedirectUrl: z.string().optional(),
      loginRedirectUrl: z.string().optional()
    })
    .optional(),
  visibility: z
    .object({
      autoSubmitToolbar: z.boolean().optional(),
      hide: z
        .object({
          iOS: z.boolean().optional(),
          web: z.boolean().optional()
        })
        .optional(),
      appLinks: z.record(z.boolean()).optional()
    })
    .optional(),
  features: z.array(z.string()).optional(),
  signOnMode: z.string().optional(),
  credentials: z
    .object({
      userNameTemplate: z
        .object({
          template: z.string().optional(),
          type: z.string().optional()
        })
        .optional(),
      signing: z
        .object({
          kid: z.string().optional()
        })
        .optional(),
      userName: z.string().optional(),
      password: z
        .object({
          value: z.string().optional()
        })
        .optional(),
      scheme: z.string().optional()
    })
    .optional(),
  settings: applicationSettingsSchema.optional(),
  _links: z.record(z.unknown()).optional()
});

export const deviceSchema = z.object({
  id: z.string(),
  status: z.string(),
  created: z.string(),
  lastUpdated: z.string(),
  profile: z
    .object({
      displayName: z.string().optional(),
      platform: z.string().optional(),
      serialNumber: z.string().optional(),
      sid: z.string().optional(),
      registered: z.boolean().optional(),
      secureHardwarePresent: z.boolean().optional(),
      diskEncryptionType: z.string().optional()
    })
    .optional(),
  resourceType: z.string().optional(),
  resourceDisplayName: z
    .object({
      value: z.string().optional(),
      sensitive: z.boolean().optional()
    })
    .optional(),
  resourceAlternateId: z.string().optional(),
  resourceId: z.string().optional(),
  _links: z.record(z.unknown()).optional()
});

export const applicationUserAssignmentSchema = z.object({
  id: z.string(),
  scope: z.string().optional(),
  credentials: z
    .object({
      userName: z.string().optional(),
      password: z
        .object({
          value: z.string().optional()
        })
        .optional()
    })
    .optional(),
  profile: z.record(z.unknown()).optional(),
  created: z.string().optional(),
  lastUpdated: z.string().optional(),
  _links: z.record(z.unknown()).optional()
});

export const applicationGroupAssignmentSchema = z.object({
  id: z.string(),
  lastUpdated: z.string().optional(),
  priority: z.number().optional(),
  profile: z.record(z.unknown()).optional(),
  _links: z.record(z.unknown()).optional()
});

// Re-export response schemas and types from the output schema file
export {
  createUserResponseSchema,
  getUserResponseSchema,
  updateUserResponseSchema,
  activateUserResponseSchema,
  suspendUserResponseSchema,
  unsuspendUserResponseSchema,
  listUsersResponseSchema,
  createGroupResponseSchema,
  listGroupsResponseSchema,
  getUserGroupsResponseSchema,
  listApplicationsResponseSchema,
  assignUserToApplicationResponseSchema,
  assignGroupToApplicationResponseSchema,
  listDevicesResponseSchema,
  getDeviceResponseSchema,
  listDevicesForUserResponseSchema,
  listUsersForDeviceResponseSchema,
  deactivateUserResponseSchema,
  unlockUserResponseSchema,
  resetUserPasswordResponseSchema,
  expireUserPasswordResponseSchema,
  resetUserFactorsResponseSchema,
  deleteUserResponseSchema,
  assignUserToGroupResponseSchema,
  unassignUserFromGroupResponseSchema,
  listGroupUsersResponseSchema,
  deleteGroupResponseSchema,
  unassignUserFromApplicationResponseSchema,
  unassignGroupFromApplicationResponseSchema,
  deleteApplicationResponseSchema,
  deactivateApplicationResponseSchema,
  listUserGroupsResponseSchema,
  listUserDevicesResponseSchema,
  listDeviceUsersResponseSchema,
  type CreateUserResponse,
  type GetUserResponse,
  type UpdateUserResponse,
  type ActivateUserResponse,
  type SuspendUserResponse,
  type UnsuspendUserResponse,
  type ListUsersResponse,
  type CreateGroupResponse,
  type ListGroupsResponse,
  type GetUserGroupsResponse,
  type ListApplicationsResponse,
  type AssignUserToApplicationResponse,
  type AssignGroupToApplicationResponse,
  type ListDevicesResponse,
  type GetDeviceResponse,
  type ListDevicesForUserResponse,
  type ListUsersForDeviceResponse,
  type DeactivateUserResponse,
  type UnlockUserResponse,
  type ResetUserPasswordResponse,
  type ExpireUserPasswordResponse,
  type ResetUserFactorsResponse,
  type DeleteUserResponse,
  type AssignUserToGroupResponse,
  type UnassignUserFromGroupResponse,
  type ListGroupUsersResponse,
  type DeleteGroupResponse,
  type UnassignUserFromApplicationResponse,
  type UnassignGroupFromApplicationResponse,
  type DeleteApplicationResponse,
  type DeactivateApplicationResponse,
  type ListUserGroupsResponse,
  type ListUserDevicesResponse,
  type ListDeviceUsersResponse
} from './schemas/output';

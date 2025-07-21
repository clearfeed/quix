/**
 * BambooHR API constants and configurations
 */

export const BAMBOOHR_CONSTANTS = {
  API: {
    BASE_URL: 'https://api.bamboohr.com/api/gateway.php',
    VERSION: 'v1',
    BASIC_AUTH_PASSWORD: 'x'
  },

  TIME_OFF_TYPES: {
    VACATION: '78',
    SICK: '79',
    BEREAVEMENT: '77',
    COVID_19: '82',
    COMP_TIME: '81',
    FMLA: '80'
  } as const,

  TIME_OFF_STATUS: {
    APPROVED: 'approved',
    DENIED: 'denied',
    SUPERCEDED: 'superceded',
    REQUESTED: 'requested',
    CANCELED: 'canceled'
  } as const,

  EMPLOYEE_FIELDS: {
    BASIC: [
      'jobTitle',
      'supervisor',
      'department',
      'workEmail',
      'firstName',
      'lastName',
      'displayName',
      'preferredName',
      'workPhone',
      'mobilePhone',
      'location',
      'division'
    ],
    EXTENDED: [
      'hireDate',
      'employmentStatus',
      'employeeNumber',
      'dateOfBirth',
      'gender',
      'maritalStatus'
    ]
  },

  PAGINATION: {
    DEFAULT_LIMIT: 100,
    MAX_LIMIT: 1000
  },

  DATE_FORMATS: {
    API_DATE: 'YYYY-MM-DD',
    DISPLAY_DATE: 'MMM DD, YYYY'
  }
};

export type TimeOffTypeId =
  (typeof BAMBOOHR_CONSTANTS.TIME_OFF_TYPES)[keyof typeof BAMBOOHR_CONSTANTS.TIME_OFF_TYPES];
export type TimeOffStatus =
  (typeof BAMBOOHR_CONSTANTS.TIME_OFF_STATUS)[keyof typeof BAMBOOHR_CONSTANTS.TIME_OFF_STATUS];

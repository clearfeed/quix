import { ToolConfig, ToolOperation, tool } from '@clearfeed-ai/quix-common-agent';
import { AssetPandaService } from './index';
import { AssetPandaConfig, SCHEMAS } from './types';
import { z } from 'zod';

const ASSETPANDA_TOOL_SELECTION_PROMPT = `
AssetPanda is an asset management platform for managing employees, assets, and software licenses.

When using AssetPanda tools, always follow these workflows:

1. **Create Employee Record**
   - First, search for the employee by email.
   - If the employee does not exist, create a new employee.
   - The account ID will be automatically retrieved from the AssetPanda settings.

2. **Create Object in Group**
   - First, get the list of available groups to identify the correct group.
   - Create the object in the specified group using dynamic fields (field_1, field_2, etc.).
   - Fields are key-value pairs that can contain any data (e.g., field_1: "Asset Name", field_2: "Description", gps_coordinates: [50, 50]).

3. **Assign Asset to User**
   - Search for the asset by name or other criteria to obtain its ID.
   - Search for the employee by email.
   - If the employee does not exist, create the employee.
   - Assign the asset by updating its status and assigned fields.

4. **Mark Asset as Returned**
   - Search for the employee by email to get their ID.
   - Search for all assets assigned to the employee.
   - For each asset to be returned, update its status and assigned fields to reflect return.

5. **Reserve Asset**
   - Identify the correct asset group (e.g., "Assets", "Hardware", "Licenses") and get its group_id.
   - Search for the asset(s) to obtain their id(s).
   - Reserve the asset by updating its status.

6. **Assign Software License**
   - Identify the license group and search for the right license.
   - Check if a seat is available (available seats > 0).
   - If available, assign the license to the employee (search/create employee as needed).

7. **Reclaim/Deallocate Software License**
   - Search for the employee by email to get their ID.
   - Identify the license group and search for the license assigned to the user.
   - Remove the employee from the assigned list and increase the available seats count.

**Always chain these steps as needed. Never assume a record exists—always search first. If an API call fails, explain what went wrong and suggest verifying IDs or permissions.**
`;

const ASSETPANDA_RESPONSE_PROMPT = `When formatting AssetPanda responses be sure to mention object IDs, employee emails, and asset names. For asset assignments, include the asset name and assigned employee. For license management, include available seats and assigned users.`;

export function createAssetPandaToolsExport(config: AssetPandaConfig): ToolConfig {
  const service = new AssetPandaService(config);

  const tools = [
    tool({
      name: 'get_assetpanda_settings',
      description:
        'Get AssetPanda account settings including account ID, groups, and configuration',
      schema: SCHEMAS.getSettingsSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.getSettingsSchema>) => service.getSettings()
    }),

    tool({
      name: 'get_assetpanda_current_user',
      description: 'Get current AssetPanda user information including account ID',
      schema: z.object({}),
      operations: [ToolOperation.READ],
      func: async () => service.getCurrentUser()
    }),

    tool({
      name: 'create_assetpanda_employee',
      description:
        'Create a new employee record in AssetPanda. If the employee already exists, returns the existing record. The account ID will be automatically retrieved from settings.',
      schema: SCHEMAS.createEmployeeSchema,
      operations: [ToolOperation.CREATE],
      func: async (args: z.infer<typeof SCHEMAS.createEmployeeSchema>) =>
        service.createEmployee(args)
    }),

    tool({
      name: 'create_assetpanda_object',
      description:
        'Create a new object (asset, employee, license, etc.) in a specific AssetPanda group using dynamic fields (e.g., field_1, field_2, gps_coordinates)',
      schema: SCHEMAS.createObjectSchema,
      operations: [ToolOperation.CREATE],
      func: async (args: z.infer<typeof SCHEMAS.createObjectSchema>) => service.createObject(args)
    }),

    tool({
      name: 'reserve_assetpanda_asset',
      description:
        'Reserve an asset in AssetPanda for future assignment. Marks the asset as reserved status.',
      schema: SCHEMAS.reserveAssetSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.reserveAssetSchema>) => service.reserveAsset(args)
    }),

    tool({
      name: 'assign_assetpanda_asset_to_user',
      description: 'Assign a hardware asset to a specific employee in AssetPanda.',
      schema: SCHEMAS.assignAssetToUserSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.assignAssetToUserSchema>) =>
        service.assignAssetToUser(args)
    }),

    tool({
      name: 'mark_assetpanda_asset_returned',
      description:
        'Mark an asset as returned by an employee. Unassigns the asset and marks it as available.',
      schema: SCHEMAS.markAssetReturnedSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.markAssetReturnedSchema>) =>
        service.markAssetReturned(args)
    }),

    tool({
      name: 'assign_assetpanda_software_license',
      description:
        'Assign a software license to an employee. Reduces available seats and adds employee to assigned users.',
      schema: SCHEMAS.assignSoftwareLicenseSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.assignSoftwareLicenseSchema>) =>
        service.assignSoftwareLicense(args)
    }),

    tool({
      name: 'reclaim_assetpanda_software_license',
      description:
        'Reclaim a software license from an employee. Increases available seats and removes employee from assigned users.',
      schema: SCHEMAS.reclaimSoftwareLicenseSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.reclaimSoftwareLicenseSchema>) =>
        service.reclaimSoftwareLicense(args)
    }),

    tool({
      name: 'check_assetpanda_asset_availability',
      description:
        'Check the availability of assets by type. Returns available assets matching the search criteria.',
      schema: SCHEMAS.checkAssetAvailabilitySchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.checkAssetAvailabilitySchema>) => {
        return service.checkAssetAvailability(args);
      }
    }),

    tool({
      name: 'list_assetpanda_groups',
      description: 'List all groups in AssetPanda (Assets, Licenses, Employees, etc.)',
      schema: SCHEMAS.listGroupsSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.listGroupsSchema>) => service.listGroups(args)
    }),

    tool({
      name: 'list_assetpanda_users',
      description: 'List all users/employees in AssetPanda',
      schema: SCHEMAS.listUsersSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.listUsersSchema>) => service.listUsers(args)
    }),

    tool({
      name: 'search_assetpanda_objects',
      description: 'Search for objects (assets, licenses) in a specific group with filters',
      schema: SCHEMAS.searchObjectsSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.searchObjectsSchema>) => service.searchObjects(args)
    })
  ];

  return {
    tools,
    prompts: {
      toolSelection: ASSETPANDA_TOOL_SELECTION_PROMPT,
      responseGeneration: ASSETPANDA_RESPONSE_PROMPT
    }
  };
}

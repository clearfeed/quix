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
      name: 'list_assetpanda_groups',
      description:
        'List all groups and their keys in AssetPanda (Assets, Licenses, Employees, etc.)',
      schema: z.object({}),
      operations: [ToolOperation.READ],
      func: async () => service.listGroups()
    }),

    tool({
      name: 'list_assetpanda_objects',
      description: 'List all objects in a specific AssetPanda group with pagination support',
      schema: SCHEMAS.listObjectsSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.listObjectsSchema>) => service.listObjects(args)
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
      name: 'list_assetpanda_users',
      description: 'List all users/employees in AssetPanda',
      schema: SCHEMAS.listUsersSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.listUsersSchema>) => service.listUsers(args)
    }),

    tool({
      name: 'get_assetpanda_group_fields',
      description: 'Get all fields and their keys for a specific group in AssetPanda',
      schema: SCHEMAS.getGroupFieldsSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.getGroupFieldsSchema>) =>
        service.getGroupFields(args.group_id)
    }),

    tool({
      name: 'get_assetpanda_group_statuses',
      description: 'Get all available statuses and their IDs for a specific group in AssetPanda',
      schema: SCHEMAS.getGroupStatusesSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.getGroupStatusesSchema>) =>
        service.getGroupStatuses(args.group_id)
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

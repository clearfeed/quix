import { ToolConfig, ToolOperation, tool } from '@clearfeed-ai/quix-common-agent';
import { AssetPandaService } from './index';
import { AssetPandaConfig } from './types';
import { SCHEMAS } from './schema';
import { z } from 'zod';

const ASSETPANDA_TOOL_SELECTION_PROMPT = `
AssetPanda is an asset management platform that manages:
- Employees and users
- Hardware assets (laptops, monitors, etc.)
- Software licenses
- Asset assignments and reservations

Use AssetPanda tools when the user wants to manage IT assets, assign hardware/software to employees, or track asset inventory.`;

const ASSETPANDA_RESPONSE_PROMPT = `When formatting AssetPanda responses be sure to mention object IDs, employee emails, and asset names. For asset assignments, include the asset name and assigned employee. For license management, include available seats and assigned users.`;

export function createAssetPandaToolsExport(config: AssetPandaConfig): ToolConfig {
  const service = new AssetPandaService(config);

  const tools = [
    // Create Employee Record
    tool({
      name: 'create_assetpanda_employee',
      description:
        'Create a new employee record in AssetPanda. If the employee already exists, returns the existing record.',
      schema: SCHEMAS.createEmployeeSchema,
      operations: [ToolOperation.CREATE],
      func: async (args: z.infer<typeof SCHEMAS.createEmployeeSchema>) =>
        service.createEmployee(args)
    }),

    // Reserve Asset
    tool({
      name: 'reserve_assetpanda_asset',
      description:
        'Reserve an asset in AssetPanda for future assignment. Marks the asset as reserved status.',
      schema: SCHEMAS.reserveAssetSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.reserveAssetSchema>) => service.reserveAsset(args)
    }),

    // Assign Asset to User
    tool({
      name: 'assign_assetpanda_asset_to_user',
      description: 'Assign a hardware asset to a specific employee in AssetPanda.',
      schema: SCHEMAS.assignAssetToUserSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.assignAssetToUserSchema>) =>
        service.assignAssetToUser(args)
    }),

    // Mark Asset as Returned
    tool({
      name: 'mark_assetpanda_asset_returned',
      description:
        'Mark an asset as returned by an employee. Unassigns the asset and marks it as available.',
      schema: SCHEMAS.markAssetReturnedSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.markAssetReturnedSchema>) =>
        service.markAssetReturned(args)
    }),

    // Assign Software License
    tool({
      name: 'assign_assetpanda_software_license',
      description:
        'Assign a software license to an employee. Reduces available seats and adds employee to assigned users.',
      schema: SCHEMAS.assignSoftwareLicenseSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.assignSoftwareLicenseSchema>) =>
        service.assignSoftwareLicense(args)
    }),

    // Reclaim/Deallocate Software License
    tool({
      name: 'reclaim_assetpanda_software_license',
      description:
        'Reclaim a software license from an employee. Increases available seats and removes employee from assigned users.',
      schema: SCHEMAS.reclaimSoftwareLicenseSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof SCHEMAS.reclaimSoftwareLicenseSchema>) =>
        service.reclaimSoftwareLicense(args)
    }),

    // Check Asset Availability
    tool({
      name: 'check_assetpanda_asset_availability',
      description:
        'Check the availability of assets by type. Returns available assets matching the search criteria.',
      schema: SCHEMAS.checkAssetAvailabilitySchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.checkAssetAvailabilitySchema>) => {
        try {
          // Find the asset group
          const group = await service['findGroupByName'](args.group_name || 'Assets');
          if (!group) {
            return {
              success: false,
              error: `Asset group not found: ${args.group_name || 'Assets'}`
            };
          }

          // Search for available assets
          const response = await service.searchObjects({
            group_id: group.id,
            search: args.asset_type,
            status: 'Available'
          });

          return response;
        } catch (error) {
          console.error('Error checking asset availability:', error);
          return {
            success: false,
            error: 'Failed to check asset availability'
          };
        }
      }
    }),

    // List Groups
    tool({
      name: 'list_assetpanda_groups',
      description: 'List all groups in AssetPanda (Assets, Licenses, Employees, etc.)',
      schema: SCHEMAS.listGroupsSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.listGroupsSchema>) => service.listGroups(args)
    }),

    // List Users
    tool({
      name: 'list_assetpanda_users',
      description: 'List all users/employees in AssetPanda',
      schema: SCHEMAS.listUsersSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof SCHEMAS.listUsersSchema>) => service.listUsers(args)
    }),

    // Search Objects
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

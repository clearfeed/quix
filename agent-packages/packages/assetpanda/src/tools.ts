import { tool } from '@langchain/core/tools';
import { ToolConfig, ToolOperation, QuixTool } from '@clearfeed-ai/quix-common-agent';
import { AssetPandaService } from './index';
import { AssetPandaConfig, SCHEMAS } from './types';
import { z } from 'zod';

const ASSETPANDA_TOOL_SELECTION_PROMPT = `
AssetPanda is an asset management platform. Use AssetPanda tools for:

**Employee Management:**
- Create employee records
- List users and employees

**Asset Operations:**
- Assign assets to users (requires group_id, object_id, status_field_key, employee_field_key, status_id, employee_id)
- Mark assets as returned (requires group_id, object_id, status_field_key, employee_field_key, status_id)
- Check asset availability by search terms

**Data Discovery:**
- List groups to find group IDs
- Get group fields and statuses for IDs and keys
- List objects within groups
- Get account settings

**Workflow:** Always get group/field/status info first, then use the IDs and keys in operations.
`;

const ASSETPANDA_RESPONSE_PROMPT = `When formatting AssetPanda responses be sure to mention object IDs, employee emails, and asset names. For asset assignments, include the asset name and assigned employee.`;

export function createAssetPandaToolsExport(config: AssetPandaConfig): ToolConfig {
  const service = new AssetPandaService(config);

  const tools: QuixTool[] = [
    {
      tool: tool(async () => service.getSettings(), {
        name: 'get_assetpanda_settings',
        description:
          'Get AssetPanda account settings including account ID, groups, and configuration',
        schema: SCHEMAS.getSettingsSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async () => service.listGroups(), {
        name: 'list_assetpanda_groups',
        description:
          'List all groups and their keys in AssetPanda (Assets, Licenses, Employees, etc.)',
        schema: z.object({})
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(
        async (args: z.infer<typeof SCHEMAS.listObjectsSchema>) => service.listObjects(args),
        {
          name: 'list_assetpanda_objects',
          description: 'List all objects in a specific AssetPanda group with pagination support',
          schema: SCHEMAS.listObjectsSchema
        }
      ),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(
        async (args: z.infer<typeof SCHEMAS.createEmployeeSchema>) => service.createEmployee(args),
        {
          name: 'create_assetpanda_employee',
          description:
            'Create a new employee record in AssetPanda. If the employee already exists, returns the existing record. The account ID will be automatically retrieved from settings.',
          schema: SCHEMAS.createEmployeeSchema
        }
      ),
      operations: [ToolOperation.CREATE]
    },

    {
      tool: tool(
        async (args: z.infer<typeof SCHEMAS.assignAssetToUserSchema>) =>
          service.assignAssetToUser(args),
        {
          name: 'assign_assetpanda_asset_to_user',
          description: 'Assign a hardware asset to a specific employee in AssetPanda.',
          schema: SCHEMAS.assignAssetToUserSchema
        }
      ),
      operations: [ToolOperation.UPDATE]
    },

    {
      tool: tool(
        async (args: z.infer<typeof SCHEMAS.markAssetReturnedSchema>) =>
          service.markAssetReturned(args),
        {
          name: 'mark_assetpanda_asset_returned',
          description:
            'Mark an asset as returned by an employee. Unassigns the asset and marks it as available.',
          schema: SCHEMAS.markAssetReturnedSchema
        }
      ),
      operations: [ToolOperation.UPDATE]
    },

    {
      tool: tool(
        async (args: z.infer<typeof SCHEMAS.checkAssetAvailabilitySchema>) => {
          return service.checkAssetAvailability(args);
        },
        {
          name: 'check_assetpanda_asset_availability',
          description:
            'Check the availability of assets by type. Returns available assets matching the search criteria.',
          schema: SCHEMAS.checkAssetAvailabilitySchema
        }
      ),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async (args: z.infer<typeof SCHEMAS.listUsersSchema>) => service.listUsers(args), {
        name: 'list_assetpanda_users',
        description: 'List all users/employees in AssetPanda',
        schema: SCHEMAS.listUsersSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(
        async (args: z.infer<typeof SCHEMAS.getGroupFieldsSchema>) =>
          service.getGroupFields(args.group_id),
        {
          name: 'get_assetpanda_group_fields',
          description: 'Get all fields and their keys for a specific group in AssetPanda',
          schema: SCHEMAS.getGroupFieldsSchema
        }
      ),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(
        async (args: z.infer<typeof SCHEMAS.getGroupStatusesSchema>) =>
          service.getGroupStatuses(args.group_id),
        {
          name: 'get_assetpanda_group_statuses',
          description:
            'Get all available statuses and their IDs for a specific group in AssetPanda',
          schema: SCHEMAS.getGroupStatusesSchema
        }
      ),
      operations: [ToolOperation.READ]
    }
  ];

  return {
    tools,
    prompts: {
      toolSelection: ASSETPANDA_TOOL_SELECTION_PROMPT,
      responseGeneration: ASSETPANDA_RESPONSE_PROMPT
    }
  };
}

import { tool } from '@langchain/core/tools';
import { ToolConfig, ToolOperation, Toolkit } from '@clearfeed-ai/quix-common-agent';
import { z } from 'zod';
import { BambooHRService } from './index';
import { BambooHRToolsConfig, SCHEMAS } from './types';
import { createToolHandler } from './utils';

const BAMBOOHR_TOOL_SELECTION_PROMPT = `
BambooHR is a human resources management platform. Use BambooHR tools for:

**Employee Management:**
- List all employees with their details (name, job title, department, manager, contact info)
- Get specific employee information including reporting structure
- View employee directory with contact details and photos

**Time Off Management:**
- Check employee leave balances (vacation, sick days, etc.)
- View time off requests and their status
- Create new time off requests for employees
- Track used time off year-to-date

**Employee Information:**
- Employee designations/job titles
- Manager/supervisor relationships
- Department and division information
- Work locations and contact details

**Workflow:** Use list_bamboohr_employees to get employee IDs, then use specific employee tools with those IDs for detailed operations.
`;

const BAMBOOHR_RESPONSE_PROMPT = `When formatting BambooHR responses, be sure to mention employee names, job titles, departments, and manager relationships. For time off information, include leave types, balances, and used amounts. Always present the information in a clear, organized format.`;

export function createBambooHRToolsExport(config: BambooHRToolsConfig): Toolkit {
  const service = new BambooHRService(config);
  const restrictedModeEnabled = config.restrictedModeEnabled === true;

  const toolConfigs: ToolConfig[] = [
    {
      tool: tool((args) => service.listEmployees(args), {
        name: 'list_bamboohr_employees',
        description:
          'List employees in BambooHR with their basic information including names, job titles, departments, managers, and contact details. Limited to 1000 employees by default to prevent large responses.',
        schema: SCHEMAS.listEmployeesSchema
      }),
      operations: [ToolOperation.READ],
      isSupportedInRestrictedMode: false
    },
    {
      tool: tool(
        createToolHandler(config, service, (args) => service.getEmployee(args)),
        {
          name: 'get_bamboohr_employee',
          description:
            'Get detailed information for a specific employee by their ID, including job title, manager, department, and contact information',
          schema: restrictedModeEnabled
            ? SCHEMAS.getEmployeeSchema.omit({ employeeId: true })
            : SCHEMAS.getEmployeeSchema
        }
      ),
      operations: [ToolOperation.READ],
      isSupportedInRestrictedMode: true
    },
    {
      tool: tool(
        createToolHandler(config, service, (args) => service.getEmployeeTimeOffBalance(args)),
        {
          name: 'get_bamboohr_employee_time_off_balance',
          description:
            'Get time off balances for a specific employee, showing available vacation days, sick days, and other leave types with used amounts',
          schema: restrictedModeEnabled
            ? SCHEMAS.getTimeOffBalanceSchema.omit({ employeeId: true })
            : SCHEMAS.getTimeOffBalanceSchema
        }
      ),
      operations: [ToolOperation.READ],
      isSupportedInRestrictedMode: true
    },
    {
      tool: tool(
        createToolHandler(config, service, (args) => service.getTimeOffRequests(args)),
        {
          name: 'get_bamboohr_time_off_requests_for_employee',
          description:
            'Retrieve time off requests for a specific employee. Requires employeeId. Optionally filter by date range and status. Shows request details, dates, amounts, and approval status',
          schema: restrictedModeEnabled
            ? SCHEMAS.getTimeOffRequestsSchema.omit({ employeeId: true })
            : SCHEMAS.getTimeOffRequestsSchema
        }
      ),
      operations: [ToolOperation.READ],
      isSupportedInRestrictedMode: true
    },

    {
      tool: tool(() => service.getTimeOffTypes(), {
        name: 'get_bamboohr_time_off_types',
        description:
          'Get all available time off types in BambooHR with their IDs, names, units, and icons. Use this before creating time off requests to know which type ID to use',
        schema: z.object({})
      }),
      operations: [ToolOperation.READ],
      isSupportedInRestrictedMode: true
    },
    {
      tool: tool(
        createToolHandler(config, service, (args) => service.createTimeOffRequest(args)),
        {
          name: 'create_bamboohr_time_off_request',
          description:
            'Create a new time off request for an employee. Requires employee ID, time off type ID, dates, and amount. Use get_bamboohr_time_off_types first to get available type IDs',
          schema: restrictedModeEnabled
            ? SCHEMAS.createTimeOffRequestSchema.omit({ employeeId: true })
            : SCHEMAS.createTimeOffRequestSchema
        }
      ),
      operations: [ToolOperation.CREATE],
      isSupportedInRestrictedMode: true
    }
  ];

  return {
    toolConfigs: restrictedModeEnabled
      ? toolConfigs.filter((tc) => tc.isSupportedInRestrictedMode === true)
      : toolConfigs,
    prompts: {
      toolSelection: BAMBOOHR_TOOL_SELECTION_PROMPT,
      responseGeneration: BAMBOOHR_RESPONSE_PROMPT
    }
  };
}

import { ToolConfig, ToolOperation, tool } from '@clearfeed-ai/quix-common-agent';
import { BambooHRService } from './index';
import { z } from 'zod';
import {
  BambooHRConfig,
  SCHEMAS,
  ListEmployeesParams,
  GetEmployeeParams,
  GetTimeOffBalanceParams,
  GetTimeOffRequestsParams,
  CreateTimeOffRequestParams
} from './types';

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

export function createBambooHRToolsExport(config: BambooHRConfig): ToolConfig {
  const service = new BambooHRService(config);

  const tools = [
    tool({
      name: 'list_bamboohr_employees',
      description:
        'List employees in BambooHR with their basic information including names, job titles, departments, managers, and contact details. Limited to 1000 employees by default to prevent large responses.',
      schema: SCHEMAS.listEmployeesSchema,
      operations: [ToolOperation.READ],
      func: async (args: ListEmployeesParams) => service.listEmployees(args)
    }),

    tool({
      name: 'get_bamboohr_employee',
      description:
        'Get detailed information for a specific employee by their ID, including job title, manager, department, and contact information',
      schema: SCHEMAS.getEmployeeSchema,
      operations: [ToolOperation.READ],
      func: async (args: GetEmployeeParams) => service.getEmployee(args)
    }),

    tool({
      name: 'get_bamboohr_employee_time_off_balance',
      description:
        'Get time off balances for a specific employee, showing available vacation days, sick days, and other leave types with used amounts',
      schema: SCHEMAS.getTimeOffBalanceSchema,
      operations: [ToolOperation.READ],
      func: async (args: GetTimeOffBalanceParams) => service.getEmployeeTimeOffBalance(args)
    }),

    tool({
      name: 'get_bamboohr_time_off_requests_for_employee',
      description:
        'Retrieve time off requests for a specific employee. Requires employeeId. Optionally filter by date range and status. Shows request details, dates, amounts, and approval status',
      schema: SCHEMAS.getTimeOffRequestsSchema,
      operations: [ToolOperation.READ],
      func: async (args: GetTimeOffRequestsParams) => service.getTimeOffRequests(args)
    }),

    tool({
      name: 'get_bamboohr_time_off_types',
      description:
        'Get all available time off types in BambooHR with their IDs, names, units, and icons. Use this before creating time off requests to know which type ID to use',
      schema: z.object({}),
      operations: [ToolOperation.READ],
      func: () => service.getTimeOffTypes()
    }),

    tool({
      name: 'create_bamboohr_time_off_request',
      description:
        'Create a new time off request for an employee. Requires employee ID, time off type ID, dates, and amount. Use get_bamboohr_time_off_types first to get available type IDs',
      schema: SCHEMAS.createTimeOffRequestSchema,
      operations: [ToolOperation.CREATE],
      func: async (args: CreateTimeOffRequestParams) => service.createTimeOffRequest(args)
    })
  ];

  return {
    tools,
    prompts: {
      toolSelection: BAMBOOHR_TOOL_SELECTION_PROMPT,
      responseGeneration: BAMBOOHR_RESPONSE_PROMPT
    }
  };
}
